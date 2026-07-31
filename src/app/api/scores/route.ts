import { NextResponse } from 'next/server';

const GOOGLE_SHEETS_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL || 'https://script.google.com/macros/s/AKfycbxYpvlq4KaWXkqssPZlpT0KUSLqqTSltnqDMSb9fnl52P0vdXK4LlZBX23IsDX7Dunzhg/exec';

// Global in-memory state on Vercel Serverless Function (fallback)
let globalMasterScores: Record<string, any> = {};
let globalMasterNotes: Record<string, any> = {};
let globalResetTimestamp: number = 0;

export async function GET() {
  try {
    const res = await fetch(GOOGLE_SHEETS_URL, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.resetTimestamp && data.resetTimestamp > globalResetTimestamp) {
        globalResetTimestamp = data.resetTimestamp;
        globalMasterScores = {};
        globalMasterNotes = {};
      }
      if (data.scores && Object.keys(data.scores).length > 0) {
        globalMasterScores = { ...globalMasterScores, ...data.scores };
      }
      if (data.judgeNotes && Object.keys(data.judgeNotes).length > 0) {
        globalMasterNotes = { ...globalMasterNotes, ...data.judgeNotes };
      }
    }
  } catch (e) {
    console.error('Failed to sync scores from Google Apps Script', e);
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
