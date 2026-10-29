import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_code, quantity = 1 } = body;
    const data = dbStore.get();
    const item = data.shopItems.find((i) => i.code === item_code);

    if (!item) {
      return NextResponse.json({ error: { code: 'ITEM_NOT_FOUND', message: 'Item not found' } }, { status: 404 });
    }

    const totalCost = item.price_coins * quantity;
    if (data.user.coins < totalCost) {
      return NextResponse.json({ error: { code: 'INSUFFICIENT_COINS', message: 'Không đủ coins' } }, { status: 400 });
    }

    data.user.coins -= totalCost;
    item.owned_quantity = (item.owned_quantity || 0) + quantity;
    dbStore.save();

    return NextResponse.json({
      coins_left: data.user.coins,
      purchased_item: item,
    });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
