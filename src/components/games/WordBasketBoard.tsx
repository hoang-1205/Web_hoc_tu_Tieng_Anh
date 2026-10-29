'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sound } from '@/lib/audio';
import { PosChip } from '../common/PosChip';
import { POSCode } from '@/types';
import { Box, Zap, Star, Wind, Link2 } from 'lucide-react';

interface WordBasketBoardProps {
  question: any;
  onAnswer: (answer: string, isCorrect: boolean, attemptNo: number, hintUsed: boolean) => void;
  playMode: 'learning' | 'adventure';
  onShowExplain: (data: any) => void;
}

export const WordBasketBoard: React.FC<WordBasketBoardProps> = ({
  question,
  onAnswer,
  playMode,
  onShowExplain,
}) => {
  const headword = question.payload.headword;
  const correctPos: POSCode = question.payload.correct_answer || 'noun';
  const meaning = question.payload.explanation_refs?.meaning;

  const [posY, setPosY] = useState(10);
  const [shaking, setShaking] = useState(false);

  // Simulated falling animation
  useEffect(() => {
    setPosY(10);
    const interval = setInterval(() => {
      setPosY((prev) => {
        if (prev >= 80) {
          // Bottom reached: missed!
          clearInterval(interval);
          handleBasketChoice('none' as any);
          return 80;
        }
        return prev + 1.2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [question]);

  const handleBasketChoice = (pos: POSCode) => {
    const isCorrect = pos === correctPos;
    if (isCorrect) {
      sound.playCorrect();
      onAnswer(pos, true, 1, false);
    } else {
      sound.playWrong();
      setShaking(true);
      setTimeout(() => setShaking(false), 400);

      onShowExplain({
        isCorrect: false,
        correctAnswer: correctPos,
        userAnswer: pos === ('none' as any) ? 'Để rơi chạm đáy' : pos,
        grammarNote: `Từ "${headword}" là một ${correctPos}. Hãy chú ý các hậu tố nhận diện loại từ!`,
        meaning,
      });

      onAnswer(pos, false, 1, false);
    }
  };

  // Keyboard shortcut listener (1-5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') handleBasketChoice('noun');
      else if (e.key === '2') handleBasketChoice('verb');
      else if (e.key === '3') handleBasketChoice('adj');
      else if (e.key === '4') handleBasketChoice('adv');
      else if (e.key === '5') handleBasketChoice('phrasal_verb');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [correctPos]);

  const baskets: { code: POSCode; label: string; keyNum: string; icon: any; color: string }[] = [
    { code: 'noun', label: 'Danh từ', keyNum: '1', icon: Box, color: 'border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600' },
    { code: 'verb', label: 'Động từ', keyNum: '2', icon: Zap, color: 'border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-pink-600' },
    { code: 'adj', label: 'Tính từ', keyNum: '3', icon: Star, color: 'border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600' },
    { code: 'adv', label: 'Trạng từ', keyNum: '4', icon: Wind, color: 'border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600' },
    { code: 'phrasal_verb', label: 'Cụm ĐT', keyNum: '5', icon: Link2, color: 'border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600' },
  ];

  return (
    <div className={`w-full max-w-xl mx-auto px-4 py-2 ${shaking ? 'animate-shake' : ''}`}>
      {/* Falling Canvas Area */}
      <div className="relative h-64 bg-gradient-to-b from-indigo-50/50 to-slate-50 dark:from-slate-900 dark:to-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 shadow-inner flex flex-col items-center">
        <span className="absolute top-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Rổ loại từ (Word Basket) · Bấm phím 1-5 hoặc chạm rổ
        </span>

        {/* Falling Word Bubble */}
        <div
          className="absolute transform -translate-x-1/2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-700 shadow-xl border-2 border-brand-500 font-heading font-black text-lg text-slate-900 dark:text-white transition-all duration-75 flex items-center gap-2"
          style={{ top: `${posY}%`, left: '50%' }}
        >
          <span>{headword}</span>
        </div>
      </div>

      {/* 5 POS Catching Baskets */}
      <div className="grid grid-cols-5 gap-2">
        {baskets.map((b) => {
          const Icon = b.icon;
          return (
            <button
              key={b.code}
              onClick={() => handleBasketChoice(b.code)}
              className={`p-3 rounded-2xl bg-white dark:bg-slate-800 border-2 shadow-sm flex flex-col items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 ${b.color}`}
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {b.keyNum}
                </span>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-black truncate w-full text-center">
                {b.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
