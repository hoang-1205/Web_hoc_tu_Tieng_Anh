import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const data = dbStore.get();
    const session = dbStore.getSessionById(params.id);

    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session không tồn tại' } },
        { status: 404 }
      );
    }

    // Kiểm tra chủ sở hữu session
    const currentUser = data.user;
    if (session.user_id && currentUser && session.user_id !== currentUser.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Bạn không có quyền truy cập phiên này' } },
        { status: 403 }
      );
    }

    // Kiểm tra pack hợp lệ
    const pack = data.studyPacks[session.pack_id];
    if (!pack) {
      return NextResponse.json(
        { error: { code: 'INVALID_PACK', message: 'Pack liên kết với phiên không tồn tại' } },
        { status: 400 }
      );
    }

    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
