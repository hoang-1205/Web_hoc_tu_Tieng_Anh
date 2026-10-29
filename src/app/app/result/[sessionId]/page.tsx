'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { sound } from '@/lib/audio';
import { PosChip } from '@/components/common/PosChip';
import {
  Star, Trophy, Flame, Coins, Zap, Repeat, ArrowRight,
  BookOpen, Sparkles, CheckCircle2, AlertCircle, Volume2
} from 'lucide-react';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [starsShown, setStarsShown] = useState<number>(0);
  const [resultData, setResultData] = useState<any>({
    result: 'win',
    score: 0,
    accuracy: 0,
    stars: 0,
    xp_earned: 0,
    coins_earned: 0,
    streak: { current: 1, extended_today: false },
    wrong_words: [],
    next: null,
    level: 1,
    round_no: 1,
    pack_id: '',
  });

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/v1/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((session) => {
        if (!isMounted || session.error) return;

        const completed = session.completed_result || {};
        const isWin = session.result === 'win';
        const stars = session.stars || 0;

        setResultData({
          result: session.result || 'win',
          score: session.score || 0,
          accuracy: session.accuracy || 0,
          stars,
          xp_earned: session.xp_earned || 0,
          coins_earned: session.coins_earned || 0,
          streak: completed.streak || { current: 1, extended_today: false },
          wrong_words: completed.wrong_words || [],
          next: completed.next || null,
          level: session.level || 1,
          round_no: session.round_no || 1,
          pack_id: session.pack_id,
        });

        if (isWin) {
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch (e) {}

          setTimeout(() => {
            if (isMounted) {
              setStarsShown(1);
              sound.playStar(0);
            }
          }, 400);

          setTimeout(() => {
            if (isMounted && stars >= 2) {
              setStarsShown(2);
              sound.playStar(1);
            }
          }, 800);

          setTimeout(() => {
            if (isMounted && stars >= 3) {
              setStarsShown(3);
              sound.playStar(2);
            }
          }, 1200);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const isWin = resultData.result === 'win';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 w-full text-center space-y-8 animate-fadeIn">
      {/* Title & Celebration */}
      <div>
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
            isWin
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {isWin
              ? `Hoàn Thành Cấp L${resultData.level} · Vòng ${resultData.round_no}`
              : `Chưa Vượt Qua Cấp L${resultData.level} · Vòng ${resultData.round_no}`}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white mb-2">
          {isWin ? 'Xuất Sắc! Bạn Đã Vượt Qua Vòng Này' : 'Rất Tiếc! Hãy Thử Lại Lần Nữa'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {isWin
            ? 'Hệ thống đã cập nhật điểm thưởng, chuỗi Streak và thuật toán SRS cho từng từ.'
            : 'Độ chính xác hoặc Máu chưa đạt yêu cầu. Luyện tập thêm để vượt qua nhé!'}
        </p>
      </div>

      {/* 3 Stars Pop Animation (chỉ hiển thị khi thắng) */}
      {isWin && (
        <div className="flex items-center justify-center gap-4 py-2">
          {[1, 2, 3].map((starIndex) => {
            const isPop = starsShown >= starIndex;
            return (
              <div
                key={starIndex}
                className={`transition-all duration-500 transform ${
                  isPop ? 'scale-110 rotate-0' : 'scale-75 opacity-20 rotate-12'
                }`}
              >
                <Star
                  className={`w-14 h-14 sm:w-16 sm:h-16 ${
                    isPop
                      ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Score & Rewards Breakdown Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">TỔNG ĐIỂM</span>
          <span className="text-xl sm:text-2xl font-heading font-black text-brand-600 dark:text-brand-400 tabular-nums">
            {resultData.score.toLocaleString()}
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">ĐỘ CHÍNH XÁC</span>
          <span className="text-xl sm:text-2xl font-heading font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {resultData.accuracy}%
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">XP NHẬN ĐƯỢC</span>
          <span className="text-xl sm:text-2xl font-heading font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
            +{resultData.xp_earned} XP
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">COINS KIẾM ĐƯỢC</span>
          <span className="text-xl sm:text-2xl font-heading font-black text-amber-500 tabular-nums">
            +{resultData.coins_earned}
          </span>
        </div>
      </div>

      {/* Wrong Words / Sổ tay từ sai */}
      {resultData.wrong_words && resultData.wrong_words.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Từ Cần Ôn Tập (Đã Tự Động Gom Vào Sổ Tay)
            </h3>
            <span className="text-[11px] text-slate-400">
              Rời sổ tay khi đúng 2 lần liên tiếp
            </span>
          </div>

          <div className="space-y-2.5">
            {resultData.wrong_words.map((w: any) => (
              <div
                key={w.vocab_id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-heading font-black text-base text-slate-900 dark:text-white">
                    {w.headword}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                    Lỗi: {w.error_category}
                  </span>
                </div>

                <button
                  onClick={() => sound.speak(w.headword, 'uk')}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-brand-600 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons (Lỗi 2: Điều hướng đúng Round tiếp theo hoặc Cấp tiếp theo) */}
      <div className="space-y-3">
        {isWin && resultData.next ? (
          <Link
            href={resultData.pack_id ? `/app/quest/${resultData.pack_id}` : '/app/dashboard'}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-heading font-black text-base rounded-2xl shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span>
              {resultData.next.level === resultData.level
                ? `Tiếp Tục Sang Vòng ${resultData.next.round_no} (L${resultData.next.level}) >`
                : `Tiếp Tục Lên Cấp L${resultData.next.level} >`}
            </span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        ) : isWin && !resultData.next ? (
          <Link
            href="/app/dashboard"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-black text-base rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span>Hoàn Thành Trọn Vẹn Pack! Về Trang Chủ &gt;</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        ) : (
          <Link
            href={resultData.pack_id ? `/app/quest/${resultData.pack_id}` : '/app/dashboard'}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-heading font-black text-base rounded-2xl shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span>Chơi Lại Vòng Này &gt;</span>
            <Repeat className="w-5 h-5" />
          </Link>
        )}

        <div className="flex gap-3">
          <Link
            href="/app/review"
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-white font-bold text-xs rounded-2xl transition-colors"
          >
            Mở Sổ Tay Ôn Từ Sai
          </Link>
          <Link
            href="/app/dashboard"
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-white font-bold text-xs rounded-2xl transition-colors"
          >
            Về Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
