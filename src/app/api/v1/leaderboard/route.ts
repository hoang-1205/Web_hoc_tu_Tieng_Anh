import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope') || 'weekly';
  const data = dbStore.get();

  const mockLeaderboard = [
    { rank: 1, user_id: 'u1', display_name: 'Minh Vũ', level: 9, xp: 2340, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
    { rank: 2, user_id: 'u2', display_name: 'Thu Hà', level: 8, xp: 2105, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { rank: 3, user_id: 'u3', display_name: 'Bảo Long', level: 7, xp: 1890, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100' },
    { rank: 4, user_id: 'u4', display_name: 'Phương Thảo', level: 7, xp: 1650, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100' },
    { rank: 5, user_id: 'u5', display_name: 'Quang Huy', level: 6, xp: 1420, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { rank: 6, user_id: 'u6', display_name: 'Diệu Linh', level: 6, xp: 1310, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
    { rank: 7, user_id: data.user.id, display_name: data.user.display_name + ' (Bạn)', level: data.user.level, xp: data.user.xp, avatar: data.user.avatar_url, is_me: true },
    { rank: 8, user_id: 'u7', display_name: 'Tuấn Kiệt', level: 5, xp: 1190, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  ];

  return NextResponse.json({
    scope,
    items: mockLeaderboard,
    me: {
      rank: 7,
      xp: data.user.xp,
    },
  });
}
