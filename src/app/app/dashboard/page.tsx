'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/audio';
import { PosChip } from '@/components/common/PosChip';
import {
  Flame, Sparkles, BookOpen, Repeat, Trophy, ArrowRight,
  CheckCircle2, Clock, Zap, Target, AlertCircle, Compass, ChevronRight, Gift
} from 'lucide-react';
import { POSCode } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [progressSummary, setProgressSummary] = useState<any>(null);
  const [reviewQueue, setReviewQueue] = useState<any>({ due_count: 0, notebook_count: 0 });
  const [nextStep, setNextStep] = useState<any>(null);
  const [creatingPack, setCreatingPack] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/me').then((r) => r.json()),
      fetch('/api/v1/quests/today').then((r) => r.json()),
      fetch('/api/v1/progress/summary').then((r) => r.json()),
      fetch('/api/v1/review/queue').then((r) => r.json()),
      fetch('/api/v1/me/path/next').then((r) => r.json()),
    ])
      .then(([u, q, p, r, n]) => {
        if (!u.error) setUser(u);
        if (q.items) setQuests(q.items);
        if (p) setProgressSummary(p);
        if (r) setReviewQueue(r);
        if (n) setNextStep(n);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleClaimQuest = async (questCode: string) => {
    try {
      const res = await fetch(`/api/v1/quests/${questCode}/claim`, { method: 'POST' });
      const data = await res.json();
      if (!data.error) {
        sound.playCorrect();
        setQuests((prev) =>
          prev.map((q) => (q.quest_code === questCode ? { ...q, claimed: true } : q))
        );
        setUser((prev: any) => ({ ...prev, coins: data.new_balance }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleContinueLearning = async () => {
    if (creatingPack) return;
    setCreatingPack(true);
    try {
      const payload = nextStep?.suggested_pack || {
        source_type: 'topic',
        topic_ids: [1],
      };
      const res = await fetch('/api/v1/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const pack = await res.json();
      router.push(`/app/quest/${pack.id || pack.pack_id}`);
    } catch (err) {
      console.error(err);
      router.push('/app/library');
    } finally {
      setCreatingPack(false);
    }
  };

  const handleStartReview = async () => {
    try {
      const res = await fetch('/api/v1/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_type: 'review' }),
      });
      const pack = await res.json();
      router.push(`/app/quest/${pack.id || pack.pack_id}`);
    } catch (err) {
      router.push('/app/review');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Đang tải bảng điều khiển...</span>
        </div>
      </div>
    );
  }

  const nextLevelXP = Math.round(100 * Math.pow(user?.level || 1, 1.5));
  const currentXP = user?.xp || 0;
  const xpPct = Math.min(100, Math.round((currentXP / nextLevelXP) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full space-y-8 animate-fadeIn">
      {/* Top Banner: Greeting + XP Progress Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Chào mừng trở lại,
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{user?.display_name || 'Học Bá'}!</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
              CEFR {user?.cefr_level}
            </span>
          </h1>
        </div>

        {/* XP Bar */}
        <div className="w-full md:w-80">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-slate-500">Cấp độ Lv {user?.level}</span>
            <span className="text-brand-600 dark:text-brand-400 tabular-nums">
              {currentXP} / {nextLevelXP} XP
            </span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 Main Action Cards (Row 1): Nhiệm vụ hôm nay | Ôn tập SRS | Bước kế tiếp */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Nhiệm vụ hôm nay */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-brand-600" />
                Nhiệm vụ hôm nay
              </span>
              <span className="text-xs font-black text-brand-600">
                {quests.filter((q) => q.progress >= q.target).length}/3
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {quests.map((q) => {
                const isDone = q.progress >= q.target;
                return (
                  <div
                    key={q.quest_code}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {q.title_vi}
                        </p>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {q.progress}/{q.target} · +{q.reward_coins} coins
                        </span>
                      </div>
                    </div>

                    {isDone && !q.claimed && (
                      <button
                        onClick={() => handleClaimQuest(q.quest_code)}
                        className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] shadow-sm flex items-center gap-1 transition-transform active:scale-95"
                      >
                        <Gift className="w-3 h-3" />
                        Nhận
                      </button>
                    )}
                    {q.claimed && (
                      <span className="text-[10px] font-bold text-emerald-600">Đã nhận</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleContinueLearning}
            disabled={creatingPack}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-heading font-black text-sm rounded-2xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span>{creatingPack ? 'Đang tạo Pack...' : 'Tiếp Tục Học >'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Ôn tập SRS & Sổ tay */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-emerald-600" />
                Ôn tập SRS (SM-2)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs">
                {reviewQueue.due_count} từ đến hạn
              </span>
            </div>

            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 mb-4">
              <div className="text-3xl font-heading font-black text-emerald-700 dark:text-emerald-400 mb-1">
                {reviewQueue.due_count}
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Từ vựng cần củng cố hôm nay theo đường cong quên lãng Ebbinghaus.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-6 px-1">
              <span>Sổ tay từ sai cần ôn:</span>
              <span className="font-bold text-rose-500">{reviewQueue.notebook_count} từ</span>
            </div>
          </div>

          <button
            onClick={handleStartReview}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span>Ôn Ngay (Dạng Game)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 3: Smart Coach Recommendation */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Coach Gợi Ý Học Tập
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Từ UserPosStats
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 mb-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                    Bạn hay nhầm vị trí Trạng từ (Adv)
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Độ chính xác trạng từ của bạn hiện là 74%. Hãy thử luyện tập Sentence Builder để làm chủ vị trí trạng từ trước động từ thường!
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1 mb-6 px-1">
              <div className="flex justify-between">
                <span>Lộ trình đang theo:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {nextStep?.path?.name_vi || 'A2 Đời sống & Du lịch'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bước hiện tại:</span>
                <span className="font-bold text-brand-600">
                  Bước {nextStep?.step?.step_no || 2} · {nextStep?.step?.title_vi || 'Động từ'}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/app/path"
            className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-heading font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <span>Xem Chi Tiết Lộ Trình</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Row 2: Tiến độ học tập (Chủ đề & 5 Loại từ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress by Topic */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-600" />
              Tiến Độ Theo Chủ Đề
            </h3>
            <Link href="/app/library" className="text-xs text-brand-600 font-bold hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-4">
            {progressSummary?.by_topic?.slice(0, 4).map((t: any) => (
              <div key={t.topic_id}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700 dark:text-slate-200">{t.name_vi}</span>
                  <span className="text-slate-400 tabular-nums">{t.progress_pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${t.progress_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress by 5 Parts of Speech */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              Độ Chính Xác 5 Loại Từ (POS)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Cố định toàn hệ thống</span>
          </div>

          <div className="space-y-4">
            {progressSummary?.by_pos?.map((pos: any) => (
              <div key={pos.pos_id} className="flex items-center gap-3">
                <div className="min-w-[100px]">
                  <PosChip posCode={pos.code as POSCode} size="sm" />
                </div>
                <div className="flex-1">
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pos.accuracy}%`,
                        backgroundColor: pos.color_hex,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 min-w-[36px] text-right tabular-nums">
                  {pos.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Streak Heatmap Week Tracker */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
            <Flame className="w-7 h-7 fill-current animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-heading font-black text-slate-900 dark:text-white">
              Chuỗi học liên tục {user?.streak_current} ngày!
            </h4>
            <p className="text-xs text-slate-500">
              Kỷ lục dài nhất: {user?.streak_longest} ngày · Bạn còn {user?.streak_freezes || 1} Khiên bảo vệ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => {
            const isCompleted = idx < (user?.streak_current || 5);
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400">{day}</span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30 scale-100'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 scale-90'
                  }`}
                >
                  {isCompleted ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
