'use client';

import React, { useState, useEffect } from 'react';
import { sound } from '@/lib/audio';
import { Trophy, Medal, Award, Flame, Sparkles } from 'lucide-react';

export default function LeaderboardPage() {
  const [scope, setScope] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const [leaderboardData, setLeaderboardData] = useState<any>({ items: [], me: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/leaderboard?scope=${scope}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setLeaderboardData(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [scope]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-sm shadow-md">🥇</span>;
    if (rank === 2) return <span className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-black flex items-center justify-center text-sm shadow-md">🥈</span>;
    if (rank === 3) return <span className="w-8 h-8 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-sm shadow-md">🥉</span>;
    return <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black flex items-center justify-center text-xs">#{rank}</span>;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Bảng Xếp Hạng Đấu Trường Từ Vựng</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white">
          Vinh Danh Học Bá Xuất Sắc
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Tích lũy XP từ các phiên chơi L1–L3 và duy trì chuỗi Streak mỗi ngày.
        </p>
      </div>

      {/* Scope Selector Tabs */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700">
        {[
          { id: 'weekly', label: 'Bảng Tuần Này' },
          { id: 'monthly', label: 'Bảng Tháng Này' },
          { id: 'all', label: 'Mọi Thời Đại' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sound.playFlip();
              setScope(tab.id as any);
            }}
            className={`flex-1 py-2.5 rounded-xl font-heading font-black text-xs sm:text-sm transition-all ${
              scope === tab.id
                ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
        {leaderboardData.items.map((item: any) => (
          <div
            key={item.user_id}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
              item.is_me
                ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-500 shadow-md ring-2 ring-brand-500/30'
                : 'bg-slate-50/70 dark:bg-slate-700/40 border-slate-100 dark:border-slate-700/60'
            }`}
          >
            <div className="flex items-center gap-3">
              {getRankBadge(item.rank)}
              <img
                src={item.avatar}
                alt={item.display_name}
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700"
              />
              <div>
                <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                  {item.display_name}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                  Lv {item.level}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="font-heading font-black text-base sm:text-lg text-brand-600 dark:text-brand-400 tabular-nums">
                {item.xp.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 ml-1">XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
