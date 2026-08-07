import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjeiigtqrfhjjunvmlfp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
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
        // Cap per-request timeout at 8 seconds — free tier 522 can hang for 30s+ otherwise
        fetch: (url, options) =>
          Promise.race([
            fetch(url, options),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Supabase request timed out after 8s')), 8000)
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

// Helper to normalize event ID to database row key
const getRowId = (eventId?: string) => {
  if (!eventId || eventId === 'master' || eventId === 'blind-rias' || eventId === 'blind_rias') {
    return 'master';
  }
  return eventId.replace(/-/g, '_');
};

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
// Stops hammering a down Supabase server. After FAILURE_THRESHOLD consecutive
// failures the circuit "opens" and all Supabase calls are skipped for
// COOLDOWN_MS. After the cooldown it tries again ("half-open") — one success
// resets the failure counter and closes the circuit.
const FAILURE_THRESHOLD = 3;        // failures before circuit opens
const COOLDOWN_MS       = 5 * 60_000; // 5 minutes cooldown when open

let consecutiveFailures = 0;
let circuitOpenedAt     = 0;        // 0 = circuit is closed (healthy)

function isCircuitOpen(): boolean {
  if (circuitOpenedAt === 0) return false; // closed
  if (Date.now() - circuitOpenedAt > COOLDOWN_MS) {
    // Cooldown elapsed — enter half-open: allow one attempt through
    console.info('[Supabase] Circuit half-open — attempting reconnect...');
    return false;
  }
  return true; // still open
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
      `App running on server-memory fallback. (${context}: ${msg})`
    );
  } else if (circuitOpenedAt === 0) {
    // Circuit still closed but accumulating failures — log briefly
    console.warn(`[Supabase] ${context} (${consecutiveFailures}/${FAILURE_THRESHOLD}): ${msg}`);
  }
}

// ─── Error Message Helper ─────────────────────────────────────────────────────
// Collapses HTML error pages (e.g. 522 Cloudflare pages) to a one-liner so the
// console never gets flooded with kilobytes of raw HTML.
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
  // Detect HTML responses (e.g. Cloudflare 522 page) and shorten them
  if (raw.trimStart().startsWith('<')) {
    const titleMatch = raw.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? `[HTML] ${titleMatch[1].trim()}` : '[HTML error page]';
  }
  return raw;
};

// ─── Fetch ────────────────────────────────────────────────────────────────────
export const fetchMasterScoresFromSupabase = async (eventId: string = 'master'): Promise<MasterPayload | null> => {
  if (!supabase) return null;
  if (isCircuitOpen()) return null; // fast-fail while circuit is open

  const rowId = getRowId(eventId);
  try {
    const { data, error } = await supabase
      .from('scores_state')
      .select('scores, judge_notes, reset_timestamp')
      .eq('id', rowId)
      .single();

    if (error) {
      recordFailure(`fetch[${rowId}]`, getErrMsg(error));
      return null;
    }

    if (data) {
      recordSuccess();
      const rawNotes = data.judge_notes || {};
      const { _config, _lockedCards, ...cleanNotes } = rawNotes;
      return {
        scores: data.scores || {},
        judgeNotes: cleanNotes || {},
        resetTimestamp: Number(data.reset_timestamp || 0),
        config: _config || undefined,
        lockedCards: _lockedCards || undefined,
      };
    }
  } catch (err) {
    recordFailure(`fetch[${rowId}]`, getErrMsg(err));
  }
  return null;
};

// ─── Save / Upsert ────────────────────────────────────────────────────────────
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
  if (isCircuitOpen()) return false; // fast-fail — app already running on memory cache

  const rowId = getRowId(eventId);
  try {
    const notesPayload: Record<string, any> = { ...judgeNotes };
    if (config) notesPayload._config = config;
    if (lockedCards) notesPayload._lockedCards = lockedCards;

    const payload: Record<string, any> = isReset
      ? {
          id: rowId,
          scores: {},
          judge_notes: notesPayload,
          reset_timestamp: resetTimestamp || Date.now(),
          updated_at: new Date().toISOString(),
        }
      : {
          id: rowId,
          scores,
          judge_notes: notesPayload,
          reset_timestamp: resetTimestamp,
          updated_at: new Date().toISOString(),
        };

    const { error } = await supabase
      .from('scores_state')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      recordFailure(`save[${rowId}]`, getErrMsg(error));
      return false;
    }

    recordSuccess();
    return true;
  } catch (err) {
    recordFailure(`save[${rowId}]`, getErrMsg(err));
    return false;
  }
};
