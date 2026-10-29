import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = dbStore.get();
    const userId = body.user_id || data.user.id;

    const session = dbStore.createSession({
      userId,
      packId: body.pack_id,
      level: body.level || 1,
      roundNo: body.round_no || 1,
      gameCode: body.game_code || 'flip_card',
      playMode: body.play_mode || data.user.play_mode || 'adventure',
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
