import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const answers = body.answers || [];
    let score = 0;
    answers.forEach((a: any) => {
      if (a.is_correct) score++;
    });

    let cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' = 'A1';
    if (score >= 8) cefrLevel = 'B1';
    else if (score >= 5) cefrLevel = 'A2';
    else cefrLevel = 'A1';

    const data = dbStore.get();
    data.user.cefr_level = cefrLevel;
    data.user.onboarded = true;
    if (body.daily_goal_words) data.user.daily_goal_words = body.daily_goal_words;
    dbStore.save();

    return NextResponse.json({
      cefr_level: cefrLevel,
      score,
      total: answers.length || 10,
      user: data.user,
    });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
