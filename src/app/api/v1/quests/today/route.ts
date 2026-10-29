import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET() {
  const data = dbStore.get();
  const quests = data.dailyQuests[data.user.id] || [];
  return NextResponse.json({ items: quests });
}
