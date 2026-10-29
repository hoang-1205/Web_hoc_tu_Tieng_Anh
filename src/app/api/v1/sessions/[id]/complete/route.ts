import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();

    const result = dbStore.completeSession(params.id, {
      duration_ms: body.duration_ms || 30000,
      events: body.events || [],
    });

    return NextResponse.json({
      session_id: result.session.id,
      pack_id: result.session.pack_id,
      play_mode: result.session.play_mode,
      integrity_status: result.session.integrity_status,
      result: result.session.result,
      score: result.session.score,
      accuracy: result.session.accuracy,
      stars: result.session.stars,
      xp_earned: result.session.xp_earned,
      coins_earned: result.session.coins_earned,
      level_up: result.level_up,
      streak: result.streak,
      wrong_words: result.wrong_words,
      new_badges: [],
      next: result.next,
    });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
