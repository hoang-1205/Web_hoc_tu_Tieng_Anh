import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const vocab = dbStore.getVocabularyById(params.id);
  if (!vocab) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Vocabulary not found' } }, { status: 404 });
  }

  const data = dbStore.get();
  const family = vocab.family_id ? data.wordFamilies.find((f) => f.id === vocab.family_id) : null;
  const familyMembers = vocab.family_id ? data.vocabularies.filter((v) => v.family_id === vocab.family_id) : [];

  return NextResponse.json({
    ...vocab,
    family: family ? { ...family, members: familyMembers } : null,
  });
}
