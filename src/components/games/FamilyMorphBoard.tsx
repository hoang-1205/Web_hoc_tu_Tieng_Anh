'use client';

import React, { useState, useEffect } from 'react';
import { sound } from '@/lib/audio';
import { PosChip } from '../common/PosChip';
import { POSCode } from '@/types';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface FamilyMorphBoardProps {
  question: any;
  onAnswer: (answer: string, isCorrect: boolean, attemptNo: number, hintUsed: boolean) => void;
  playMode: 'learning' | 'adventure';
  onShowExplain: (data: any) => void;
}

export const FamilyMorphBoard: React.FC<FamilyMorphBoardProps> = ({
  question,
  onAnswer,
  playMode,
  onShowExplain,
}) => {
  const rootWord = 'decide';
  const validForms: Record<string, string> = {
    noun: 'decision',
    verb: 'decide',
    adj: 'decisive',
    adv: 'decisively',
  };
  const distractorCards = ['decisation', 'decidive', 'decisiously'];

  const [trayCards, setTrayCards] = useState<string[]>([]);
  const [slots, setSlots] = useState<{ [pos: string]: string | null }>({
    noun: null,
    verb: null,
    adj: null,
    adv: null,
  });
  const [selectedTrayWord, setSelectedTrayWord] = useState<string | null>(null);

  useEffect(() => {
    const all = [...Object.values(validForms), ...distractorCards].sort(() => Math.random() - 0.5);
    setTrayCards(all);
    setSlots({ noun: null, verb: null, adj: null, adv: null });
  }, [question]);

  const handleTrayWordClick = (word: string) => {
    sound.playFlip();
    setSelectedTrayWord(word);
  };

  const handleSlotClick = (pos: string) => {
    if (!selectedTrayWord) return;

    const isDistractor = distractorCards.includes(selectedTrayWord);
    const expected = validForms[pos];

    if (isDistractor) {
      sound.playWrong();
      onShowExplain({
        isCorrect: false,
        correctAnswer: expected,
        userAnswer: selectedTrayWord,
        grammarNote: `Từ "${selectedTrayWord}" là từ giả không tồn tại trong từ điển!`,
      });
      return;
    }

    if (selectedTrayWord === expected) {
      sound.playCorrect();
      setSlots((prev) => ({ ...prev, [pos]: selectedTrayWord }));
      setTrayCards((prev) => prev.filter((w) => w !== selectedTrayWord));
      setSelectedTrayWord(null);

      // Check if all 4 slots filled
      const newFilled = { ...slots, [pos]: selectedTrayWord };
      if (Object.values(newFilled).every((v) => v !== null)) {
        setTimeout(() => {
          sound.playWin();
          onAnswer('all_filled', true, 1, false);
        }, 500);
      }
    } else {
      sound.playWrong();
      onShowExplain({
        isCorrect: false,
        correctAnswer: expected,
        userAnswer: selectedTrayWord,
        grammarNote: `"${selectedTrayWord}" không phải là ${pos} của họ từ này.`,
      });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-2">
      {/* Root Word Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xl border border-slate-100 dark:border-slate-700 mb-6 text-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 block mb-1">
          Biến hình họ từ (Word Family Morph)
        </span>
        <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white">
          Gốc: <span className="text-brand-600">{rootWord}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Chọn thẻ từ khay và đặt vào đúng ô loại từ (cảnh giác với các từ giả!)
        </p>
      </div>

      {/* 4 POS Target Slots */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { pos: 'noun', label: 'Danh từ (Noun)' },
          { pos: 'verb', label: 'Động từ (Verb)' },
          { pos: 'adj', label: 'Tính từ (Adjective)' },
          { pos: 'adv', label: 'Trạng từ (Adverb)' },
        ].map((slot) => {
          const filled = slots[slot.pos];
          return (
            <div
              key={slot.pos}
              onClick={() => handleSlotClick(slot.pos)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all min-h-[90px] flex flex-col justify-between ${
                filled
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                  : selectedTrayWord
                  ? 'border-dashed border-brand-400 bg-brand-50/40 hover:bg-brand-50'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {slot.label}
              </span>
              <div className="font-heading font-black text-base sm:text-lg text-slate-900 dark:text-white">
                {filled ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    {filled}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-normal italic">
                    {selectedTrayWord ? 'Chạm để đặt vào đây' : 'Ô trống'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tray of Cards */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700">
        <span className="text-xs font-bold text-slate-400 block mb-3 uppercase tracking-wider">
          Khay thẻ từ vựng (Chạm để chọn):
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {trayCards.map((card) => {
            const isSelected = selectedTrayWord === card;
            return (
              <button
                key={card}
                onClick={() => handleTrayWordClick(card)}
                className={`px-4 py-2.5 rounded-2xl font-heading font-black text-sm border-2 shadow-sm transition-all active:scale-95 ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600 text-white scale-105 shadow-md shadow-brand-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white hover:border-brand-400'
                }`}
              >
                {card}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
