import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET() {
  const data = dbStore.get();
  return NextResponse.json({
    coins: data.user.coins,
    items: data.shopItems,
  });
}
