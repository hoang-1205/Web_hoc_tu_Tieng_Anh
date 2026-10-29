'use client';

import React, { useState, useEffect } from 'react';
import { PosChip } from '@/components/common/PosChip';
import {
  Flame, Award, Shield, Flag, Box, Zap, Star, Wind, Link2,
  Trophy, CheckCircle2, Lock, Sparkles, User as UserIcon
} from 'lucide-react';
import { POSCode, Badge } from '@/types';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [progressSummary, setProgressSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/me').then((r) => r.json()),
      fetch('/api/v1/badges').then((r) => r.json()),
      fetch('/api/v1/progress/summary').then((r) => r.json()),
    ])
      .then(([u, b, p]) => {
        if (!u.error) setUser(u);
        if (b.items) setBadges(b.items);
        if (p) setProgressSummary(p);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Đang tải hồ sơ...</span>
        </div>
      </div>
    );
  }

  const nextLevelXP = Math.round(100 * Math.pow(user.level, 1.5));
  const xpPct = Math.min(100, Math.round((user.xp / nextLevelXP) * 100));

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flag': return Flag;
      case 'Box': return Box;
      case 'Zap': return Zap;
      case 'Star': return Star;
      case 'Flame': return Flame;
      default: return Award;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-8 animate-fadeIn">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="w-24 h-24 rounded-3xl object-cover ring-4 ring-brand-500/30"
          />
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-brand-600 text-white font-black text-xs shadow-md">
            Lv {user.level}
          </span>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-heading font-black text-slate-900 dark:text-white">
              {user.display_name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold text-xs">
              CEFR {user.cefr_level}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">{user.email}</p>

          {/* XP Bar */}
          <div className="max-w-md">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-500">Tiến độ cấp độ</span>
              <span className="text-brand-600 tabular-nums">{user.xp} / {nextLevelXP} XP</span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-300"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Streak & Coins Stats */}
        <div className="flex sm:flex-col gap-3">
          <div className="px-4 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 flex items-center gap-2">
            <Flame className="w-5 h-5 fill-current" />
            <div>
              <span className="text-sm font-black block leading-none">{user.streak_current} ngày</span>
              <span className="text-[10px] text-slate-400">Chuỗi hiện tại</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-700 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <span className="text-sm font-black block leading-none">{user.coins}</span>
              <span className="text-[10px] text-slate-400">Tổng Coins</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 POS Performance Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
        <h2 className="font-heading font-black text-lg text-slate-900 dark:text-white mb-2">
          Độ Chính Xác Theo 5 Loại Từ (POS Breakdown)
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Dữ liệu giúp hệ thống phát hiện loại từ bạn còn yếu để tự động đề xuất bài học bổ trợ.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {progressSummary?.by_pos?.map((pos: any) => (
            <div
              key={pos.pos_id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 text-center flex flex-col justify-between"
            >
              <div className="mb-2">
                <PosChip posCode={pos.code as POSCode} size="sm" />
              </div>
              <div>
                <span
                  className="font-heading font-black text-2xl tabular-nums block"
                  style={{ color: pos.color_hex }}
                >
                  {pos.accuracy}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {pos.attempts} lượt trả lời
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 12-Week Streak Heatmap */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 fill-rose-500" />
            Bản Đồ Nhiệt Chuỗi Ngày Học (12 Tuần)
          </h2>
          <span className="text-xs text-slate-400 font-bold">Kỷ lục: {user.streak_longest} ngày</span>
        </div>

        {/* 12-week simulated grid */}
        <div className="grid grid-cols-12 gap-1.5 overflow-x-auto pb-2">
          {Array.from({ length: 84 }).map((_, index) => {
            const isFilled = index >= 70 && index <= 77;
            const isMedium = index >= 60 && index < 70 && index % 2 === 0;
            return (
              <div
                key={index}
                className={`w-full aspect-square rounded-md transition-all ${
                  isFilled
                    ? 'bg-rose-500 shadow-sm'
                    : isMedium
                    ? 'bg-rose-300 dark:bg-rose-900/50'
                    : 'bg-slate-100 dark:bg-slate-700/60'
                }`}
                title={`Ngày ${index + 1}`}
              />
            );
          })}
        </div>
      </div>

      {/* Badges Collection */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
        <h2 className="font-heading font-black text-lg text-slate-900 dark:text-white mb-2">
          Bộ Sưu Tập Huy Hiệu (Badges)
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Ghi nhận những cột mốc học tập và sự kiên trì của bạn.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b) => {
            const Icon = getBadgeIcon(b.icon_name);
            const isEarned = Boolean(b.earned_at);
            return (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
                  isEarned
                    ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 opacity-50 bg-slate-50 dark:bg-slate-800'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    isEarned ? 'bg-amber-400 text-amber-950 shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                      {b.name_vi}
                    </h4>
                    {isEarned && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-tight">{b.description_vi}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
