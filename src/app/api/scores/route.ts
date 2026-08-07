import { NextRequest, NextResponse } from 'next/server';
import {
  isSupabaseConfigured,
  fetchMasterScoresFromSupabase,
  saveMasterScoresToSupabase,
} from '@/lib/supabaseClient';

// Cache TTL: only re-fetch from Supabase if dirty (new POST) or > 30s elapsed.
// This prevents hammering Supabase on every browser poll (was ~120 req/min → now ~4-8 req/min).
const SUPABASE_CACHE_TTL_MS = 30_000;

interface EventCache {
  scores: Record<string, any>;
  judgeNotes: Record<string, any>;
  resetTimestamp: number;
  config: Record<string, any> | undefined;
  lockedCards: Record<string, boolean>;
  /** True when a POST was received and the cache has unseen changes for Supabase to confirm */
  isDirty: boolean;
  /** Timestamp of last successful Supabase sync */
  lastSyncedAt: number;
}

const eventCaches: Record<string, EventCache> = {};

function getNormalizedEventId(raw?: string | null): string {
  if (!raw || raw === 'master' || raw === 'blind-rias' || raw === 'blind_rias') {
    return 'master';
  }
  return raw.replace(/-/g, '_');
}

function getEventCache(eventId: string): EventCache {
  const normId = getNormalizedEventId(eventId);
  if (!eventCaches[normId]) {
    eventCaches[normId] = {
      scores: {},
      judgeNotes: {},
      resetTimestamp: 0,
      config: undefined,
      lockedCards: {},
      isDirty: true,  // force first-ever fetch from Supabase on startup
      lastSyncedAt: 0,
    };
  }
  return eventCaches[normId];
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawEvent = searchParams.get('event');
  const eventId = getNormalizedEventId(rawEvent);
  const cache = getEventCache(eventId);

  // Primary: Fetch from Supabase ONLY when cache is dirty (new write since last sync)
  // OR when TTL has elapsed (30s safety net). This prevents ~120 reads/min → ~4-8 reads/min.
  const now = Date.now();
  const cacheIsStale = now - cache.lastSyncedAt > SUPABASE_CACHE_TTL_MS;
  if (isSupabaseConfigured && (cache.isDirty || cacheIsStale)) {
    const supabaseData = await fetchMasterScoresFromSupabase(eventId);
    if (supabaseData) {
      if (typeof supabaseData.resetTimestamp === 'number' && supabaseData.resetTimestamp > cache.resetTimestamp) {
        cache.resetTimestamp = supabaseData.resetTimestamp;
        cache.scores = supabaseData.scores || {};
        cache.judgeNotes = supabaseData.judgeNotes || {};
        cache.lockedCards = supabaseData.lockedCards || {};
      } else {
        if (Object.keys(supabaseData.scores).length > 0) {
          cache.scores = { ...cache.scores, ...supabaseData.scores };
        }
        if (Object.keys(supabaseData.judgeNotes).length > 0) {
          cache.judgeNotes = { ...cache.judgeNotes, ...supabaseData.judgeNotes };
        }
        if (supabaseData.lockedCards && Object.keys(supabaseData.lockedCards).length > 0) {
          cache.lockedCards = { ...cache.lockedCards, ...supabaseData.lockedCards };
        }
        if (typeof supabaseData.resetTimestamp === 'number') {
          cache.resetTimestamp = supabaseData.resetTimestamp;
        }
      }
      if (supabaseData.config) {
        cache.config = supabaseData.config;
      }
      // Mark cache as fresh after successful Supabase sync
      cache.isDirty = false;
      cache.lastSyncedAt = Date.now();
    }
  }

  // Instant response (10-15ms) directly from database / server memory
  return NextResponse.json(
    {
      eventId,
      scores: cache.scores,
      judgeNotes: cache.judgeNotes,
      resetTimestamp: cache.resetTimestamp,
      config: cache.config,
      lockedCards: cache.lockedCards,
      updatedAt: new Date().toISOString(),
      source: isSupabaseConfigured ? 'supabase' : 'server-memory',
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const body = await request.json();
    const rawEvent = body.eventId || searchParams.get('event');
    const eventId = getNormalizedEventId(rawEvent);
    const cache = getEventCache(eventId);

    if (body.reset) {
      cache.scores = {};
      cache.judgeNotes = {};
      cache.lockedCards = {};
      cache.resetTimestamp = Date.now();
    } else {
      if (body.scores) {
        cache.scores = { ...cache.scores, ...body.scores };
      }
      if (body.judgeNotes) {
        cache.judgeNotes = { ...cache.judgeNotes, ...body.judgeNotes };
      }
      if (body.lockedCards) {
        cache.lockedCards = { ...cache.lockedCards, ...body.lockedCards };
      }
      if (body.config) {
        cache.config = body.config;
      }
    }
    // Mark dirty so the next GET will re-confirm state with Supabase
    cache.isDirty = true;

    // Persist to Supabase PostgreSQL instantly
    if (isSupabaseConfigured) {
      saveMasterScoresToSupabase(
        cache.scores,
        cache.judgeNotes,
        cache.resetTimestamp,
        Boolean(body.reset),
        cache.config,
        cache.lockedCards,
        eventId
      ).catch((err) => console.error(`Background Supabase save error for ${eventId}:`, err));
    }

    return NextResponse.json(
      {
        success: true,
        eventId,
        scores: cache.scores,
        judgeNotes: cache.judgeNotes,
        resetTimestamp: cache.resetTimestamp,
        config: cache.config,
        lockedCards: cache.lockedCards,
        source: isSupabaseConfigured ? 'supabase' : 'server-memory',
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

