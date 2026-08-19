'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  AllScores,
  AuthState,
  Criteria,
  EventInfo,
  Judge,
  JudgeGeneralNotes,
  Participant,
  ParticipantRecap,
} from '../types/scoring';
import {
  COMPETITION_PRESETS,
  DEFAULT_CRITERIA,
  DEFAULT_JUDGES,
  DEFAULT_PARTICIPANTS,
  EVENT_INFO,
} from '../data/competitionDefaults';
import {
  isSupabaseConfigured,
  fetchAllEventDataFromSupabase,
  saveJudgeScoreToSupabase,
  saveMasterScoresToSupabase,
  subscribeToEventChanges,
  MasterPayload,
} from '../lib/supabaseClient';

interface ScoreContextType {
  activeEventId: string;
  switchEvent: (presetKey: string) => void;
  judges: Judge[];
  participants: Participant[];
  criteria: Criteria[];
  eventInfo: EventInfo;
  scores: AllScores;
  judgeNotes: JudgeGeneralNotes;
  activeJudgeId: string;
  setActiveJudgeId: (id: string) => void;
  authState: AuthState;
  loginWithPin: (pin: string) => { success: boolean; role?: 'juri' | 'admin'; message?: string };
  logout: () => void;
  updateCriteriaScore: (
    judgeId: string,
    participantId: string,
    criteriaId: string,
    score: number
  ) => void;
  updateParticipantNotes: (
    judgeId: string,
    participantId: string,
    notes: string
  ) => void;
  updateJudgeGeneralNotes: (judgeId: string, notes: string) => void;
  getParticipantSubtotal: (judgeId: string, participantId: string) => number;
  recapData: ParticipantRecap[];
  loadDemoData: () => void;
  resetAllData: () => void;
  exportJSON: () => void;
  importJSON: (jsonString: string) => boolean;
  isLoaded: boolean;
  isRealtimeConnected: boolean;
  lockedCards: Record<string, boolean>;
  toggleCardLock: (judgeId: string, participantId: string) => void;
  lockAllCardsForJudge: (judgeId: string) => void;
  isCardLocked: (judgeId: string, participantId: string) => boolean;
  // Admin Competition Config Methods
  updateEventInfo: (newInfo: Partial<EventInfo>) => void;
  updateCriteria: (newCriteria: Criteria[]) => void;
  updateParticipants: (newParticipants: Participant[]) => void;
  generateParticipantsCount: (count: number) => void;
  updateJudges: (newJudges: Judge[]) => void;
  toggleMasterSystemLock: (locked?: boolean) => void;
  toggleParticipantAttendance: (participantId: string, isAttending?: boolean) => void;
  setBulkAttendance: (attendanceMap: Record<string, boolean>) => void;
}

const STORAGE_KEY_ACTIVE_JURI = 'lomba_active_juri_v1';
const STORAGE_KEY_AUTH = 'lomba_auth_v1';

const getStorageKey = (base: string, eventId: string) => `${base}_${eventId}`;

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

const normalizeScores = (rawScores: Record<string, any>): Record<string, any> => {
  if (!rawScores || typeof rawScores !== 'object') return {};
  const normalized: Record<string, any> = {};
  const sortedJudgeKeys = Object.keys(rawScores).sort();

  for (const jId of sortedJudgeKeys) {
    normalized[jId] = {};
    const pDict = rawScores[jId] || {};
    if (typeof pDict !== 'object') continue;
    const sortedPKeys = Object.keys(pDict).sort();

    for (const rawPKey of sortedPKeys) {
      const cleanPKey = String(rawPKey || '').replace('p_', '');
      const item = pDict[rawPKey];
      if (item && item.scores && typeof item.scores === 'object') {
        const criteriaScores: Record<string, number> = {};
        for (const cKey of Object.keys(item.scores)) {
          criteriaScores[cKey] = Number(item.scores[cKey] || 0);
        }
        normalized[jId][cleanPKey] = {
          scores: criteriaScores,
          notes: item.notes || '',
        };
      }
    }
  }
  return normalized;
};

const sanitizeParticipantList = (list: Participant[], isSepedaHias: boolean): Participant[] => {
  if (!list) return [];
  return list.map((p, idx) => {
    let cleanCode = (p.code || '').trim();
    let cleanName = (p.name || '').trim();

    // For Sepeda Hias or if code contains 'Peserta ', convert code to 3-digit number (e.g. 001)
    if (isSepedaHias || cleanCode.toLowerCase().includes('peserta')) {
      const numMatch = cleanCode.match(/\d+/) || cleanName.match(/\d+/) || [String(idx + 1)];
      const num = Number(numMatch[0]);
      const formattedNum = num < 10 ? `00${num}` : num < 100 ? `0${num}` : `${num}`;
      cleanCode = formattedNum;
      cleanName = `Peserta ${formattedNum}`;
    }

    const defaultRt = `RT 0${(idx % 6) + 1}`;

    return {
      ...p,
      code: cleanCode,
      name: cleanName,
      rt: p.rt || (isSepedaHias ? defaultRt : undefined),
      isAttending: p.isAttending !== undefined ? p.isAttending : true,
    };
  });
};

const getInitialEventId = (): string => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlEvent = params.get('event');
    if (urlEvent && COMPETITION_PRESETS[urlEvent]) {
      return urlEvent;
    }
  }
  return 'sepeda-hias';
};

export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEventId, setActiveEventId] = useState<string>(getInitialEventId);

  const activePreset = COMPETITION_PRESETS[activeEventId] || COMPETITION_PRESETS['sepeda-hias'];

  const [eventInfo, setEventInfo] = useState<EventInfo>(activePreset.eventInfo);
  const [criteria, setCriteria] = useState<Criteria[]>(activePreset.criteria);
  const [participants, setParticipants] = useState<Participant[]>(activePreset.participants);
  const [judges, setJudges] = useState<Judge[]>(activePreset.judges);

  const [scores, setScores] = useState<AllScores>({});
  const [judgeNotes, setJudgeNotes] = useState<JudgeGeneralNotes>({});
  const [activeJudgeId, setActiveJudgeId] = useState<string>(activePreset.judges[0]?.id || 'juri_rt01');
  const [authState, setAuthState] = useState<AuthState>({ role: 'guest' });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [lockedCards, setLockedCards] = useState<Record<string, boolean>>({});
  const [lastResetTs, setLastResetTs] = useState<number>(0);

  const activeEventIdRef = useRef<string>(activeEventId);
  useEffect(() => {
    activeEventIdRef.current = activeEventId;
  }, [activeEventId]);

  // Timestamp of last local slider interaction to prevent polling race-condition flickering
  const lastLocalInteractionRef = useRef<number>(0);

  const scoresRef = useRef<AllScores>({});
  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  // Always-fresh judgeNotes ref — prevents stale closure inside setScores updaters
  const judgeNotesRef = useRef<JudgeGeneralNotes>({});
  useEffect(() => {
    judgeNotesRef.current = judgeNotes;
  }, [judgeNotes]);

  const authStateRef = useRef<AuthState>({ role: 'guest' });
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

  const activeJudgeIdRef = useRef<string>(activeJudgeId);
  useEffect(() => {
    activeJudgeIdRef.current = activeJudgeId;
  }, [activeJudgeId]);

  const judgesRef = useRef<Judge[]>(judges);
  useEffect(() => {
    judgesRef.current = judges;
  }, [judges]);

  const lastResetTsRef = useRef<number>(lastResetTs);
  useEffect(() => {
    lastResetTsRef.current = lastResetTs;
  }, [lastResetTs]);

  // Detect URL parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlEvent = params.get('event');
      if (urlEvent && COMPETITION_PRESETS[urlEvent]) {
        setActiveEventId(urlEvent);
        const p = COMPETITION_PRESETS[urlEvent];
        setEventInfo(p.eventInfo);
        setCriteria(p.criteria);
        setParticipants(p.participants);
        setJudges(p.judges);
        if (p.judges.length > 0) setActiveJudgeId(p.judges[0].id);
      }
    }
  }, []);

  const switchEvent = useCallback((presetKey: string) => {
    const targetPreset = COMPETITION_PRESETS[presetKey] || COMPETITION_PRESETS['blind-rias'];
    setActiveEventId(presetKey);
    setEventInfo(targetPreset.eventInfo);
    setCriteria(targetPreset.criteria);
    setParticipants(targetPreset.participants);
    setJudges(targetPreset.judges);
    if (targetPreset.judges.length > 0) {
      setActiveJudgeId(targetPreset.judges[0].id);
    }
    setScores({});
    setJudgeNotes({});
    setLockedCards({});

    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?event=${presetKey}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  }, []);

  const isCardLocked = useCallback((judgeId: string, participantId: string): boolean => {
    // If master system is locked by admin, ALL cards are locked!
    if (eventInfo.isSystemLocked) return true;
    const key = `${judgeId}_${participantId}`;
    return Boolean(lockedCards[key]);
  }, [eventInfo.isSystemLocked, lockedCards]);

  const syncConfigToServer = useCallback(async (newConfig: any) => {
    try {
      const curEventId = activeEventIdRef.current;
      localStorage.setItem(getStorageKey('lomba_event_config_v1', curEventId), JSON.stringify(newConfig));
      await saveMasterScoresToSupabase(
        scoresRef.current,
        judgeNotesRef.current,
        0,
        false,
        newConfig,
        undefined,
        curEventId
      );
    } catch (e) {
      console.error('Failed to sync config to Supabase', e);
    }
  }, []);

  const updateEventInfo = useCallback((newInfo: Partial<EventInfo>) => {
    setEventInfo(prev => {
      const next = { ...prev, ...newInfo };
      syncConfigToServer({ eventInfo: next, criteria, participants, judges });
      return next;
    });
  }, [criteria, participants, judges, syncConfigToServer]);

  const updateCriteria = useCallback((newCriteria: Criteria[]) => {
    setCriteria(newCriteria);
    syncConfigToServer({ eventInfo, criteria: newCriteria, participants, judges });
  }, [eventInfo, participants, judges, syncConfigToServer]);

  const updateParticipants = useCallback((newParticipants: Participant[]) => {
    setParticipants(newParticipants);
    syncConfigToServer({ eventInfo, criteria, participants: newParticipants, judges });
  }, [eventInfo, criteria, judges, syncConfigToServer]);

  const generateParticipantsCount = useCallback((count: number) => {
    const validCount = Math.max(1, Math.min(500, count));
    const newParticipants: Participant[] = Array.from({ length: validCount }, (_, i) => {
      const num = i + 1;
      const formattedNum = num < 10 ? `00${num}` : num < 100 ? `0${num}` : `${num}`;
      const rtNum = (i % 6) + 1;
      return {
        id: `p_${formattedNum}`,
        code: formattedNum,
        name: `Peserta ${formattedNum}`,
        rt: `RT 0${rtNum}`,
        isAttending: true,
      };
    });
    updateParticipants(newParticipants);
  }, [updateParticipants]);

  const updateJudges = useCallback((newJudges: Judge[]) => {
    setJudges(newJudges);
    syncConfigToServer({ eventInfo, criteria, participants, judges: newJudges });
  }, [eventInfo, criteria, participants, syncConfigToServer]);

  const toggleParticipantAttendance = useCallback((participantId: string, targetAttending?: boolean) => {
    setParticipants(prev => {
      const next = prev.map(p => {
        if (p.id === participantId) {
          const nextState = targetAttending !== undefined ? targetAttending : !(p.isAttending !== false);
          return { ...p, isAttending: nextState };
        }
        return p;
      });
      syncConfigToServer({ eventInfo, criteria, participants: next, judges });
      return next;
    });
  }, [eventInfo, criteria, judges, syncConfigToServer]);

  const setBulkAttendance = useCallback((attendanceMap: Record<string, boolean>) => {
    setParticipants(prev => {
      const next = prev.map(p => {
        if (attendanceMap[p.id] !== undefined) {
          return { ...p, isAttending: attendanceMap[p.id] };
        }
        return p;
      });
      syncConfigToServer({ eventInfo, criteria, participants: next, judges });
      return next;
    });
  }, [eventInfo, criteria, judges, syncConfigToServer]);

  const lockAllCardsForJudge = useCallback((judgeId: string) => {
    setLockedCards(prev => {
      const next = { ...prev };
      participants.forEach((p) => {
        const key = `${judgeId}_${p.id}`;
        next[key] = true;
      });
      const curEventId = activeEventIdRef.current;
      try {
        localStorage.setItem(getStorageKey('lomba_locked_cards_v1', curEventId), JSON.stringify(next));
      } catch (e) {}

      saveMasterScoresToSupabase(
        scoresRef.current,
        judgeNotesRef.current,
        0,
        false,
        undefined,
        next,
        curEventId
      ).catch((e) => console.error('Failed to post lock all scores', e));

      return next;
    });
  }, [participants]);

  const toggleMasterSystemLock = useCallback((locked?: boolean) => {
    setEventInfo(prev => {
      const nextLocked = locked !== undefined ? locked : !prev.isSystemLocked;
      const next = { ...prev, isSystemLocked: nextLocked };
      syncConfigToServer({ eventInfo: next, criteria, participants, judges });
      return next;
    });
  }, [criteria, participants, judges, syncConfigToServer]);

  const toggleCardLock = useCallback((judgeId: string, participantId: string) => {
    const key = `${judgeId}_${participantId}`;
    const currentlyLocked = Boolean(lockedCards[key]);
    const currentRole = authStateRef.current.role;

    if (currentRole === 'juri' && currentlyLocked) {
      alert('🔒 Nilai peserta ini telah dikunci permanen. Untuk perubahan nilai, silakan hubungi Admin Panitia.');
      return;
    }

    setLockedCards(prev => {
      const nextLocked = !currentlyLocked;
      const next = { ...prev, [key]: nextLocked };
      const curEventId = activeEventIdRef.current;
      try {
        localStorage.setItem(getStorageKey('lomba_locked_cards_v1', curEventId), JSON.stringify(next));
      } catch (e) {}

      saveMasterScoresToSupabase(
        scoresRef.current,
        judgeNotesRef.current,
        0,
        false,
        undefined,
        next,
        curEventId
      ).catch((e) => console.error('Failed to post card lock score', e));

      return next;
    });
  }, [lockedCards]);

  // Handler for merging data received directly from Supabase (Realtime or Direct REST)
  const applyRemoteData = useCallback((data: MasterPayload) => {
    const curEventId = activeEventIdRef.current;

    if (data.config) {
      if (data.config.eventInfo) setEventInfo(data.config.eventInfo);
      if (data.config.criteria) setCriteria(data.config.criteria);
      if (data.config.participants) setParticipants(data.config.participants);
      if (data.config.judges) setJudges(data.config.judges);
    }

    if (data.lockedCards && Object.keys(data.lockedCards).length > 0) {
      setLockedCards(prev => {
        const mergedLocks = { ...prev, ...data.lockedCards };
        if (JSON.stringify(prev) === JSON.stringify(mergedLocks)) return prev;
        return mergedLocks;
      });
    }

    if (data.resetTimestamp && data.resetTimestamp > lastResetTsRef.current && lastResetTsRef.current > 0) {
      setLastResetTs(data.resetTimestamp);
      setScores({});
      setJudgeNotes({});
      setLockedCards({});
      try {
        localStorage.setItem(getStorageKey('lomba_last_reset_ts_v1', curEventId), String(data.resetTimestamp));
        localStorage.removeItem(getStorageKey('lomba_scores_v1', curEventId));
        localStorage.removeItem(getStorageKey('lomba_notes_v1', curEventId));
        localStorage.removeItem(getStorageKey('lomba_locked_cards_v1', curEventId));
      } catch (e) {}
      return;
    }

    let serverScores = normalizeScores(data.scores || {});
    let serverNotes = data.judgeNotes || {};

    if (Object.keys(serverScores).length > 0) {
      setScores(prev => {
        const now = Date.now();
        const isRecentlyEdited = now - lastLocalInteractionRef.current < 8000;
        const currentAuthState = authStateRef.current;
        const currentActiveJudgeId = activeJudgeIdRef.current;

        const mergedScores: Record<string, any> = { ...prev };

        for (const jId of Object.keys(serverScores)) {
          const isOwnJudgeData = currentAuthState.role === 'juri' && currentAuthState.judgeId === jId;
          const isRecentlyActiveJudge = isRecentlyEdited && jId === currentActiveJudgeId && prev[jId];

          const prevJudge = prev[jId] || {};
          const serverJudge = serverScores[jId] || {};
          const mergedJudge: Record<string, any> = { ...prevJudge };

          for (const pId of Object.keys(serverJudge)) {
            const prevParticipant = prevJudge[pId] || { scores: {} };
            const serverParticipant = serverJudge[pId] || { scores: {} };

            const prevCriteriaScores = prevParticipant.scores || {};
            const serverCriteriaScores = serverParticipant.scores || {};

            const mergedCriteria: Record<string, number> = { ...prevCriteriaScores };

            for (const cId of Object.keys(serverCriteriaScores)) {
              const serverVal = serverCriteriaScores[cId];
              if (isOwnJudgeData || isRecentlyActiveJudge) {
                const localVal = prevCriteriaScores[cId];
                if (typeof localVal === 'number' && localVal > 0) {
                  mergedCriteria[cId] = localVal;
                } else if (typeof serverVal === 'number' && serverVal > 0) {
                  mergedCriteria[cId] = serverVal;
                }
              } else {
                if (typeof serverVal === 'number' && serverVal > 0) {
                  mergedCriteria[cId] = serverVal;
                }
              }
            }

            mergedJudge[pId] = {
              ...prevParticipant,
              ...serverParticipant,
              scores: mergedCriteria,
              notes: serverParticipant.notes || prevParticipant.notes || '',
            };
          }

          mergedScores[jId] = mergedJudge;
        }

        const nextScores = normalizeScores(mergedScores);
        const prevNorm = normalizeScores(prev);

        if (JSON.stringify(prevNorm) === JSON.stringify(nextScores)) {
          return prev;
        }
        return nextScores;
      });
    }

    if (Object.keys(serverNotes).length > 0) {
      setJudgeNotes(prev => {
        const mergedNotes = { ...prev, ...serverNotes };
        if (JSON.stringify(prev) === JSON.stringify(mergedNotes)) {
          return prev;
        }
        return mergedNotes;
      });
    }
    setIsRealtimeConnected(true);
  }, []);

  // Direct Supabase Fetch & Realtime Subscription (0 Vercel Serverless Function Cost!)
  useEffect(() => {
    const curEventId = activeEventIdRef.current;

    if (isSupabaseConfigured) {
      // Initial direct Supabase fetch
      fetchAllEventDataFromSupabase(curEventId).then((data) => {
        if (data) {
          applyRemoteData(data);
        }
      });

      // Subscribe to Supabase Realtime Channel
      const unsubscribe = subscribeToEventChanges(curEventId, (data) => {
        if (data) {
          applyRemoteData(data);
        }
      });

      // Low frequency safety net poll (every 25s - direct REST to Supabase)
      const interval = setInterval(() => {
        fetchAllEventDataFromSupabase(curEventId).then((data) => {
          if (data) {
            applyRemoteData(data);
          }
        });
      }, 25000);

      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [activeEventId, applyRemoteData]);

  // Inter-tab local real-time sync via BroadcastChannel (0 network calls when testing locally!)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('lomba_local_sync_channel');
    channel.onmessage = (event) => {
      const data = event.data;
      if (data && data.eventId === activeEventIdRef.current && data.type === 'LOCAL_SYNC') {
        if (data.reset) {
          setScores({});
          setJudgeNotes({});
          setLockedCards({});
        } else {
          if (data.scores) {
            setScores(prev => normalizeScores({ ...prev, ...data.scores }));
          }
          if (data.judgeNotes) {
            setJudgeNotes(prev => ({ ...prev, ...data.judgeNotes }));
          }
        }
      }
    };
    return () => {
      channel.close();
    };
  }, []);

  // Load initial Auth, Config, and Local Scores state
  useEffect(() => {
    try {
      const curEventId = activeEventIdRef.current;
      const savedActiveJuri = localStorage.getItem(STORAGE_KEY_ACTIVE_JURI);
      const savedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
      const savedLockedCards = localStorage.getItem(getStorageKey('lomba_locked_cards_v1', curEventId));
      const savedResetTs = localStorage.getItem(getStorageKey('lomba_last_reset_ts_v1', curEventId));
      const savedConfig = localStorage.getItem(getStorageKey('lomba_event_config_v1', curEventId));
      const savedScores = localStorage.getItem(getStorageKey('lomba_scores_v1', curEventId));
      const savedNotes = localStorage.getItem(getStorageKey('lomba_notes_v1', curEventId));

      if (savedActiveJuri && judgesRef.current.some(j => j.id === savedActiveJuri)) {
        setActiveJudgeId(savedActiveJuri);
      }
      if (savedAuth) setAuthState(JSON.parse(savedAuth));
      if (savedLockedCards) setLockedCards(JSON.parse(savedLockedCards));
      if (savedResetTs) setLastResetTs(Number(savedResetTs));
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.eventInfo) setEventInfo(parsed.eventInfo);
        if (parsed.criteria) setCriteria(parsed.criteria);
        if (parsed.participants) setParticipants(parsed.participants);
        if (parsed.judges) setJudges(parsed.judges);
      }

      if (savedScores) {
        const parsedScores = normalizeScores(JSON.parse(savedScores));
        if (Object.keys(parsedScores).length > 0) {
          setScores(parsedScores);
        }
      }
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        if (Object.keys(parsedNotes).length > 0) {
          setJudgeNotes(parsedNotes);
        }
      }
    } catch (e) {
      console.error('Failed to load storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, [activeEventId]);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveAndSync = useCallback(async (
    newScores: AllScores,
    newNotes: JudgeGeneralNotes,
    reset = false,
    judgeId?: string
  ) => {
    lastLocalInteractionRef.current = Date.now();
    const curEventId = activeEventIdRef.current;

    try {
      if (reset) {
        localStorage.removeItem(getStorageKey('lomba_scores_v1', curEventId));
        localStorage.removeItem(getStorageKey('lomba_notes_v1', curEventId));
        localStorage.removeItem(getStorageKey('lomba_locked_cards_v1', curEventId));
      } else {
        localStorage.setItem(getStorageKey('lomba_scores_v1', curEventId), JSON.stringify(newScores));
        localStorage.setItem(getStorageKey('lomba_notes_v1', curEventId), JSON.stringify(newNotes));
      }
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    // Broadcast changes locally across browser tabs
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('lomba_local_sync_channel');
        channel.postMessage({
          type: 'LOCAL_SYNC',
          eventId: curEventId,
          scores: newScores,
          judgeNotes: newNotes,
          reset,
        });
        channel.close();
      } catch (e) {}
    }

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    if (isSupabaseConfigured) {
      if (reset) {
        saveMasterScoresToSupabase({}, {}, Date.now(), true, undefined, undefined, curEventId)
          .catch(e => console.error('Failed to reset Supabase', e));
      } else {
        const jitter = Math.floor(Math.random() * 300);
        syncTimeoutRef.current = setTimeout(async () => {
          try {
            if (judgeId) {
              const jScores = newScores[judgeId] || {};
              const jNote = newNotes[judgeId] || '';
              await saveJudgeScoreToSupabase(curEventId, judgeId, jScores, jNote);
            } else {
              await saveMasterScoresToSupabase(
                newScores,
                newNotes,
                0,
                false,
                undefined,
                lockedCards,
                curEventId
              );
            }
          } catch (e) {
            console.error('Failed to sync to Supabase', e);
          }
        }, 1500 + jitter);
      }
    }
  }, [lockedCards]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_JURI, activeJudgeId);
    } catch (e) {
      console.error('Failed to save active juri', e);
    }
  }, [activeJudgeId, isLoaded]);

  const loginWithPin = useCallback(
    (pin: string) => {
      const cleanPin = pin.trim();

      if (cleanPin === eventInfo.adminPin) {
        const nextAuth: AuthState = {
          role: 'admin',
          judgeName: 'Panitia (Admin Master)',
        };
        setAuthState(nextAuth);
        try {
          localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(nextAuth));
        } catch (e) {}
        return { success: true, role: 'admin' as const, message: 'Berhasil login sebagai Admin Panitia' };
      }

      const foundJudge = judges.find(j => j.pin === cleanPin);

      if (foundJudge) {
        const nextAuth: AuthState = {
          role: 'juri',
          judgeId: foundJudge.id,
          judgeName: foundJudge.name,
        };
        setAuthState(nextAuth);
        setActiveJudgeId(foundJudge.id);
        try {
          localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(nextAuth));
          localStorage.setItem(STORAGE_KEY_ACTIVE_JURI, foundJudge.id);
        } catch (e) {}

        return {
          success: true,
          role: 'juri' as const,
          message: `Berhasil login sebagai ${foundJudge.name}`,
        };
      }

      return { success: false, message: 'PIN yang Anda masukkan salah. Periksa kembali!' };
    },
    [eventInfo.adminPin, judges]
  );

  const logout = useCallback(() => {
    const nextAuth: AuthState = { role: 'guest' };
    setAuthState(nextAuth);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(nextAuth));
    } catch (e) {}
  }, []);

  const saveToLocalStorageOnly = useCallback((
    newScores: AllScores,
    newNotes: JudgeGeneralNotes
  ) => {
    lastLocalInteractionRef.current = Date.now();
    const curEventId = activeEventIdRef.current;
    try {
      localStorage.setItem(getStorageKey('lomba_scores_v1', curEventId), JSON.stringify(newScores));
      localStorage.setItem(getStorageKey('lomba_notes_v1', curEventId), JSON.stringify(newNotes));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, []);

  const updateCriteriaScore = useCallback(
    (judgeId: string, participantId: string, criteriaId: string, score: number) => {
      const targetCriteria = criteria.find(c => c.id === criteriaId);
      const maxScore = targetCriteria ? targetCriteria.maxScore : 100;
      const validScore = Math.min(maxScore, Math.max(0, score));

      setScores((prev) => {
        const judgeData = prev[judgeId] || {};
        const participantData = judgeData[participantId] || { scores: {} };
        const criteriaScores = participantData.scores || {};

        const next: AllScores = {
          ...prev,
          [judgeId]: {
            ...judgeData,
            [participantId]: {
              ...participantData,
              scores: {
                ...criteriaScores,
                [criteriaId]: validScore,
              },
            },
          },
        };

        saveToLocalStorageOnly(next, judgeNotesRef.current);
        return next;
      });
    },
    [criteria, saveToLocalStorageOnly]
  );

  const updateParticipantNotes = useCallback(
    (judgeId: string, participantId: string, notes: string) => {
      setScores((prev) => {
        const judgeData = prev[judgeId] || {};
        const participantData = judgeData[participantId] || { scores: {} };

        const next: AllScores = {
          ...prev,
          [judgeId]: {
            ...judgeData,
            [participantId]: {
              ...participantData,
              notes,
            },
          },
        };

        saveToLocalStorageOnly(next, judgeNotesRef.current);
        return next;
      });
    },
    [saveToLocalStorageOnly]
  );

  const updateJudgeGeneralNotes = useCallback(
    (judgeId: string, notes: string) => {
      setJudgeNotes((prev) => {
        const next = { ...prev, [judgeId]: notes };
        saveToLocalStorageOnly(scoresRef.current, next);
        return next;
      });
    },
    [saveToLocalStorageOnly]
  );

  const getParticipantSubtotal = useCallback(
    (judgeId: string, participantId: string): number => {
      const pData = scores[judgeId]?.[participantId];
      if (!pData || !pData.scores) return 0;
      return Object.values(pData.scores).reduce((acc, curr) => acc + (curr || 0), 0);
    },
    [scores]
  );

  const recapData: ParticipantRecap[] = useMemo(() => {
    const isSepedaHias = activeEventId === 'sepeda-hias';
    const rawRecaps = participants.map((participant) => {
      const scoresByJudge: { [judgeId: string]: number | 'N/A' } = {};
      let totalScore = 0;
      let validJudgeCount = 0;

      judges.forEach((judge) => {
        let isSelf = false;
        if (!isSepedaHias) {
          isSelf = Boolean(
            (judge?.code && participant?.code && judge.code === participant.code) ||
            (judge?.name && participant?.name && judge.name === participant.name)
          );
        } else {
          if (participant?.rt) {
            const cleanRt = String(participant.rt || '').trim().toLowerCase();
            const judgeCode = String(judge?.code || '').trim().toLowerCase();
            const judgeName = String(judge?.name || '').trim().toLowerCase();
            isSelf = Boolean(cleanRt) && (judgeCode.includes(cleanRt) || judgeName.includes(cleanRt));
          }
        }

        if (isSelf) {
          scoresByJudge[judge.id] = 'N/A';
        } else {
          const subtotal = getParticipantSubtotal(judge.id, participant.id);
          scoresByJudge[judge.id] = subtotal;
          totalScore += subtotal;
          validJudgeCount += 1;
        }
      });

      const averageScore =
        validJudgeCount > 0
          ? Number((totalScore / validJudgeCount).toFixed(1))
          : 0;

      return {
        participantId: participant.id,
        participantCode: participant.code,
        participantName: participant.name,
        participantRt: participant.rt,
        isAttending: participant.isAttending !== false,
        scoresByJudge,
        totalScore,
        validJudgeCount,
        averageScore,
        rank: 0,
      };
    });

    const sorted = [...rawRecaps].sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.totalScore - a.totalScore;
    });

    sorted.forEach((item, index) => {
      item.rank = index + 1;
    });

    return sorted;
  }, [participants, judges, getParticipantSubtotal]);

  const loadDemoData = useCallback(() => {
    const demoScores: AllScores = {};
    const demoNotes: JudgeGeneralNotes = {};

    judges.forEach((j) => {
      demoScores[j.id] = {};
      participants.forEach((p) => {
        if (j.code !== p.code) {
          const cScores: { [cId: string]: number } = {};
          criteria.forEach((c) => {
            const minRatio = 0.7;
            const randomRatio = minRatio + Math.random() * (1 - minRatio);
            cScores[c.id] = Math.round(c.maxScore * randomRatio);
          });
          demoScores[j.id][p.id] = { scores: cScores };
        }
      });
      demoNotes[j.id] = `Penilaian demo otomatis untuk ${j.name}.`;
    });

    setScores(demoScores);
    setJudgeNotes(demoNotes);
    saveAndSync(demoScores, demoNotes);
  }, [judges, participants, criteria, saveAndSync]);

  const resetAllData = useCallback(() => {
    setScores({});
    setJudgeNotes({});
    setLockedCards({});

    // Buka system lock saat reset — tanpa ini isSystemLocked tetap true
    // dan semua input juri disabled meski data sudah di-reset
    setEventInfo(prev => ({ ...prev, isSystemLocked: false }));

    const newTs = Date.now();
    setLastResetTs(newTs);
    try {
      localStorage.setItem(getStorageKey('lomba_last_reset_ts_v1', activeEventIdRef.current), String(newTs));
      // Hapus config lama dari localStorage agar isSystemLocked tidak kembali saat reload
      localStorage.removeItem(getStorageKey('lomba_event_config_v1', activeEventIdRef.current));
    } catch (e) {}
    saveAndSync({}, {}, true);
  }, [saveAndSync]);

  const exportJSON = useCallback(() => {
    const backupObj = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      eventInfo,
      criteria,
      participants,
      judges,
      scores,
      judgeNotes,
      lockedCards,
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_${eventInfo.competitionTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [eventInfo, criteria, participants, judges, scores, judgeNotes, lockedCards]);

  const importJSON = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.eventInfo) setEventInfo(parsed.eventInfo);
      if (parsed.criteria) setCriteria(parsed.criteria);
      if (parsed.participants) setParticipants(parsed.participants);
      if (parsed.judges) setJudges(parsed.judges);

      if (parsed.scores) {
        const normScores = normalizeScores(parsed.scores);
        setScores(normScores);
      }
      if (parsed.judgeNotes) setJudgeNotes(parsed.judgeNotes);
      if (parsed.lockedCards) setLockedCards(parsed.lockedCards);

      saveAndSync(parsed.scores || {}, parsed.judgeNotes || {});
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }, [saveAndSync]);

  return (
    <ScoreContext.Provider
      value={{
        activeEventId,
        switchEvent,
        judges,
        participants,
        criteria,
        eventInfo,
        scores,
        judgeNotes,
        activeJudgeId,
        setActiveJudgeId,
        authState,
        loginWithPin,
        logout,
        updateCriteriaScore,
        updateParticipantNotes,
        updateJudgeGeneralNotes,
        getParticipantSubtotal,
        recapData,
        loadDemoData,
        resetAllData,
        exportJSON,
        importJSON,
        isLoaded,
        isRealtimeConnected,
        lockedCards,
        toggleCardLock,
        lockAllCardsForJudge,
        isCardLocked,
        updateEventInfo,
        updateCriteria,
        updateParticipants,
        generateParticipantsCount,
        updateJudges,
        toggleMasterSystemLock,
        toggleParticipantAttendance,
        setBulkAttendance,
      }}
    >
      {children}
    </ScoreContext.Provider>
  );
};

export const useScore = () => {
  const context = useContext(ScoreContext);
  if (!context) {
    throw new Error('useScore must be used within a ScoreProvider');
  }
  return context;
};
