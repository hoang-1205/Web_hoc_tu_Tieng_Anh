import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function DELETE(req: NextRequest, props: { params: Promise<{ vocabId: string }> }) {
  const params = await props.params;
  const data = dbStore.get();
  const userProgress = data.wordProgress[data.user.id];

  if (userProgress && userProgress[params.vocabId]) {
    userProgress[params.vocabId].in_notebook = false;
    userProgress[params.vocabId].correct_streak += 2;
    dbStore.save();
  }

  return new NextResponse(null, { status: 204 });
}
