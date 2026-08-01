import { NextResponse } from 'next/server';

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

// Global in-memory state fallback on Vercel Serverless Function
let globalMasterScores: Record<string, any> = {};
let globalMasterNotes: Record<string, any> = {};
let globalResetTimestamp: number = 0;

export async function GET() {
  const targetUrl = getTargetUrl();

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      signal: AbortSignal.timeout(8000), // Prevent Vercel function timeout while allowing GAS cold-start
    });

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().startsWith('{')) {
        const data = JSON.parse(text);
        
        // If remote reset timestamp is newer than server memory, wipe server memory
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
    console.error('Failed to fetch master scores from Google Apps Script', e);
  }

  return NextResponse.json(
    {
      scores: globalMasterScores,
      judgeNotes: globalMasterNotes,
      resetTimestamp: globalResetTimestamp,
      updatedAt: new Date().toISOString(),
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

    // Non-blocking background sync to Google Apps Script for zero-lag instant API response
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
      signal: AbortSignal.timeout(8000),
    }).catch(e => console.error('Background server forward to Google Sheets failed', e));

    return NextResponse.json({
      success: true,
      scores: globalMasterScores,
      judgeNotes: globalMasterNotes,
      resetTimestamp: globalResetTimestamp,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}
