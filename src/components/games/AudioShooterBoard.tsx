'use client';

import React, { useState, useEffect } from 'react';
import { sound } from '@/lib/audio';
import { Volume2, Crosshair } from 'lucide-react';

interface AudioShooterBoardProps {
  question: any;
  onAnswer: (answer: string, isCorrect: boolean, attemptNo: number, hintUsed: boolean) => void;
  playMode: 'learning' | 'adventure';
  onShowExplain: (data: any) => void;
}

export const AudioShooterBoard: React.FC<AudioShooterBoardProps> = ({
  question,
  onAnswer,
  playMode,
  onShowExplain,
}) => {
  const targetWord = question.payload.headword || 'affect';
  const bubbles = [targetWord, 'effect', 'accept', 'except', 'effort'].sort(() => Math.random() - 0.5);

  useEffect(() => {
    sound.speak(targetWord, 'uk');
  }, [question, targetWord]);

  const handleShoot = (word: string) => {
    const isCorrect = word.toLowerCase() === targetWord.toLowerCase();
    if (isCorrect) {
      sound.playCorrect();
      onAnswer(word, true, 1, false);
    } else {
      sound.playWrong();
      onShowExplain({
        isCorrect: false,
        correctAnswer: targetWord,
        userAnswer: word,
        grammarNote: `Phân biệt âm thanh và chính tả: "${targetWord}" vs "${word}"`,
      });
      onAnswer(word, false, 1, false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-2 text-center">
      {/* Audio Trigger Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 mb-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 block mb-2">
          Bắn từ theo âm thanh (Audio Shooter)
        </span>

        <button
          onClick={() => sound.speak(targetWord, 'uk')}
          className="mx-auto w-16 h-16 rounded-3xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 hover:scale-105 active:scale-95 transition-transform"
        >
          <Volume2 className="w-8 h-8 animate-pulse" />
        </button>
        <p className="text-xs text-slate-400 mt-3">
          Nghe kỹ âm thanh và bắn trúng bong bóng chứa từ chính xác!
        </p>
      </div>

      {/* Floating Target Bubbles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {bubbles.map((b, idx) => (
          <button
            key={idx}
            onClick={() => handleShoot(b)}
            className="h-24 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 border-2 border-brand-300 dark:border-brand-700 font-heading font-black text-lg text-slate-800 dark:text-white shadow-md hover:scale-105 active:scale-90 transition-all flex flex-col items-center justify-center gap-1 group"
          >
            <Crosshair className="w-4 h-4 text-brand-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span>{b}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
