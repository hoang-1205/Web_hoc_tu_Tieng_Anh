'use client';

import React, { useState, useEffect } from 'react';
import { sound } from '@/lib/audio';
import { PosChip } from '../common/PosChip';
import { Volume2, Zap, ArrowRight } from 'lucide-react';

interface SpeedQuizBoardProps {
  question: any;
  onAnswer: (answer: string, isCorrect: boolean, attemptNo: number, hintUsed: boolean) => void;
  playMode: 'learning' | 'adventure';
  onShowExplain: (data: any) => void;
}

export const SpeedQuizBoard: React.FC<SpeedQuizBoardProps> = ({
  question,
  onAnswer,
  playMode,
  onShowExplain,
}) => {
  const targetWord = question.payload.headword || 'word';
  const promptText = question.payload.prompt;
  const correctAnswer = question.payload.correct_answer;
  const options = question.payload.options || [];
  const questionType = question.question_type;

  const [shaking, setShaking] = useState(false);

  const handleSelect = (chosenText: string) => {
    const isCorrect = chosenText.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      sound.playCorrect();
      onAnswer(chosenText, true, 1, false);
    } else {
      sound.playWrong();
      setShaking(true);
      setTimeout(() => setShaking(false), 400);

      onShowExplain({
        isCorrect: false,
        correctAnswer,
        userAnswer: chosenText,
        grammarNote: question.payload.explanation_refs?.rule_text || 'Đồng nghĩa / trái nghĩa phải cùng loại từ (POS).',
        meaning: question.payload.explanation_refs?.meaning,
      });

      onAnswer(chosenText, false, 1, false);
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto px-4 py-2 ${shaking ? 'animate-shake' : ''}`}>
      {/* Central Flash Prompt Container */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 mb-6 text-center">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded-full">
            {questionType === '3A' ? 'Phản xạ Từ vựng (Synonym / Antonym)' : 'Nghĩa từ vựng siêu tốc'}
          </span>
          <button
            onClick={() => sound.speak(targetWord, 'uk')}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 hover:text-brand-600 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-2 font-medium">
          {promptText}
        </p>

        <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {targetWord}
        </h2>
      </div>

      {/* 4 Speed Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt: any, idx: number) => (
          <button
            key={opt.id || idx}
            onClick={() => handleSelect(opt.text)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700/80 border-2 border-slate-200 dark:border-slate-700 hover:border-brand-500 font-heading font-black text-base sm:text-lg text-slate-800 dark:text-white shadow-sm transition-all duration-150 active:scale-95 text-center"
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
};
