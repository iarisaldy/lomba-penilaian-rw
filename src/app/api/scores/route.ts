import { NextResponse } from 'next/server';
import {
  isSupabaseConfigured,
  fetchMasterScoresFromSupabase,
  saveMasterScoresToSupabase,
} from '@/lib/supabaseClient';

// Global in-memory state cache on Vercel Serverless Function
let globalMasterScores: Record<string, any> = {};
let globalMasterNotes: Record<string, any> = {};
let globalResetTimestamp: number = 0;
let globalMasterConfig: Record<string, any> | undefined = undefined;
let globalLockedCards: Record<string, boolean> = {};

export async function GET() {
  // Primary: If Supabase is configured, fetch authoritative state from Supabase PostgreSQL
  if (isSupabaseConfigured) {
    const supabaseData = await fetchMasterScoresFromSupabase();
    if (supabaseData) {
      if (typeof supabaseData.resetTimestamp === 'number' && supabaseData.resetTimestamp > globalResetTimestamp) {
        globalResetTimestamp = supabaseData.resetTimestamp;
        globalMasterScores = supabaseData.scores || {};
        globalMasterNotes = supabaseData.judgeNotes || {};
        globalLockedCards = supabaseData.lockedCards || {};
      } else {
        if (Object.keys(supabaseData.scores).length > 0) {
          globalMasterScores = { ...globalMasterScores, ...supabaseData.scores };
        }
        if (Object.keys(supabaseData.judgeNotes).length > 0) {
          globalMasterNotes = { ...globalMasterNotes, ...supabaseData.judgeNotes };
        }
        if (supabaseData.lockedCards && Object.keys(supabaseData.lockedCards).length > 0) {
          globalLockedCards = { ...globalLockedCards, ...supabaseData.lockedCards };
        }
        if (typeof supabaseData.resetTimestamp === 'number') {
          globalResetTimestamp = supabaseData.resetTimestamp;
        }
      }
      if (supabaseData.config) {
        globalMasterConfig = supabaseData.config;
      }
    }
  }

  // Instant response (10-15ms) directly from database / server memory
  return NextResponse.json(
    {
      scores: globalMasterScores,
      judgeNotes: globalMasterNotes,
      resetTimestamp: globalResetTimestamp,
      config: globalMasterConfig,
      lockedCards: globalLockedCards,
      updatedAt: new Date().toISOString(),
      source: isSupabaseConfigured ? 'supabase' : 'server-memory',
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.reset) {
      globalMasterScores = {};
      globalMasterNotes = {};
      globalLockedCards = {};
      globalResetTimestamp = Date.now();
    } else {
      if (body.scores) {
        globalMasterScores = { ...globalMasterScores, ...body.scores };
      }
      if (body.judgeNotes) {
        globalMasterNotes = { ...globalMasterNotes, ...body.judgeNotes };
      }
      if (body.lockedCards) {
        globalLockedCards = { ...globalLockedCards, ...body.lockedCards };
      }
      if (body.config) {
        globalMasterConfig = body.config;
      }
    }

    // Persist to Supabase PostgreSQL instantly
    if (isSupabaseConfigured) {
      saveMasterScoresToSupabase(
        globalMasterScores,
        globalMasterNotes,
        globalResetTimestamp,
        Boolean(body.reset),
        globalMasterConfig,
        globalLockedCards
      ).catch((err) => console.error('Background Supabase save error:', err));
    }

    return NextResponse.json({
      success: true,
      scores: globalMasterScores,
      judgeNotes: globalMasterNotes,
      resetTimestamp: globalResetTimestamp,
      config: globalMasterConfig,
      lockedCards: globalLockedCards,
      source: isSupabaseConfigured ? 'supabase' : 'server-memory',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}
