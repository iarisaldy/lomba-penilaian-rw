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
  DEFAULT_CRITERIA,
  DEFAULT_JUDGES,
  DEFAULT_PARTICIPANTS,
  EVENT_INFO,
} from '../data/competitionDefaults';

interface ScoreContextType {
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
  isCardLocked: (judgeId: string, participantId: string) => boolean;
  // Admin Competition Config Methods
  updateEventInfo: (newInfo: Partial<EventInfo>) => void;
  updateCriteria: (newCriteria: Criteria[]) => void;
  updateParticipants: (newParticipants: Participant[]) => void;
  updateJudges: (newJudges: Judge[]) => void;
  toggleMasterSystemLock: (locked?: boolean) => void;
}

const STORAGE_KEY_SCORES = 'lomba_scores_v1';
const STORAGE_KEY_NOTES = 'lomba_notes_v1';
const STORAGE_KEY_ACTIVE_JURI = 'lomba_active_juri_v1';
const STORAGE_KEY_AUTH = 'lomba_auth_v1';
const STORAGE_KEY_LOCKED_CARDS = 'lomba_locked_cards_v1';
const STORAGE_KEY_RESET_TS = 'lomba_last_reset_ts_v1';
const STORAGE_KEY_CONFIG = 'lomba_event_config_v1';

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

const normalizeScores = (rawScores: Record<string, any>): Record<string, any> => {
  if (!rawScores) return {};
  const normalized: Record<string, any> = {};
  const sortedJudgeKeys = Object.keys(rawScores).sort();

  for (const jId of sortedJudgeKeys) {
    normalized[jId] = {};
    const pDict = rawScores[jId] || {};
    const sortedPKeys = Object.keys(pDict).sort();

    for (const rawPKey of sortedPKeys) {
      const cleanPKey = rawPKey.replace('p_', '');
      const item = pDict[rawPKey];
      if (item && item.scores) {
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

export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eventInfo, setEventInfo] = useState<EventInfo>(EVENT_INFO);
  const [criteria, setCriteria] = useState<Criteria[]>(DEFAULT_CRITERIA);
  const [participants, setParticipants] = useState<Participant[]>(DEFAULT_PARTICIPANTS);
  const [judges, setJudges] = useState<Judge[]>(DEFAULT_JUDGES);

  const [scores, setScores] = useState<AllScores>({});
  const [judgeNotes, setJudgeNotes] = useState<JudgeGeneralNotes>({});
  const [activeJudgeId, setActiveJudgeId] = useState<string>(DEFAULT_JUDGES[0].id);
  const [authState, setAuthState] = useState<AuthState>({ role: 'guest' });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [lockedCards, setLockedCards] = useState<Record<string, boolean>>({});
  const [lastResetTs, setLastResetTs] = useState<number>(0);

  // Timestamp of last local slider interaction to prevent polling race-condition flickering
  const lastLocalInteractionRef = useRef<number>(0);

  const scoresRef = useRef<AllScores>({});
  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  const authStateRef = useRef<AuthState>({ role: 'guest' });
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

  const activeJudgeIdRef = useRef<string>(activeJudgeId);
  useEffect(() => {
    activeJudgeIdRef.current = activeJudgeId;
  }, [activeJudgeId]);

  const isCardLocked = useCallback((judgeId: string, participantId: string): boolean => {
    // If master system is locked by admin, ALL cards are locked!
    if (eventInfo.isSystemLocked) return true;
    const key = `${judgeId}_${participantId}`;
    return Boolean(lockedCards[key]);
  }, [eventInfo.isSystemLocked, lockedCards]);

  const syncConfigToServer = useCallback(async (newConfig: any) => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
      });
    } catch (e) {
      console.error('Failed to sync config to server', e);
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

  const updateJudges = useCallback((newJudges: Judge[]) => {
    setJudges(newJudges);
    syncConfigToServer({ eventInfo, criteria, participants, judges: newJudges });
  }, [eventInfo, criteria, participants, syncConfigToServer]);

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

    // RULE: Juri can LOCK their card, but CANNOT UNLOCK once locked!
    // Only Admin can unlock individual cards or toggle master system lock.
    if (currentRole === 'juri' && currentlyLocked) {
      alert('🔒 Nilai RT ini telah dikunci permanen. Untuk perubahan nilai, silakan hubungi Admin Panitia.');
      return;
    }

    setLockedCards(prev => {
      const next = { ...prev, [key]: !currentlyLocked };
      try {
        localStorage.setItem(STORAGE_KEY_LOCKED_CARDS, JSON.stringify(next));
      } catch (e) {}

      // Sync lock status to server
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockedCards: next }),
      }).catch(() => {});

      return next;
    });
  }, [lockedCards]);

  // Poll /api/scores endpoint (1ms response time directly from server memory / Supabase)
  useEffect(() => {
    const fetchApiScores = async () => {
      try {
        const res = await fetch('/api/scores', { cache: 'no-store' });
        let data: {
          scores?: Record<string, any>;
          judgeNotes?: Record<string, any>;
          resetTimestamp?: number;
          config?: any;
          lockedCards?: Record<string, boolean>;
        } | null = null;
        if (res.ok) {
          data = await res.json();
        } else {
          setIsRealtimeConnected(false);
          return;
        }

        if (data) {
          // 1. Sync remote config if available
          if (data.config) {
            if (data.config.eventInfo) setEventInfo(data.config.eventInfo);
            if (data.config.criteria) setCriteria(data.config.criteria);
            if (data.config.participants) setParticipants(data.config.participants);
            if (data.config.judges) setJudges(data.config.judges);
          }

          // 2. Sync remote locked cards
          if (data.lockedCards && Object.keys(data.lockedCards).length > 0) {
            setLockedCards(prev => {
              const mergedLocks = { ...prev, ...data.lockedCards };
              if (JSON.stringify(prev) === JSON.stringify(mergedLocks)) return prev;
              return mergedLocks;
            });
          }

          // 3. If remote reset timestamp is newer, wipe local state!
          if (data.resetTimestamp && data.resetTimestamp > lastResetTs) {
            setLastResetTs(data.resetTimestamp);
            setScores({});
            setJudgeNotes({});
            setLockedCards({});
            try {
              localStorage.setItem(STORAGE_KEY_RESET_TS, String(data.resetTimestamp));
              localStorage.removeItem(STORAGE_KEY_SCORES);
              localStorage.removeItem(STORAGE_KEY_NOTES);
              localStorage.removeItem(STORAGE_KEY_LOCKED_CARDS);
            } catch (e) {}
            return;
          }

          let serverScores = normalizeScores(data.scores || {});
          let serverNotes = data.judgeNotes || {};

          // Synchronize with Central Server Master Scores with Accumulative Non-Zero Merge
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
        } else {
          setIsRealtimeConnected(false);
        }
      } catch (e) {
        setIsRealtimeConnected(false);
      }
    };

    fetchApiScores();
    const interval = setInterval(fetchApiScores, 3000);

    return () => clearInterval(interval);
  }, [lastResetTs, activeJudgeId]);

  // Load initial Auth & Config state
  useEffect(() => {
    try {
      const savedActiveJuri = localStorage.getItem(STORAGE_KEY_ACTIVE_JURI);
      const savedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
      const savedLockedCards = localStorage.getItem(STORAGE_KEY_LOCKED_CARDS);
      const savedResetTs = localStorage.getItem(STORAGE_KEY_RESET_TS);
      const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);

      if (savedActiveJuri && DEFAULT_JUDGES.some(j => j.id === savedActiveJuri)) {
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
    } catch (e) {
      console.error('Failed to load storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveAndSync = useCallback(async (newScores: AllScores, newNotes: JudgeGeneralNotes, reset = false) => {
    lastLocalInteractionRef.current = Date.now();

    try {
      if (reset) {
        localStorage.removeItem(STORAGE_KEY_SCORES);
        localStorage.removeItem(STORAGE_KEY_NOTES);
        localStorage.removeItem(STORAGE_KEY_LOCKED_CARDS);
      } else {
        localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(newScores));
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(newNotes));
      }
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    if (reset) {
      try {
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: newScores, judgeNotes: newNotes, reset: true }),
        });
      } catch (e) {
        console.error('Failed to post reset to /api/scores', e);
      }
    } else {
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scores: newScores, judgeNotes: newNotes, reset: false }),
          });
        } catch (e) {
          console.error('Failed to post to /api/scores', e);
        }
      }, 600);
    }
  }, []);

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
          judgeName: 'Admin Panitia',
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

  const updateCriteriaScore = useCallback(
    (judgeId: string, participantId: string, criteriaId: string, score: number) => {
      const targetCriteria = criteria.find(c => c.id === criteriaId);
      const maxScore = targetCriteria ? targetCriteria.maxScore : 100;
      const validScore = Math.min(maxScore, Math.max(0, score));

      setScores((prev) => {
        const next = { ...prev };
        if (!next[judgeId]) next[judgeId] = {};
        if (!next[judgeId][participantId]) {
          next[judgeId][participantId] = { scores: {} };
        }
        if (!next[judgeId][participantId].scores) {
          next[judgeId][participantId].scores = {};
        }

        next[judgeId][participantId].scores[criteriaId] = validScore;
        saveAndSync(next, judgeNotes);
        return next;
      });
    },
    [criteria, judgeNotes, saveAndSync]
  );

  const updateParticipantNotes = useCallback(
    (judgeId: string, participantId: string, notes: string) => {
      setScores((prev) => {
        const next = { ...prev };
        if (!next[judgeId]) next[judgeId] = {};
        if (!next[judgeId][participantId]) {
          next[judgeId][participantId] = { scores: {} };
        }
        next[judgeId][participantId].notes = notes;
        saveAndSync(next, judgeNotes);
        return next;
      });
    },
    [judgeNotes, saveAndSync]
  );

  const updateJudgeGeneralNotes = useCallback(
    (judgeId: string, notes: string) => {
      setJudgeNotes((prev) => {
        const next = { ...prev, [judgeId]: notes };
        saveAndSync(scores, next);
        return next;
      });
    },
    [scores, saveAndSync]
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
    const rawRecaps = participants.map((participant) => {
      const scoresByJudge: { [judgeId: string]: number | 'N/A' } = {};
      let totalScore = 0;
      let validJudgeCount = 0;

      judges.forEach((judge) => {
        if (judge.code === participant.code) {
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
    const newResetTs = Date.now();
    setScores({});
    setJudgeNotes({});
    setLockedCards({});
    setLastResetTs(newResetTs);
    try {
      localStorage.setItem(STORAGE_KEY_RESET_TS, String(newResetTs));
    } catch (e) {}
    saveAndSync({}, {}, true);
  }, [saveAndSync]);

  const exportJSON = useCallback(() => {
    const payload = {
      eventInfo,
      criteria,
      participants,
      judges,
      scores,
      judgeNotes,
      lockedCards,
      exportDate: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_lomba_${eventInfo.competitionTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [eventInfo, criteria, participants, judges, scores, judgeNotes, lockedCards]);

  const importJSON = useCallback(
    (jsonString: string): boolean => {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.scores) setScores(parsed.scores);
        if (parsed.judgeNotes) setJudgeNotes(parsed.judgeNotes);
        if (parsed.lockedCards) setLockedCards(parsed.lockedCards);
        if (parsed.eventInfo) setEventInfo(parsed.eventInfo);
        if (parsed.criteria) setCriteria(parsed.criteria);
        if (parsed.participants) setParticipants(parsed.participants);
        if (parsed.judges) setJudges(parsed.judges);

        saveAndSync(parsed.scores || {}, parsed.judgeNotes || {});
        return true;
      } catch (e) {
        console.error('Import JSON failed', e);
        return false;
      }
    },
    [saveAndSync]
  );

  return (
    <ScoreContext.Provider
      value={{
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
        isCardLocked,
        updateEventInfo,
        updateCriteria,
        updateParticipants,
        updateJudges,
        toggleMasterSystemLock,
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
