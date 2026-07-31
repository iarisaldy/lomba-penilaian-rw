import { NextResponse } from 'next/server';

// Global in-memory state on Vercel Serverless Function
let globalMasterScores: Record<string, any> = {};
let globalMasterNotes: Record<string, any> = {};
let globalResetTimestamp: number = 0;

export async function GET() {
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

    // Forward Server-to-Server to Google Sheets Webhook if URL exists
    const googleSheetsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
    if (googleSheetsUrl && googleSheetsUrl.trim() !== '') {
      fetch(googleSheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reset: body.reset || false,
          scores: globalMasterScores,
          judgeNotes: globalMasterNotes,
          timestamp: new Date().toISOString(),
        }),
      }).catch((e) => console.error('Background Google Sheets forward error:', e));
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
