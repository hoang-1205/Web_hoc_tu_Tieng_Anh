'use client';

import React from 'react';
import { Heart, Pause, Play, HelpCircle, SkipForward, Volume2, Flame } from 'lucide-react';
import { PlayMode } from '@/types';

interface GameHUDProps {
  currentQuestion: number;
  totalQuestions: number;
  hearts: number;
  maxHearts: number;
  score: number;
  combo: number;
  timeLeft: number;
  playMode: PlayMode;
  isPaused: boolean;
  onPauseToggle: () => void;
  onHint: () => void;
  onSkip: () => void;
  onExit: () => void;
  onExplainClick?: () => void;
  hintCount?: number;
  canHint?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentQuestion,
  totalQuestions,
  hearts,
  maxHearts,
  score,
  combo,
  timeLeft,
  playMode,
  isPaused,
  onPauseToggle,
  onHint,
  onSkip,
  onExit,
  onExplainClick,
  hintCount = 2,
  canHint = true,
}) => {
  const isLearning = playMode === 'learning';
  const progressPct = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;
  const isTimeCritical = timeLeft > 0 && timeLeft <= 5 && !isLearning;
  const comboMult = Math.min(3.0, 1 + 0.5 * Math.floor(combo / 3));

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-3">
      {/* Top Bar: Exit + Progress + Timer + Pause */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <button
          onClick={onExit}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
          title="Thoát phiên chơi"
        >
          ✕
        </button>

        {/* Progress bar */}
        <div className="flex-1 max-w-md">
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Câu {currentQuestion}/{totalQuestions}</span>
            {isLearning && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Chế độ Học không áp lực
              </span>
            )}
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Timer (hidden in learning mode) */}
        {!isLearning && (
          <div
            className={`font-mono font-bold text-sm px-3 py-1 rounded-xl transition-all ${
              isTimeCritical
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </div>
        )}

        {/* Pause Button */}
        <button
          onClick={onPauseToggle}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center transition-colors"
          title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
        >
          {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>

      {/* Stats Bar: Hearts + Score + Combo Multiplier */}
      <div className="flex items-center justify-between py-1 px-1">
        {/* Hearts */}
        {!isLearning ? (
          <div className="flex items-center gap-1">
            {Array.from({ length: maxHearts }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-transform duration-200 ${
                  i < hearts
                    ? 'text-rose-500 fill-rose-500 scale-100'
                    : 'text-slate-300 dark:text-slate-700 scale-90'
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Vô hạn Máu
          </div>
        )}

        {/* Combo flame */}
        {combo >= 2 && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-black tracking-wide animate-bounce">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>COMBO x{comboMult}</span>
          </div>
        )}

        {/* Score */}
        <div className="text-right">
          <span className="font-heading font-black text-lg text-brand-600 dark:text-brand-400 tabular-nums">
            {score.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 ml-1">pt</span>
        </div>
      </div>

      {/* Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mx-auto mb-4">
              <Pause className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
              Trò chơi tạm dừng
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Bạn có thể nghỉ ngơi tối đa 30 giây mà không bị tính quá giờ.
            </p>
            <div className="space-y-3">
              <button
                onClick={onPauseToggle}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-transform active:scale-95"
              >
                Tiếp tục chơi
              </button>
              <button
                onClick={onExit}
                className="w-full py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Rời phiên chơi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
