'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sound } from '@/lib/audio';
import { PosChip } from '../common/PosChip';
import { POSCode } from '@/types';
import { Volume2, Sparkles, HelpCircle } from 'lucide-react';

interface CardItem {
  id: string;
  pairId: string;
  questionId: string;
  vocabId: string;
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

  // Lỗi 8 Fix: Dùng ref để lưu trữ chính xác các lần lật sai theo từng question_id
  // và lưu danh sách events mới nhất để không bị mất event cuối do closure cũ trong setTimeout
  const mismatchesByQuestionRef = useRef<Record<string, number>>({});
  const allEventsRef = useRef<any[]>([]);

  // Initialize cards
  useEffect(() => {
    mismatchesByQuestionRef.current = {};
    allEventsRef.current = [];
    const cardList: CardItem[] = [];

    questions.forEach((q, idx) => {
      const v = q.payload || {};
      const pairId = `pair_${idx}`;
      const headword = v.prompt || v.headword || '';
      const meaning = v.correct_answer || v.meaning || '';

      // Card 1: Headword
      cardList.push({
        id: `c_${pairId}_w`,
        pairId,
        questionId: q.id,
        vocabId: q.vocab_id,
        type: 'word',
        content: headword,
        posCode: q.pos_code || 'noun',
        headword,
      });

      // Card 2: Meaning
      cardList.push({
        id: `c_${pairId}_m`,
        pairId,
        questionId: q.id,
        vocabId: q.vocab_id,
        type: 'meaning',
        content: meaning,
        headword,
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
      const targetQ = questions.find((q) => q.id === card1.questionId);

      if (isMatch) {
        // Khớp thẻ thành công!
        sound.playCorrect(matchedPairIds.size);
        sound.speak(card1.headword, 'uk');
        onAnswerFeedback?.(true);

        const newMatched = new Set(matchedPairIds);
        newMatched.add(card1.pairId);
        setMatchedPairIds(newMatched);
        setFlippedIds([]);
        setIsLocked(false);

        // Lỗi 8 Fix: Gán đúng question_id của cặp thẻ được ghép
        const prevMismatches = mismatchesByQuestionRef.current[card1.questionId] || 0;
        const attemptNo = prevMismatches + 1;
        const correctAnswer = targetQ?.payload?.correct_answer || (card1.type === 'meaning' ? card1.content : card2.content);

        const matchEvent = {
          client_event_id: `ev_flip_match_${card1.questionId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          question_id: card1.questionId,
          user_answer: correctAnswer,
          attempt_no: attemptNo,
          response_ms: 1200,
          hint_used: false,
        };

        const updatedEvents = [...allEventsRef.current, matchEvent];
        allEventsRef.current = updatedEvents;
        setEvents(updatedEvents);

        // Kiểm tra xem đã hoàn tất tất cả các cặp thẻ chưa
        if (newMatched.size === questions.length) {
          setTimeout(() => {
            sound.playWin();

            // Tính accuracy chuẩn Flip Card: tỷ lệ câu đúng ngay lần đầu (0 mismatch) trên tổng số câu
            const firstTryCount = questions.filter(
              (q) => (mismatchesByQuestionRef.current[q.id] || 0) === 0
            ).length;
            const accuracy = Math.round((firstTryCount / Math.max(1, questions.length)) * 100);
            const totalMismatches = Object.values(mismatchesByQuestionRef.current).reduce((a, b) => a + b, 0);

            // Lỗi 8 Fix: Truyền updatedEvents mới nhất bao gồm cặp cuối thay vì state events cũ
            onComplete(accuracy, totalMismatches, updatedEvents);
          }, 600);
        }
      } else {
        // Lật sai cặp thẻ
        sound.playWrong();
        setMismatch((m) => m + 1);
        onAnswerFeedback?.(false);
        setShakingIds([card1.id, card2.id]);

        // Ghi nhận lần lật sai cho từng câu của cả hai thẻ
        mismatchesByQuestionRef.current[card1.questionId] =
          (mismatchesByQuestionRef.current[card1.questionId] || 0) + 1;
        mismatchesByQuestionRef.current[card2.questionId] =
          (mismatchesByQuestionRef.current[card2.questionId] || 0) + 1;

        const misEvent1 = {
          client_event_id: `ev_flip_mis_${card1.questionId}_${Date.now()}_1`,
          question_id: card1.questionId,
          user_answer: 'mismatch',
          attempt_no: mismatchesByQuestionRef.current[card1.questionId],
          response_ms: 1200,
          hint_used: false,
        };

        const misEvent2 = {
          client_event_id: `ev_flip_mis_${card2.questionId}_${Date.now()}_2`,
          question_id: card2.questionId,
          user_answer: 'mismatch',
          attempt_no: mismatchesByQuestionRef.current[card2.questionId],
          response_ms: 1200,
          hint_used: false,
        };

        const updatedEvents = [...allEventsRef.current, misEvent1, misEvent2];
        allEventsRef.current = updatedEvents;
        setEvents(updatedEvents);

        setTimeout(() => {
          setFlippedIds([]);
          setShakingIds([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  const handleHint = () => {
    // Tìm cặp thẻ chưa ghép đầu tiên và nhấp nháy gợi ý
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
