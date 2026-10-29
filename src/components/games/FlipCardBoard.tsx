'use client';

import React, { useState, useEffect } from 'react';
import { sound } from '@/lib/audio';
import { PosChip } from '../common/PosChip';
import { POSCode } from '@/types';
import { Volume2, Sparkles, HelpCircle } from 'lucide-react';

interface CardItem {
  id: string;
  pairId: string;
  type: 'word' | 'meaning';
  content: string;
  subContent?: string;
  posCode?: POSCode;
  headword: string;
}

interface FlipCardBoardProps {
  questions: any[];
  onComplete: (accuracy: number, mismatches: number, events: any[]) => void;
  playMode: 'learning' | 'adventure';
  onAnswerFeedback?: (isCorrect: boolean) => void;
}

export const FlipCardBoard: React.FC<FlipCardBoardProps> = ({
  questions,
  onComplete,
  playMode,
  onAnswerFeedback,
}) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());
  const [mismatch, setMismatch] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [events, setEvents] = useState<any[]>([]);
  const [shakingIds, setShakingIds] = useState<string[]>([]);

  // Initialize cards
  useEffect(() => {
    const cardList: CardItem[] = [];
    questions.forEach((q, idx) => {
      const v = q.payload;
      const pairId = `pair_${idx}`;

      // Card 1: Headword
      cardList.push({
        id: `c_${pairId}_w`,
        pairId,
        type: 'word',
        content: v.prompt,
        posCode: q.pos_code || 'noun',
        headword: v.prompt,
      });

      // Card 2: Meaning
      cardList.push({
        id: `c_${pairId}_m`,
        pairId,
        type: 'meaning',
        content: v.correct_answer,
        headword: v.prompt,
      });
    });

    // Shuffle using Fisher-Yates
    const shuffled = [...cardList].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, [questions]);

  // Card click handler
  const handleCardClick = (card: CardItem) => {
    if (isLocked) return;
    if (matchedPairIds.has(card.pairId)) return;
    if (flippedIds.includes(card.id)) return;

    sound.playFlip();

    const newFlipped = [...flippedIds, card.id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      const card1 = cards.find((c) => c.id === newFlipped[0])!;
      const card2 = card;

      const isMatch = card1.pairId === card2.pairId;
      const targetVocabId = questions.find(
        (q) => q.payload.prompt === card1.headword || q.payload.prompt === card2.headword
      )?.vocab_id;

      if (isMatch) {
        // Match!
        sound.playCorrect(matchedPairIds.size);
        sound.speak(card1.headword, 'uk');
        onAnswerFeedback?.(true);

        const newMatched = new Set(matchedPairIds);
        newMatched.add(card1.pairId);
        setMatchedPairIds(newMatched);
        setFlippedIds([]);
        setIsLocked(false);

        setEvents((prev) => [
          ...prev,
          {
            client_event_id: `ev_${Date.now()}_${Math.random()}`,
            question_id: questions[0]?.id || 'q_1',
            user_answer: card2.content,
            attempt_no: 1,
            response_ms: 1200,
            hint_used: false,
          },
        ]);

        // Check if finished
        if (newMatched.size === questions.length) {
          setTimeout(() => {
            sound.playWin();
            const totalAttempts = questions.length + mismatch;
            const accuracy = Math.round((questions.length / Math.max(1, totalAttempts)) * 100);
            onComplete(accuracy, mismatch, events);
          }, 600);
        }
      } else {
        // Mismatch
        sound.playWrong();
        setMismatch((m) => m + 1);
        onAnswerFeedback?.(false);
        setShakingIds([card1.id, card2.id]);

        setEvents((prev) => [
          ...prev,
          {
            client_event_id: `ev_${Date.now()}_${Math.random()}`,
            question_id: questions[0]?.id || 'q_1',
            user_answer: 'mismatch',
            attempt_no: 1,
            response_ms: 2000,
            hint_used: false,
          },
        ]);

        setTimeout(() => {
          setFlippedIds([]);
          setShakingIds([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  const handleHint = () => {
    // Find first unmatched pair and briefly highlight
    const unmatched = cards.find((c) => !matchedPairIds.has(c.pairId));
    if (!unmatched) return;
    const pair = cards.filter((c) => c.pairId === unmatched.pairId);
    setFlippedIds(pair.map((p) => p.id));
    setTimeout(() => {
      setFlippedIds([]);
    }, 1200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 select-none">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
        <span className="font-semibold">
          Đã ghép: <span className="text-brand-600 font-bold">{matchedPairIds.size}</span>/{questions.length} cặp
        </span>
        <button
          onClick={handleHint}
          className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-bold hover:underline"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Gợi ý 1 cặp</span>
        </button>
      </div>

      {/* Grid: 4x5 on mobile, 5x4 on larger screens */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 perspective-1000">
        {cards.map((card) => {
          const isFlipped = flippedIds.includes(card.id);
          const isMatched = matchedPairIds.has(card.pairId);
          const isShaking = shakingIds.includes(card.id);

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`relative h-24 sm:h-28 rounded-2xl cursor-pointer transition-all duration-300 transform-style-3d ${
                isMatched ? 'opacity-40 pointer-events-none scale-95' : 'hover:scale-[1.03] active:scale-95'
              } ${isShaking ? 'animate-shake' : ''}`}
            >
              <div
                className={`w-full h-full rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-md border transition-transform duration-300 ${
                  isFlipped || isMatched
                    ? 'bg-white dark:bg-slate-800 border-brand-500/80 shadow-brand-500/10'
                    : 'bg-gradient-to-br from-indigo-500 to-brand-600 border-indigo-400 text-white'
                }`}
              >
                {isFlipped || isMatched ? (
                  <div className="flex flex-col items-center justify-center gap-1 w-full animate-fadeIn">
                    {card.type === 'word' && card.posCode && (
                      <PosChip posCode={card.posCode} size="sm" showIcon={false} />
                    )}
                    <span
                      className={`font-heading font-black leading-tight text-slate-900 dark:text-white ${
                        card.content.length > 12 ? 'text-xs' : 'text-sm sm:text-base'
                      }`}
                    >
                      {card.content}
                    </span>
                    {card.type === 'word' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.speak(card.content, 'uk');
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 text-white/90">
                    <Sparkles className="w-5 h-5 text-indigo-200" />
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      Quest
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
