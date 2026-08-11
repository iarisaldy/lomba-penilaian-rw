import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epngkmolxvylrxtqmmmx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_zFH7ZSPQTsC491cds3K-3w_HMxAx8iN';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_USE_LOCAL_DB !== 'true' &&
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'isikan_anon_key_disini'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        // Cap per-request timeout at 12 seconds — free tier 522 can hang 30s+ otherwise
        fetch: (url, options) =>
          Promise.race([
            fetch(url, options),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Supabase request timed out after 12s')), 12000)
            ),
          ]) as Promise<Response>,
      },
    })
  : null;

export interface MasterPayload {
  scores: Record<string, any>;
  judgeNotes: Record<string, any>;
  resetTimestamp: number;
  config?: Record<string, any>;
  lockedCards?: Record<string, boolean>;
}

// ─── Row ID Helpers ───────────────────────────────────────────────────────────
// Config/global state → "master" row
// Per-judge scores   → "master_j_{judgeId}" row (ZERO lock contention between judges!)
const getRowId = (eventId?: string): string => {
  if (!eventId || eventId === 'master' || eventId === 'blind-rias' || eventId === 'blind_rias') {
    return 'master';
  }
  return eventId.replace(/-/g, '_');
};

const getJudgeRowId = (eventId: string, judgeId: string): string =>
  `${getRowId(eventId)}_j_${judgeId}`;

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
// After FAILURE_THRESHOLD consecutive failures the circuit "opens" and
// all Supabase calls are skipped for COOLDOWN_MS. One success closes it again.
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS       = 3 * 60_000; // 3 menit

let consecutiveFailures = 0;
let circuitOpenedAt     = 0; // 0 = closed (healthy)

function isCircuitOpen(): boolean {
  if (circuitOpenedAt === 0) return false;
  if (Date.now() - circuitOpenedAt > COOLDOWN_MS) {
    console.info('[Supabase] Circuit half-open — attempting reconnect...');
    return false;
  }
  return true;
}

function recordSuccess(): void {
  if (consecutiveFailures > 0) {
    console.info('[Supabase] Connection restored — circuit closed.');
  }
  consecutiveFailures = 0;
  circuitOpenedAt     = 0;
}

function recordFailure(context: string, msg: string): void {
  consecutiveFailures += 1;
  if (consecutiveFailures >= FAILURE_THRESHOLD && circuitOpenedAt === 0) {
    circuitOpenedAt = Date.now();
    console.warn(
      `[Supabase] Circuit OPEN after ${FAILURE_THRESHOLD} failures — ` +
      `pausing Supabase calls for ${COOLDOWN_MS / 60_000} min. ` +
      `App running on local storage fallback. (${context}: ${msg})`
    );
  } else if (circuitOpenedAt === 0) {
    console.warn(`[Supabase] ${context} (${consecutiveFailures}/${FAILURE_THRESHOLD}): ${msg}`);
  }
}

// ─── Error Message Helper ─────────────────────────────────────────────────────
const getErrMsg = (err: any): string => {
  if (!err) return '';
  let raw: string;
  if (typeof err === 'string') {
    raw = err;
  } else if (typeof err.message === 'string') {
    raw = err.message;
  } else {
    try { raw = JSON.stringify(err); } catch { raw = String(err); }
  }
  if (raw.trimStart().startsWith('<')) {
    const titleMatch = raw.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? `[HTML] ${titleMatch[1].trim()}` : '[HTML error page]';
  }
  return raw;
};

// ─── Shared Upsert with Retry ─────────────────────────────────────────────────
async function upsertWithRetry(payload: Record<string, any>): Promise<{ error: any }> {
  if (!supabase) return { error: new Error('Supabase not configured') };

  const doUpsert = () =>
    supabase!.from('scores_state').upsert(payload, { onConflict: 'id' });

  const { error: firstError } = await doUpsert();
  let error = firstError;

  if (error) {
    const msg = getErrMsg(error);
    const isLockConflict =
      msg.includes('57014') || msg.includes('statement timeout') || msg.includes('locking');

    if (isLockConflict) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        const wait = 200 * attempt + Math.floor(Math.random() * 300);
        await new Promise(r => setTimeout(r, wait));
        const { error: retryError } = await doUpsert();
        error = retryError;
        if (!error) break;
      }
    }
  }

  return { error };
}

// ─── Fetch ALL event data (config row + all judge rows) ───────────────────────
export const fetchAllEventDataFromSupabase = async (
  eventId: string = 'master'
): Promise<MasterPayload | null> => {
  if (!supabase) return null;
  if (isCircuitOpen()) return null;

  const normId = getRowId(eventId);
  try {
    const { data, error } = await supabase
      .from('scores_state')
      .select('id, scores, judge_notes, reset_timestamp, updated_at')
      .or(`id.eq.${normId},id.like.${normId}_j_%`);

    if (error) { recordFailure(`fetchAll[${normId}]`, getErrMsg(error)); return null; }
    if (!data || data.length === 0) return null;

    recordSuccess();

    const configRow   = data.find(r => r.id === normId);
    const judgeRows   = data.filter(r => r.id !== normId);
    const resetTimestamp = Number(configRow?.reset_timestamp || 0);

    const mergedScores: Record<string, any> = {};
    const mergedNotes: Record<string, any>  = {};

    for (const row of judgeRows) {
      if (resetTimestamp > 0 && row.updated_at) {
        const rowUpdatedMs = new Date(row.updated_at).getTime();
        if (rowUpdatedMs < resetTimestamp) continue;
      }

      const judgeId = row.id.slice(`${normId}_j_`.length);
      if (row.scores && Object.keys(row.scores).length > 0) {
        mergedScores[judgeId] = row.scores;
      }
      if (row.judge_notes?.note) {
        mergedNotes[judgeId] = row.judge_notes.note;
      }
    }

    if (configRow?.scores && typeof configRow.scores === 'object') {
      for (const [judgeId, judgeData] of Object.entries(configRow.scores)) {
        if (!mergedScores[judgeId]) mergedScores[judgeId] = judgeData;
      }
    }

    const rawNotes = configRow?.judge_notes || {};
    const { _config, _lockedCards, ...legacyNotes } = rawNotes;

    for (const [judgeId, note] of Object.entries(legacyNotes)) {
      if (!mergedNotes[judgeId]) mergedNotes[judgeId] = note;
    }

    return {
      scores: mergedScores,
      judgeNotes: mergedNotes,
      resetTimestamp,
      config: _config || undefined,
      lockedCards: _lockedCards || undefined,
    };
  } catch (err) {
    recordFailure(`fetchAll[${normId}]`, getErrMsg(err));
    return null;
  }
};

export const fetchMasterScoresFromSupabase = fetchAllEventDataFromSupabase;

// ─── Save ONE judge's scores to their dedicated row ───────────────────────────
export const saveJudgeScoreToSupabase = async (
  eventId: string,
  judgeId: string,
  scores: Record<string, any>,
  note: string = ''
): Promise<boolean> => {
  if (!supabase) return false;
  if (isCircuitOpen()) return false;

  const rowId = getJudgeRowId(eventId, judgeId);
  try {
    const { error } = await upsertWithRetry({
      id: rowId,
      scores,
      judge_notes: note ? { note } : {},
      reset_timestamp: 0,
      updated_at: new Date().toISOString(),
    });

    if (error) { recordFailure(`save[${rowId}]`, getErrMsg(error)); return false; }
    recordSuccess();
    return true;
  } catch (err) {
    recordFailure(`save[${rowId}]`, getErrMsg(err));
    return false;
  }
};

// ─── Save config / lockedCards / reset to the master row ─────────────────────
export const saveMasterScoresToSupabase = async (
  scores: Record<string, any>,
  judgeNotes: Record<string, any>,
  resetTimestamp: number = 0,
  isReset: boolean = false,
  config?: Record<string, any>,
  lockedCards?: Record<string, boolean>,
  eventId: string = 'master'
): Promise<boolean> => {
  if (!supabase) return false;
  if (isCircuitOpen()) return false;

  const rowId = getRowId(eventId);
  try {
    const notesPayload: Record<string, any> = isReset ? {} : { ...judgeNotes };
    if (config)       notesPayload._config      = config;
    if (lockedCards)  notesPayload._lockedCards  = lockedCards;

    const { error } = await upsertWithRetry({
      id: rowId,
      scores: isReset ? {} : scores,
      judge_notes: notesPayload,
      reset_timestamp: isReset ? (resetTimestamp || Date.now()) : resetTimestamp,
      updated_at: new Date().toISOString(),
    });

    if (error) { recordFailure(`save[${rowId}]`, getErrMsg(error)); return false; }
    recordSuccess();
    return true;
  } catch (err) {
    recordFailure(`save[${rowId}]`, getErrMsg(err));
    return false;
  }
};

// ─── Realtime Channel Subscription ────────────────────────────────────────────
// Listens for postgres_changes on scores_state directly from browser
export const subscribeToEventChanges = (
  eventId: string,
  onPayload: (payload: MasterPayload) => void
): (() => void) => {
  if (!supabase || isCircuitOpen()) return () => {};

  const channelName = `realtime_scores_${getRowId(eventId)}_${Math.random().toString(36).substring(2, 7)}`;
  let channel: RealtimeChannel | null = null;

  try {
    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores_state' },
        async () => {
          const freshData = await fetchAllEventDataFromSupabase(eventId);
          if (freshData) {
            onPayload(freshData);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          recordSuccess();
        }
      });
  } catch (e) {
    console.warn('[Supabase] Failed to subscribe to realtime channel', e);
  }

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel).catch(() => {});
    }
  };
};
