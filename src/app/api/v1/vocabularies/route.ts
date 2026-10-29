import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topicId = searchParams.get('topic') ? parseInt(searchParams.get('topic')!, 10) : undefined;
  const posId = searchParams.get('pos') ? parseInt(searchParams.get('pos')!, 10) : undefined;
  const familyId = searchParams.get('family_id') ? parseInt(searchParams.get('family_id')!, 10) : undefined;
  const search = searchParams.get('q') || undefined;

  const items = dbStore.getVocabularies({
    topic_id: topicId,
    pos_id: posId,
    family_id: familyId,
    search,
  });

  return NextResponse.json({
    items,
    total: items.length,
  });
}
