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

// Fetch master scores and config from Supabase table 'scores_state'
export const fetchMasterScoresFromSupabase = async (): Promise<MasterPayload | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('scores_state')
      .select('scores, judge_notes, reset_timestamp, config, locked_cards')
      .eq('id', 'master')
      .single();

    if (error) {
      console.error('Supabase fetch error:', error.message);
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
    console.error('Failed to fetch from Supabase:', err);
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
  lockedCards?: Record<string, boolean>
): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const payload: Record<string, any> = isReset
      ? {
          id: 'master',
          scores: {},
          judge_notes: {},
          locked_cards: {},
          reset_timestamp: resetTimestamp || Date.now(),
          updated_at: new Date().toISOString(),
        }
      : {
          id: 'master',
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
      console.error('Supabase save error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save to Supabase:', err);
    return false;
  }
};
