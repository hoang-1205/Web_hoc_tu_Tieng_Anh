import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET() {
  const data = dbStore.get();
  return NextResponse.json(data.user);
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const data = dbStore.get();
    if (body.display_name) data.user.display_name = body.display_name;
    if (body.daily_goal_words) data.user.daily_goal_words = body.daily_goal_words;
    if (body.play_mode) data.user.play_mode = body.play_mode;
    if (body.cefr_level) data.user.cefr_level = body.cefr_level;
    dbStore.save();
    return NextResponse.json(data.user);
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
