import { NextResponse } from 'next/server';
import {
  isSupabaseConfigured,
  fetchMasterScoresFromSupabase,
  saveMasterScoresToSupabase,
} from '@/lib/supabaseClient';

const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbxYpvlq4KaWXkqssPZlpT0KUSLqqTSltnqDMSb9fnl52P0vdXK4LlZBX23IsDX7Dunzhg/exec';

const getTargetUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
  if (
    envUrl && 
    envUrl.trim() !== '' && 
    !envUrl.includes('AKfycby9085') && 
    !envUrl.includes('AKfycbyJc4QfsdBFFGqxKfxIpWZW-LPwh-3DByiacsv5o_r8zacVwW8ol-15CBJ_0vf98s/exec')
  ) {
    return envUrl.trim();
  }
  return DEFAULT_GAS_URL;
};

// Global in-memory state cache on Vercel Serverless Function
let globalMasterScores: Record<string, any> = {};
let globalMasterNotes: Record<string, any> = {};
let globalResetTimestamp: number = 0;

export async function GET() {
  // 1. Primary: If Supabase is configured, fetch authoritative state from Supabase PostgreSQL
  if (isSupabaseConfigured) {
    const supabaseData = await fetchMasterScoresFromSupabase();
    if (supabaseData) {
      if (typeof supabaseData.resetTimestamp === 'number' && supabaseData.resetTimestamp > globalResetTimestamp) {
        globalResetTimestamp = supabaseData.resetTimestamp;
        globalMasterScores = supabaseData.scores || {};
        globalMasterNotes = supabaseData.judgeNotes || {};
      } else {
        if (Object.keys(supabaseData.scores).length > 0) {
          globalMasterScores = { ...globalMasterScores, ...supabaseData.scores };
        }
        if (Object.keys(supabaseData.judgeNotes).length > 0) {
          globalMasterNotes = { ...globalMasterNotes, ...supabaseData.judgeNotes };
        }
        if (typeof supabaseData.resetTimestamp === 'number') {
          globalResetTimestamp = supabaseData.resetTimestamp;
        }
      }
    }
  } else {
    // 2. Fallback: If Supabase is not configured yet and server memory is empty, fetch initial seed from GAS once
    if (Object.keys(globalMasterScores).length === 0) {
      const targetUrl = getTargetUrl();
      try {
        const res = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          signal: AbortSignal.timeout(3000),
        });

        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().startsWith('{')) {
            const data = JSON.parse(text);
            if (typeof data.resetTimestamp === 'number' && data.resetTimestamp > globalResetTimestamp) {
              globalResetTimestamp = data.resetTimestamp;
              globalMasterScores = data.scores || {};
              globalMasterNotes = data.judgeNotes || {};
            } else if (data.scores) {
              globalMasterScores = data.scores;
              if (data.judgeNotes) globalMasterNotes = data.judgeNotes;
              if (typeof data.resetTimestamp === 'number') globalResetTimestamp = data.resetTimestamp;
            }
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    }
  }

  // Instant response (10-20ms) directly from database / server memory
  return NextResponse.json(
    {
      scores: globalMasterScores,
      judgeNotes: globalMasterNotes,
      resetTimestamp: globalResetTimestamp,
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
  const targetUrl = getTargetUrl();

  try {
    const body = await request.json();

    if (body.reset) {
      globalMasterScores = {};
      globalMasterNotes = {};
      globalResetTimestamp = Date.now();
    } else {
      if (body.scores) {
        globalMasterScores = { ...globalMasterScores, ...body.scores };
      }
      if (body.judgeNotes) {
        globalMasterNotes = { ...globalMasterNotes, ...body.judgeNotes };
      }
    }

    // 1. Primary: Persist to Supabase PostgreSQL instantly
    if (isSupabaseConfigured) {
      saveMasterScoresToSupabase(
        globalMasterScores,
        globalMasterNotes,
        globalResetTimestamp,
        Boolean(body.reset)
      ).catch((err) => console.error('Background Supabase save error:', err));
    }

    // 2. Secondary: Non-blocking background forward to Google Apps Script as optional backup
    fetch(targetUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        scores: globalMasterScores,
        judgeNotes: globalMasterNotes,
        reset: body.reset || false,
        resetTimestamp: globalResetTimestamp,
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      scores: globalMasterScores,
      judgeNotes: globalMasterNotes,
      resetTimestamp: globalResetTimestamp,
      source: isSupabaseConfigured ? 'supabase' : 'server-memory',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}
