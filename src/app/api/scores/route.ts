import { NextResponse } from 'next/server';

const GOOGLE_SHEETS_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL || 'https://script.google.com/macros/s/AKfycbxYpvlq4KaWXkqssPZlpT0KUSLqqTSltnqDMSb9fnl52P0vdXK4LlZBX23IsDX7Dunzhg/exec';

// Global in-memory state fallback on Vercel Serverless Function
let globalMasterScores: Record<string, any> = {};
let globalMasterNotes: Record<string, any> = {};
let globalResetTimestamp: number = 0;

export async function GET() {
  try {
    const res = await fetch(GOOGLE_SHEETS_URL, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
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

    // Server-side forward to Google Apps Script for instant central persistence
    try {
      await fetch(GOOGLE_SHEETS_URL, {
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
      });
    } catch (e) {
      console.error('Failed server forward to Google Sheets', e);
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
