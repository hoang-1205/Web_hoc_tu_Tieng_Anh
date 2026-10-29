import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: NextRequest, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const data = dbStore.get();
  const quests = data.dailyQuests[data.user.id] || [];
  const quest = quests.find((q) => q.quest_code === params.code);

  if (!quest) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Quest not found' } }, { status: 404 });
  }

  if (quest.claimed) {
    return NextResponse.json({ error: { code: 'ALREADY_CLAIMED', message: 'Quest already claimed' } }, { status: 400 });
  }

  if (quest.progress < quest.target) {
    return NextResponse.json({ error: { code: 'NOT_COMPLETED', message: 'Quest not yet completed' } }, { status: 400 });
  }

  quest.claimed = true;
  data.user.coins += quest.reward_coins;
  dbStore.save();

  return NextResponse.json({
    coins_added: quest.reward_coins,
    new_balance: data.user.coins,
  });
}
