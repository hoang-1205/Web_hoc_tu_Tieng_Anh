import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = dbStore.get();
    data.feedback.push({
      id: `fb_${Date.now()}`,
      user_id: data.user.id,
      ...body,
      created_at: new Date().toISOString(),
    });
    dbStore.save();
    return NextResponse.json({ success: true, message: 'Cảm ơn bạn đã đóng góp phản hồi nội dung!' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
