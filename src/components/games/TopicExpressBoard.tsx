'use client';

import React, { useState, useEffect } from 'react';
import { sound } from '@/lib/audio';
import { Compass, Briefcase, Cpu, ArrowLeft, ArrowUp, ArrowRight, Zap } from 'lucide-react';

interface TopicExpressBoardProps {
  question: any;
  onAnswer: (answer: string, isCorrect: boolean, attemptNo: number, hintUsed: boolean) => void;
  playMode: 'learning' | 'adventure';
  onShowExplain: (data: any) => void;
}

export const TopicExpressBoard: React.FC<TopicExpressBoardProps> = ({
  question,
  onAnswer,
  playMode,
  onShowExplain,
}) => {
  const headword = question.payload.headword || 'itinerary';
  const targetTopic = 'du-lich';

  const [shaking, setShaking] = useState(false);

  const handleRoute = (topicSlug: string) => {
    const isCorrect = topicSlug === targetTopic;
    if (isCorrect) {
      sound.playCorrect();
      onAnswer(topicSlug, true, 1, false);
    } else {
      sound.playWrong();
      setShaking(true);
      setTimeout(() => setShaking(false), 400);

      onShowExplain({
        isCorrect: false,
        correctAnswer: 'Đời sống & Du lịch',
        userAnswer: topicSlug,
        grammarNote: `"${headword}" thuộc nhóm chủ đề Đời sống & Du lịch.`,
      });
      onAnswer(topicSlug, false, 1, false);
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto px-4 py-2 text-center ${shaking ? 'animate-shake' : ''}`}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xl border border-slate-100 dark:border-slate-700 mb-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 block mb-2">
          Tàu chủ đề (Topic Express) · Phân loại ngữ nghĩa
        </span>
        <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white">
          {headword}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Điều hướng từ vào đúng ga chủ đề tương ứng!
        </p>
      </div>

      {/* 3 Topic Stations (Left / Top / Right) */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleRoute('du-lich')}
          className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 text-emerald-700 dark:text-emerald-300 font-heading font-black text-sm shadow-md hover:scale-105 active:scale-95 transition-transform flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Ga 1</span>
          </div>
          <Compass className="w-6 h-6" />
          <span>Du lịch</span>
        </button>

        <button
          onClick={() => handleRoute('cong-so')}
          className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-heading font-black text-sm shadow-md hover:scale-105 active:scale-95 transition-transform flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-1 text-xs">
            <ArrowUp className="w-4 h-4" />
            <span>Ga 2</span>
          </div>
          <Briefcase className="w-6 h-6" />
          <span>Công sở</span>
        </button>

        <button
          onClick={() => handleRoute('cong-nghe')}
          className="p-4 rounded-3xl bg-pink-50 dark:bg-pink-950/40 border-2 border-pink-400 text-pink-700 dark:text-pink-300 font-heading font-black text-sm shadow-md hover:scale-105 active:scale-95 transition-transform flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-1 text-xs">
            <ArrowRight className="w-4 h-4" />
            <span>Ga 3</span>
          </div>
          <Cpu className="w-6 h-6" />
          <span>Công nghệ</span>
        </button>
      </div>
    </div>
  );
};
