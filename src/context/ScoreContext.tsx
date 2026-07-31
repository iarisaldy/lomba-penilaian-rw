'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  AllScores,
  AuthState,
  Criteria,
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
import { syncToGoogleSheets, fetchGoogleSheetsScoresDirectly } from '../lib/googleSheetsClient';

interface ScoreContextType {
  judges: Judge[];
  participants: Participant[];
  criteria: Criteria[];
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
}

const STORAGE_KEY_SCORES = 'lomba_scores_v1';
const STORAGE_KEY_NOTES = 'lomba_notes_v1';
const STORAGE_KEY_ACTIVE_JURI = 'lomba_active_juri_v1';
const STORAGE_KEY_AUTH = 'lomba_auth_v1';
const STORAGE_KEY_LOCKED_CARDS = 'lomba_locked_cards_v1';
const STORAGE_KEY_RESET_TS = 'lomba_last_reset_ts_v1';

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
        normalized[jId][cleanPKey] = {
          scores: {
            c1: Number(item.scores.c1 || 0),
            c2: Number(item.scores.c2 || 0),
            c3: Number(item.scores.c3 || 0),
            c4: Number(item.scores.c4 || 0),
          },
          notes: item.notes || '',
        };
      }
    }
  }
  return normalized;
};

export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [judges] = useState<Judge[]>(DEFAULT_JUDGES);
  const [participants] = useState<Participant[]>(DEFAULT_PARTICIPANTS);
  const [criteria] = useState<Criteria[]>(DEFAULT_CRITERIA);
  
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

  // Helper to check if a specific participant card is locked for a judge
  const isCardLocked = useCallback((judgeId: string, participantId: string): boolean => {
    const key = `${judgeId}_${participantId}`;
    return Boolean(lockedCards[key]);
  }, [lockedCards]);

  const toggleCardLock = useCallback((judgeId: string, participantId: string) => {
    const key = `${judgeId}_${participantId}`;
    setLockedCards(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY_LOCKED_CARDS, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Poll /api/scores endpoint every 2s with race-condition protection
  useEffect(() => {
    const fetchApiScores = async () => {
      try {
        const res = await fetch('/api/scores', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          
          // If remote reset timestamp is newer, wipe local state!
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

          // Synchronize with Central Server Master Scores with Anti-Flicker Reference Stability
          if (Object.keys(serverScores).length > 0) {
            setScores(prev => {
              const now = Date.now();
              const isRecentlyEdited = now - lastLocalInteractionRef.current < 3500;

              let nextScores = serverScores;
              if (isRecentlyEdited && prev[activeJudgeId]) {
                nextScores = normalizeScores({
                  ...serverScores,
                  [activeJudgeId]: { ...(serverScores[activeJudgeId] || {}), ...prev[activeJudgeId] }
                });
              }

              const prevNorm = normalizeScores(prev);
              if (JSON.stringify(prevNorm) === JSON.stringify(nextScores)) {
                return prev; // Prevents unnecessary re-renders & flickering!
              }
              return nextScores;
            });
          }

          if (Object.keys(serverNotes).length > 0) {
            setJudgeNotes(prev => {
              const now = Date.now();
              const isRecentlyEdited = now - lastLocalInteractionRef.current < 3500;

              let nextNotes = serverNotes;
              if (isRecentlyEdited && prev[activeJudgeId]) {
                nextNotes = { ...serverNotes, [activeJudgeId]: prev[activeJudgeId] };
              }

              if (JSON.stringify(prev) === JSON.stringify(nextNotes)) {
                return prev; // Prevents unnecessary re-renders & flickering!
              }
              return nextNotes;
            });
          }
          setIsRealtimeConnected(true);
        }
      } catch (e) {
        // Fallback
      }
    };

    fetchApiScores();
    const interval = setInterval(fetchApiScores, 2000);

    return () => clearInterval(interval);
  }, [lastResetTs, activeJudgeId]);

  // Load initial Auth & Config state (Central server scores are loaded via fetchApiScores)
  useEffect(() => {
    try {
      const savedActiveJuri = localStorage.getItem(STORAGE_KEY_ACTIVE_JURI);
      const savedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
      const savedLockedCards = localStorage.getItem(STORAGE_KEY_LOCKED_CARDS);
      const savedResetTs = localStorage.getItem(STORAGE_KEY_RESET_TS);

      if (savedActiveJuri && DEFAULT_JUDGES.some(j => j.id === savedActiveJuri)) {
        setActiveJudgeId(savedActiveJuri);
      }
      if (savedAuth) setAuthState(JSON.parse(savedAuth));
      if (savedLockedCards) setLockedCards(JSON.parse(savedLockedCards));
      if (savedResetTs) setLastResetTs(Number(savedResetTs));
    } catch (e) {
      console.error('Failed to load storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save to /api/scores Endpoint & LocalStorage & Direct Google Sheets
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

    // Direct Google Sheets sync with 500ms debounce to prevent request flooding during slider drag
    if (reset) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncToGoogleSheets(newScores, newNotes);
    } else {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncToGoogleSheets(newScores, newNotes);
      }, 500);
    }

    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: newScores,
          judgeNotes: newNotes,
          reset,
        }),
      });
    } catch (e) {
      console.error('Failed to post to /api/scores', e);
    }
  }, []);

  // Save active judge selection
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_JURI, activeJudgeId);
    } catch (e) {
      console.error('Failed to save active juri', e);
    }
  }, [activeJudgeId, isLoaded]);

  // Save Auth state
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authState));
    } catch (e) {
      console.error('Failed to save auth', e);
    }
  }, [authState, isLoaded]);

  const loginWithPin = (pin: string) => {
    const cleanPin = pin.trim();

    if (cleanPin === EVENT_INFO.adminPin) {
      const newAuth: AuthState = { role: 'admin', judgeName: 'Panitia Admin' };
      setAuthState(newAuth);
      return { success: true, role: 'admin' as const, message: 'Login sebagai Panitia Admin Berhasil!' };
    }

    const foundJudge = judges.find(j => j.pin === cleanPin);
    if (foundJudge) {
      const newAuth: AuthState = { role: 'juri', judgeId: foundJudge.id, judgeName: foundJudge.name };
      setAuthState(newAuth);
      setActiveJudgeId(foundJudge.id);
      return { success: true, role: 'juri' as const, message: `Selamat Datang, ${foundJudge.name}!` };
    }

    return { success: false, message: 'PIN Salah! Periksa kembali PIN Anda.' };
  };

  const logout = () => {
    setAuthState({ role: 'guest' });
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch (e) {
      console.error('Failed to clear auth', e);
    }
  };

  const updateCriteriaScore = (
    judgeId: string,
    participantId: string,
    criteriaId: string,
    score: number
  ) => {
    if (authState.role === 'admin' || isCardLocked(judgeId, participantId)) {
      return;
    }

    if (authState.role === 'juri' && authState.judgeId !== judgeId) {
      return;
    }

    const judge = judges.find(j => j.id === judgeId);
    const participant = participants.find(p => p.id === participantId);
    if (judge && participant && judge.code === participant.code) {
      return; // Locked (N/A)
    }

    lastLocalInteractionRef.current = Date.now();

    setScores(prev => {
      const judgeData = prev[judgeId] || {};
      const participantData = judgeData[participantId] || { scores: {} };
      
      const newParticipantData = {
        ...participantData,
        scores: {
          ...participantData.scores,
          [criteriaId]: score,
        },
      };

      const updatedScores = {
        ...prev,
        [judgeId]: {
          ...judgeData,
          [participantId]: newParticipantData,
        },
      };

      saveAndSync(updatedScores, judgeNotes);
      return updatedScores;
    });
  };

  const updateParticipantNotes = (
    judgeId: string,
    participantId: string,
    notes: string
  ) => {
    if (authState.role === 'admin' || isCardLocked(judgeId, participantId)) {
      return;
    }

    if (authState.role === 'juri' && authState.judgeId !== judgeId) {
      return;
    }

    lastLocalInteractionRef.current = Date.now();

    setScores(prev => {
      const judgeData = prev[judgeId] || {};
      const participantData = judgeData[participantId] || { scores: {} };

      const updatedScores = {
        ...prev,
        [judgeId]: {
          ...judgeData,
          [participantId]: {
            ...participantData,
            notes,
          },
        },
      };

      saveAndSync(updatedScores, judgeNotes);
      return updatedScores;
    });
  };

  const updateJudgeGeneralNotes = (judgeId: string, notes: string) => {
    if (authState.role === 'admin') {
      return;
    }

    if (authState.role === 'juri' && authState.judgeId !== judgeId) {
      return;
    }

    lastLocalInteractionRef.current = Date.now();

    setJudgeNotes(prev => {
      const updatedNotes = {
        ...prev,
        [judgeId]: notes,
      };

      saveAndSync(scores, updatedNotes);
      return updatedNotes;
    });
  };

  const getParticipantSubtotal = (judgeId: string, participantId: string): number => {
    const judge = judges.find(j => j.id === judgeId);
    const participant = participants.find(p => p.id === participantId);
    if (judge && participant && judge.code === participant.code) {
      return 0;
    }

    const pData = scores[judgeId]?.[participantId] 
      || scores[judgeId]?.[`p_${participantId}`] 
      || (participantId.startsWith('p_') ? scores[judgeId]?.[participantId.replace('p_', '')] : undefined);
    const participantScores = pData?.scores || {};
    return Object.values(participantScores).reduce((sum, val) => sum + (val || 0), 0);
  };

  const recapData: ParticipantRecap[] = useMemo(() => {
    const recaps: ParticipantRecap[] = participants.map(participant => {
      const scoresByJudge: { [judgeId: string]: number | 'N/A' } = {};
      let totalScore = 0;
      let validJudgeCount = 0;

      judges.forEach(judge => {
        if (judge.code === participant.code) {
          scoresByJudge[judge.id] = 'N/A';
        } else {
          const pData = scores[judge.id]?.[participant.id] 
            || scores[judge.id]?.[`p_${participant.id}`] 
            || (participant.id.startsWith('p_') ? scores[judge.id]?.[participant.id.replace('p_', '')] : undefined);
          const pScores = pData?.scores || {};
          const sum = Object.values(pScores).reduce((acc, v) => acc + (v || 0), 0);
          scoresByJudge[judge.id] = sum;
          totalScore += sum;
          validJudgeCount += 1;
        }
      });

      const averageScore = validJudgeCount > 0 ? Number((totalScore / validJudgeCount).toFixed(2)) : 0;

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

    const sorted = [...recaps].sort((a, b) => b.averageScore - a.averageScore || b.totalScore - a.totalScore);
    
    let currentRank = 1;
    sorted.forEach((item, index) => {
      if (index > 0 && item.averageScore < sorted[index - 1].averageScore) {
        currentRank = index + 1;
      }
      item.rank = currentRank;
    });

    return recaps.map(r => {
      const found = sorted.find(s => s.participantId === r.participantId);
      return {
        ...r,
        rank: found ? found.rank : 0,
      };
    });
  }, [scores, judges, participants]);

  const loadDemoData = () => {
    const demoScores: AllScores = {};
    const demoNotes: JudgeGeneralNotes = {
      juri_rt01: 'Penampilan seluruh peserta sangat kreatif dan meriah.',
      juri_rt02: 'Hasil riasan blind rias unik dan menghibur!',
      juri_rt03: 'Kekompakan tim luar biasa.',
      juri_rt04: 'Kreativitas warna sangat berani.',
      juri_rt05: 'Kerapian dan teknik rias mata sangat baik.',
      juri_rt06: 'Semua peserta tampil sportif dan seru.',
    };

    const baseScores: { [pCode: string]: { c1: number; c2: number; c3: number; c4: number } } = {
      'RT 01': { c1: 27, c2: 28, c3: 18, c4: 19 },
      'RT 02': { c1: 24, c2: 25, c3: 16, c4: 17 },
      'RT 03': { c1: 29, c2: 29, c3: 19, c4: 20 },
      'RT 04': { c1: 25, c2: 26, c3: 17, c4: 18 },
      'RT 05': { c1: 28, c2: 27, c3: 19, c4: 18 },
      'RT 06': { c1: 22, c2: 24, c3: 15, c4: 16 },
    };

    judges.forEach(j => {
      demoScores[j.id] = {};
      participants.forEach(p => {
        if (j.code !== p.code) {
          const base = baseScores[p.code] || { c1: 20, c2: 20, c3: 15, c4: 15 };
          const variation = (j.id.charCodeAt(j.id.length - 1) % 3) - 1;
          demoScores[j.id][p.id] = {
            scores: {
              c1: Math.min(30, Math.max(1, base.c1 + variation)),
              c2: Math.min(30, Math.max(1, base.c2 + variation)),
              c3: Math.min(20, Math.max(1, base.c3 + (variation > 0 ? 1 : 0))),
              c4: Math.min(20, Math.max(1, base.c4 - (variation < 0 ? 1 : 0))),
            },
          };
        }
      });
    });

    setScores(demoScores);
    setJudgeNotes(demoNotes);
    saveAndSync(demoScores, demoNotes);
  };

  const resetAllData = () => {
    const ts = Date.now();
    setLastResetTs(ts);
    setScores({});
    setJudgeNotes({});
    setLockedCards({});
    saveAndSync({}, {}, true);
    try {
      localStorage.setItem(STORAGE_KEY_RESET_TS, String(ts));
      localStorage.removeItem(STORAGE_KEY_SCORES);
      localStorage.removeItem(STORAGE_KEY_NOTES);
      localStorage.removeItem(STORAGE_KEY_LOCKED_CARDS);
    } catch (e) {
      console.error('Failed to reset storage', e);
    }
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ scores, judgeNotes }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rekap_lomba_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.scores) {
        setScores(parsed.scores);
        if (parsed.judgeNotes) setJudgeNotes(parsed.judgeNotes);
        saveAndSync(parsed.scores, parsed.judgeNotes || {});
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  };

  return (
    <ScoreContext.Provider
      value={{
        judges,
        participants,
        criteria,
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
