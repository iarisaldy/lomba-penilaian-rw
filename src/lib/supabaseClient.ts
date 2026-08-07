import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjeiigtqrfhjjunvmlfp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'isikan_anon_key_disini'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
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

// Fetch master scores and config from Supabase table 'scores_state'
export const fetchMasterScoresFromSupabase = async (eventId: string = 'master'): Promise<MasterPayload | null> => {
  if (!supabase) return null;
  const rowId = getRowId(eventId);
  try {
    const { data, error } = await supabase
      .from('scores_state')
      .select('scores, judge_notes, reset_timestamp, config, locked_cards')
      .eq('id', rowId)
      .single();

    if (error) {
      console.error(`Supabase fetch error for event ${rowId}:`, error.message);
      return null;
    }

    if (data) {
      return {
        scores: data.scores || {},
        judgeNotes: data.judge_notes || {},
        resetTimestamp: Number(data.reset_timestamp || 0),
        config: data.config || undefined,
        lockedCards: data.locked_cards || undefined,
      };
    }
  } catch (err) {
    console.error(`Failed to fetch event ${rowId} from Supabase:`, err);
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
    const payload: Record<string, any> = isReset
      ? {
          id: rowId,
          scores: {},
          judge_notes: {},
          locked_cards: {},
          reset_timestamp: resetTimestamp || Date.now(),
          updated_at: new Date().toISOString(),
        }
      : {
          id: rowId,
          scores,
          judge_notes: judgeNotes,
          reset_timestamp: resetTimestamp,
          updated_at: new Date().toISOString(),
        };

    if (config) payload.config = config;
    if (lockedCards) payload.locked_cards = lockedCards;

    const { error } = await supabase
      .from('scores_state')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error(`Supabase save error for event ${rowId}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Failed to save event ${rowId} to Supabase:`, err);
    return false;
  }
};

