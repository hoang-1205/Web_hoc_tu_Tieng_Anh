import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = dbStore.get();
    const userId = body.user_id || data.user.id;

    const pack = dbStore.createPack({
      userId,
      sourceType: body.source_type || 'topic',
      topicIds: body.topic_ids,
      posIds: body.pos_ids,
      familyId: body.family_id,
      pathStepId: body.path_step_id,
    });

    return NextResponse.json(pack, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
