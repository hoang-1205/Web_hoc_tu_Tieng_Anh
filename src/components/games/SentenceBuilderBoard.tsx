'use client';

import React, { useState, useEffect } from 'react';
import { sound } from '@/lib/audio';
import { Volume2, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';

interface SentenceBuilderBoardProps {
  question: any;
  onAnswer: (answer: string, isCorrect: boolean, attemptNo: number, hintUsed: boolean) => void;
  playMode: 'learning' | 'adventure';
  onShowExplain: (data: any) => void;
}

export const SentenceBuilderBoard: React.FC<SentenceBuilderBoardProps> = ({
  question,
  onAnswer,
  playMode,
  onShowExplain,
}) => {
  const correctChunks: string[] = question.payload.correct_chunks || ['She', 'usually', 'goes to work', 'by bus.'];
  const fullSentence: string = question.payload.correct_answer || correctChunks.join(' ');
  const translation: string = question.payload.prompt || '';
  const wordOrderRule: string = question.payload.explanation_refs?.rule_text || 'Trật tự câu: S + V + O';

  const [availableChunks, setAvailableChunks] = useState<{ id: string; text: string }[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<{ id: string; text: string }[]>([]);
  const [attemptNo, setAttemptNo] = useState<number>(1);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  // Initialize randomized chunks
  useEffect(() => {
    const rawChunks = question.payload.chunks || correctChunks;
    const mapped = rawChunks.map((text: string, idx: number) => ({
      id: `chk_${idx}_${text}`,
      text,
    }));
    // Fisher-Yates shuffle
    setAvailableChunks([...mapped].sort(() => Math.random() - 0.5));
    setSelectedChunks([]);
    setAttemptNo(1);
    setWrongIndex(null);
    setHintMessage(null);
  }, [question, correctChunks]);

  const handleSelectChunk = (chunk: { id: string; text: string }) => {
    sound.playFlip();
    setSelectedChunks((prev) => [...prev, chunk]);
    setAvailableChunks((prev) => prev.filter((c) => c.id !== chunk.id));
    setWrongIndex(null);
  };

  const handleDeselectChunk = (chunk: { id: string; text: string }) => {
    sound.playFlip();
    setSelectedChunks((prev) => prev.filter((c) => c.id !== chunk.id));
    setAvailableChunks((prev) => [...prev, chunk]);
    setWrongIndex(null);
  };

  const handleReset = () => {
    setAvailableChunks([...selectedChunks, ...availableChunks]);
    setSelectedChunks([]);
    setWrongIndex(null);
  };

  const handleCheck = () => {
    if (selectedChunks.length === 0) return;

    const userSentence = selectedChunks.map((c) => c.text).join(' ');
    // Compare chunk by chunk with correct order
    let firstMismatch = -1;
    for (let i = 0; i < selectedChunks.length; i++) {
      if (selectedChunks[i].text !== correctChunks[i]) {
        firstMismatch = i;
        break;
      }
    }

    const isComplete = selectedChunks.length === correctChunks.length;
    const isCorrect = isComplete && firstMismatch === -1;

    if (isCorrect) {
      sound.playCorrect();
      sound.speak(fullSentence, 'uk');
      onAnswer(userSentence, true, attemptNo, false);
    } else {
      sound.playWrong();
      setShaking(true);
      setTimeout(() => setShaking(false), 400);

      const misIndex = firstMismatch !== -1 ? firstMismatch : selectedChunks.length;
      setWrongIndex(misIndex);

      if (attemptNo === 1) {
        setHintMessage(`Mẹo trật tự từ: ${wordOrderRule}`);
        setAttemptNo(2);
      } else if (attemptNo === 2) {
        setHintMessage('Chú ý vị trí trạng từ và cụm giới từ trong câu.');
        setAttemptNo(3);
      } else {
        // 3rd failure: trigger ExplainSheet
        onShowExplain({
          isCorrect: false,
          correctAnswer: fullSentence,
          userAnswer: userSentence,
          grammarNote: wordOrderRule,
          translation,
        });
        onAnswer(userSentence, false, attemptNo, false);
      }
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto px-4 py-2 ${shaking ? 'animate-shake' : ''}`}>
      {/* Translation & Prompt Container */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xl border border-slate-100 dark:border-slate-700 mb-6 text-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
          Xây dựng câu hoàn chỉnh (Sentence Builder)
        </span>
        <h3 className="text-base sm:text-lg font-bold font-body text-slate-900 dark:text-white mb-2">
          &quot;{translation}&quot;
        </h3>
        <p className="text-xs text-slate-500">
          Chạm vào các mảnh câu theo đúng thứ tự ngữ pháp tiếng Anh.
        </p>
      </div>

      {/* Target Construction Area */}
      <div className="min-h-[96px] bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 mb-4 flex flex-wrap items-center gap-2 transition-all">
        {selectedChunks.length === 0 ? (
          <span className="text-xs font-semibold text-slate-400 mx-auto select-none">
            Chạm vào các từ bên dưới để ghép vào đây...
          </span>
        ) : (
          selectedChunks.map((chunk, index) => {
            const isWrong = wrongIndex === index;
            return (
              <button
                key={chunk.id}
                onClick={() => handleDeselectChunk(chunk)}
                className={`px-3.5 py-2 rounded-2xl font-heading font-black text-sm sm:text-base border-2 shadow-sm transition-all transform active:scale-95 ${
                  isWrong
                    ? 'bg-rose-50 border-rose-500 text-rose-600 animate-bounce'
                    : 'bg-white dark:bg-slate-700 border-brand-500 text-brand-700 dark:text-brand-300'
                }`}
              >
                {chunk.text}
              </button>
            );
          })
        )}
      </div>

      {/* Hint Message */}
      {hintMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs mb-4 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{hintMessage}</span>
        </div>
      )}

      {/* Available Chunks Tray */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700/80 mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2.5 min-h-[50px]">
          {availableChunks.map((chunk) => (
            <button
              key={chunk.id}
              onClick={() => handleSelectChunk(chunk)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-brand-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-heading font-black text-sm sm:text-base shadow-sm transition-all active:scale-95"
            >
              {chunk.text}
            </button>
          ))}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleReset}
          disabled={selectedChunks.length === 0}
          className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-40 transition-colors"
          title="Xếp lại từ đầu"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={handleCheck}
          disabled={selectedChunks.length === 0}
          className="flex-1 py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-heading font-black text-base shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Kiểm tra câu</span>
        </button>
      </div>
    </div>
  );
};
