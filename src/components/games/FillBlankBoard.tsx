'use client';

import React, { useState, useEffect } from 'react';
import { sound } from '@/lib/audio';
import { PosChip } from '../common/PosChip';
import { POSCode } from '@/types';
import { Volume2, HelpCircle, Delete, ArrowRight } from 'lucide-react';

interface FillBlankBoardProps {
  question: any;
  onAnswer: (answer: string, isCorrect: boolean, attemptNo: number, hintUsed: boolean) => void;
  playMode: 'learning' | 'adventure';
  onShowExplain: (data: any) => void;
}

export const FillBlankBoard: React.FC<FillBlankBoardProps> = ({
  question,
  onAnswer,
  playMode,
  onShowExplain,
}) => {
  const is2B = question.question_type === '2B';
  const targetWord = question.payload.correct_answer;
  const sentenceTemplate = question.payload.prompt || 'She made a {{blank}} move.';
  const translation = question.payload.translation || '';
  const options = question.payload.options || [];

  // 2A: Letter blanks state
  const [lettersState, setLettersState] = useState<{
    slots: (string | null)[];
    hiddenIndices: number[];
    keyboardLetters: { id: string; char: string; used: boolean }[];
  }>({ slots: [], hiddenIndices: [], keyboardLetters: [] });

  const [attemptNo, setAttemptNo] = useState(1);
  const [hintUsed, setHintUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [shaking, setShaking] = useState(false);

  // Initialize 2A
  useEffect(() => {
    if (!is2B && targetWord) {
      const len = targetWord.length;
      const hideCount = Math.max(1, Math.min(len - 1, Math.ceil(len * 0.4)));
      const indices: number[] = [];

      // Don't hide first letter
      while (indices.length < hideCount) {
        const idx = Math.floor(Math.random() * (len - 1)) + 1;
        if (!indices.includes(idx)) indices.push(idx);
      }

      const slots = targetWord.split('').map((char: string, i: number) => (indices.includes(i) ? null : char));

      // Letters for keyboard: hidden letters + 3 random alphabet letters
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      const hiddenChars = indices.map((i) => targetWord[i].toLowerCase());
      const distractorChars: string[] = [];
      while (distractorChars.length < 3) {
        const rand = alphabet[Math.floor(Math.random() * alphabet.length)];
        distractorChars.push(rand);
      }

      const allLetters = [...hiddenChars, ...distractorChars]
        .sort(() => Math.random() - 0.5)
        .map((char, index) => ({
          id: `key_${index}_${char}`,
          char,
          used: false,
        }));

      setLettersState({
        slots,
        hiddenIndices: indices,
        keyboardLetters: allLetters,
      });
      setAttemptNo(1);
      setHintUsed(false);
      setEliminatedOptions([]);
    }
  }, [question, is2B, targetWord]);

  // Handle 2B option selection
  const handleSelectOption = (chosenText: string) => {
    const isCorrect = chosenText.trim().toLowerCase() === targetWord.trim().toLowerCase();

    if (isCorrect) {
      sound.playCorrect();
      onAnswer(chosenText, true, attemptNo, hintUsed);
    } else {
      sound.playWrong();
      setShaking(true);
      setTimeout(() => setShaking(false), 500);

      // Trigger ExplainSheet with full grammatical breakdown
      onShowExplain({
        isCorrect: false,
        correctAnswer: targetWord,
        userAnswer: chosenText,
        grammarNote: question.payload.explanation_refs?.grammar_note,
        distractorReasons: question.payload.explanation_refs?.distractor_reasons,
        translation: question.payload.translation,
        meaning: question.payload.explanation_refs?.meaning,
      });

      onAnswer(chosenText, false, attemptNo, hintUsed);
    }
  };

  // 2A: Typing letter tile
  const handleKeyClick = (keyItem: { id: string; char: string; used: boolean }) => {
    if (keyItem.used) return;
    const firstEmptyIndex = lettersState.slots.findIndex((s) => s === null);
    if (firstEmptyIndex === -1) return;

    sound.playFlip();

    const newSlots = [...lettersState.slots];
    newSlots[firstEmptyIndex] = keyItem.char;

    const newKeyboard = lettersState.keyboardLetters.map((k) =>
      k.id === keyItem.id ? { ...k, used: true } : k
    );

    setLettersState({
      ...lettersState,
      slots: newSlots,
      keyboardLetters: newKeyboard,
    });

    // Check if word is complete
    if (!newSlots.includes(null)) {
      const assembledWord = newSlots.join('');
      const isCorrect = assembledWord.toLowerCase() === targetWord.toLowerCase();

      if (isCorrect) {
        sound.playCorrect();
        sound.speak(targetWord, 'uk');
        onAnswer(assembledWord, true, attemptNo, hintUsed);
      } else {
        sound.playWrong();
        setShaking(true);
        setTimeout(() => setShaking(false), 400);

        if (attemptNo < 2) {
          setAttemptNo(2);
          // Reset slots for 2nd try
          setTimeout(() => {
            setLettersState((prev) => ({
              ...prev,
              slots: targetWord.split('').map((char: string, i: number) =>
                prev.hiddenIndices.includes(i) ? null : char
              ),
              keyboardLetters: prev.keyboardLetters.map((k) => ({ ...k, used: false })),
            }));
          }, 600);
        } else {
          onShowExplain({
            isCorrect: false,
            correctAnswer: targetWord,
            userAnswer: assembledWord,
            grammarNote: question.payload.explanation_refs?.grammar_note,
            translation: question.payload.translation,
          });
          onAnswer(assembledWord, false, attemptNo, hintUsed);
        }
      }
    }
  };

  // 2A: Backspace delete letter
  const handleDeleteSlot = () => {
    const filledHiddenIndices = lettersState.hiddenIndices
      .filter((i) => lettersState.slots[i] !== null)
      .reverse();

    if (filledHiddenIndices.length === 0) return;
    const lastIndex = filledHiddenIndices[0];
    const charToRemove = lettersState.slots[lastIndex];

    const newSlots = [...lettersState.slots];
    newSlots[lastIndex] = null;

    // Free key in keyboard
    let freed = false;
    const newKeyboard = lettersState.keyboardLetters.map((k) => {
      if (!freed && k.used && k.char === charToRemove) {
        freed = true;
        return { ...k, used: false };
      }
      return k;
    });

    setLettersState({
      ...lettersState,
      slots: newSlots,
      keyboardLetters: newKeyboard,
    });
  };

  // Hint handler
  const handleUseHint = () => {
    setHintUsed(true);
    if (is2B) {
      // Eliminate 2 wrong choices
      const wrong = options
        .filter((o: any) => o.text.toLowerCase() !== targetWord.toLowerCase())
        .map((o: any) => o.text);
      setEliminatedOptions(wrong.slice(0, 2));
    } else {
      // Reveal 1 hidden slot
      const emptyHidden = lettersState.hiddenIndices.find((i) => lettersState.slots[i] === null);
      if (emptyHidden !== undefined) {
        const correctChar = targetWord[emptyHidden].toLowerCase();
        const newSlots = [...lettersState.slots];
        newSlots[emptyHidden] = correctChar;
        setLettersState((prev) => ({ ...prev, slots: newSlots }));
      }
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto px-4 py-2 ${shaking ? 'animate-shake' : ''}`}>
      {/* Sentence Context Container */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 mb-6 text-center">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span className="font-bold uppercase tracking-wider">
            {is2B ? 'Chọn dạng từ phù hợp (Word Formation)' : 'Điền chữ cái còn thiếu'}
          </span>
          <button
            onClick={() => sound.speak(question.payload.full_sentence || targetWord, 'uk')}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 flex items-center gap-1 text-xs"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Đọc câu</span>
          </button>
        </div>

        {/* Sentence Text with Highlighted Blank */}
        <p className="text-lg sm:text-xl font-body font-bold text-slate-800 dark:text-slate-100 leading-relaxed mb-3">
          {sentenceTemplate.split('{{blank}}').map((part: string, idx: number, arr: any[]) => (
            <React.Fragment key={idx}>
              {part}
              {idx < arr.length - 1 && (
                <span className="inline-block mx-1.5 px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-2 border-dashed border-amber-400 font-black animate-pulse">
                  [ ________ ]
                </span>
              )}
            </React.Fragment>
          ))}
        </p>

        {translation && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
            &quot;{translation}&quot;
          </p>
        )}
      </div>

      {/* Mode 2B: 4 POS Options */}
      {is2B ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt: any) => {
              const isEliminated = eliminatedOptions.includes(opt.text);
              return (
                <button
                  key={opt.id || opt.text}
                  disabled={isEliminated}
                  onClick={() => handleSelectOption(opt.text)}
                  className={`p-4 rounded-2xl font-heading font-black text-base sm:text-lg border-2 shadow-sm transition-all duration-200 text-center flex flex-col items-center justify-center gap-1 active:scale-95 ${
                    isEliminated
                      ? 'opacity-30 border-slate-200 bg-slate-100 dark:bg-slate-900 line-through cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-brand-500 hover:shadow-md'
                  }`}
                >
                  <span>{opt.text}</span>
                  {/* Note: POS label is deliberately omitted here per spec Section 5.3 so as not to reveal answer early */}
                </button>
              );
            })}
          </div>

          {!hintUsed && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleUseHint}
                className="text-xs text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1.5 hover:underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Loại bỏ 2 phương án sai (-30 pt)</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Mode 2A: Letter blanks and tile keyboard */
        <div className="space-y-5">
          {/* Slots display */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {lettersState.slots.map((char, index) => {
              const isHidden = lettersState.hiddenIndices.includes(index);
              return (
                <div
                  key={index}
                  className={`w-9 h-11 sm:w-11 sm:h-14 rounded-xl flex items-center justify-center font-heading font-black text-lg sm:text-xl border-2 transition-all ${
                    char === null
                      ? 'border-dashed border-brand-400 bg-brand-50/50 dark:bg-brand-950/30'
                      : isHidden
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white'
                  }`}
                >
                  {char || ''}
                </div>
              );
            })}
          </div>

          {/* Letter buttons keyboard */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-3xl border border-slate-100 dark:border-slate-700/60">
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              {lettersState.keyboardLetters.map((k) => (
                <button
                  key={k.id}
                  disabled={k.used}
                  onClick={() => handleKeyClick(k)}
                  className={`w-11 h-12 rounded-xl font-heading font-black text-lg uppercase shadow-sm border transition-all active:scale-95 ${
                    k.used
                      ? 'opacity-20 border-slate-200 bg-slate-200 dark:bg-slate-700 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-brand-50 hover:border-brand-400'
                  }`}
                >
                  {k.char}
                </button>
              ))}

              <button
                onClick={handleDeleteSlot}
                className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-300 transition-colors"
                title="Xóa ký tự vừa nhập"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span>Thử lần: {attemptNo}/2</span>
              {!hintUsed && (
                <button
                  onClick={handleUseHint}
                  className="text-brand-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Mở 1 chữ cái</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
