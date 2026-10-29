import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET() {
  const data = dbStore.get();
  const userPath = data.userPaths[data.user.id];
  return NextResponse.json(userPath || null);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = dbStore.get();
    const pathId = body.path_id || 1;

    data.userPaths[data.user.id] = {
      user_id: data.user.id,
      path_id: pathId,
      current_step: 1,
      step_progress: 0,
      started_at: new Date().toISOString(),
    };
    dbStore.save();

    return NextResponse.json(data.userPaths[data.user.id]);
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
