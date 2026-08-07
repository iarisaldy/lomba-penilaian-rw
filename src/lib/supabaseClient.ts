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

const getErrMsg = (err: any): string => {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  try {
    return JSON.stringify(err);
  } catch (e) {
    return String(err);
  }
};

// Fetch master scores and config from Supabase table 'scores_state'
export const fetchMasterScoresFromSupabase = async (eventId: string = 'master'): Promise<MasterPayload | null> => {
  if (!supabase) return null;
  const rowId = getRowId(eventId);
  try {
    const { data, error } = await supabase
      .from('scores_state')
      .select('scores, judge_notes, reset_timestamp')
      .eq('id', rowId)
      .single();

    if (error) {
      console.warn(`Supabase fetch notice for event ${rowId}:`, getErrMsg(error));
      return null;
    }

    if (data) {
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
    console.warn(`Failed to fetch event ${rowId} from Supabase:`, getErrMsg(err));
  }
  return null;
};

// Save / Upsert master scores and config to Supabase table 'scores_state'
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

    let { error } = await supabase
      .from('scores_state')
      .upsert(payload, { onConflict: 'id' });

    let errMsg = getErrMsg(error);

    // Auto-retry once if transient network error occurred
    if (error && (errMsg.includes('522') || errMsg.includes('timeout') || errMsg.includes('FetchError') || errMsg.includes('Unhealthy'))) {
      await new Promise(r => setTimeout(r, 1000));
      const retryRes = await supabase
        .from('scores_state')
        .upsert(payload, { onConflict: 'id' });
      error = retryRes.error;
      errMsg = getErrMsg(error);
    }

    if (error) {
      console.warn(`Supabase save notice for event ${rowId}: ${errMsg} (App fallback to memory active)`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Transient Supabase save warning for event ${rowId} (App fallback to memory active):`, getErrMsg(err));
    return false;
  }
};

