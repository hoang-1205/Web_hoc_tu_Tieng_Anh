import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const data = dbStore.get();
  const pack = data.studyPacks[params.id];
  if (!pack) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Pack not found' } }, { status: 404 });
  }

  return NextResponse.json(pack);
}
