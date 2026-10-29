'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GameHUD } from '@/components/common/GameHUD';
import { GameBoard } from '@/components/games/GameBoard';
import { ExplainSheet } from '@/components/common/ExplainSheet';
import { sound } from '@/lib/audio';
import { GameSession, AnswerEvent } from '@/types';
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';

export default function PlayGamePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Gameplay State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [isPaused, setIsPaused] = useState(false);
  const [answerEvents, setAnswerEvents] = useState<AnswerEvent[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const sessionStartTimeRef = useRef<number>(Date.now());

  // ExplainSheet State
  const [explainData, setExplainData] = useState<any>(null);
  const [showExplain, setShowExplain] = useState(false);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Lỗi 7 Fix: Tải session theo ID thật từ server, không tự tạo mock/fallback session
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    const loadSession = async () => {
      try {
        const res = await fetch(`/api/v1/sessions/${sessionId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Không thể tải phiên chơi (Mã lỗi: ${res.status})`);
        }

        const data: GameSession = await res.json();
        if (!isMounted) return;

        // Nếu phiên này đã được hoàn tất trước đó, điều hướng sang trang kết quả
        if (data.finished_at) {
          router.replace(`/app/result/${sessionId}`);
          return;
        }

        setSession(data);
        setHearts(data.config?.hearts ?? (data.play_mode === 'learning' ? 999 : 5));
        const initialTimer = data.config?.time_limit_ms > 0
          ? Math.round(data.config.time_limit_ms / 1000)
          : (data.game_code === 'sentence_builder' ? 40 : 25);
        setTimeLeft(initialTimer);
        setQuestionStartTime(Date.now());
        sessionStartTimeRef.current = Date.now();

        if (data.logged_events && data.logged_events.length > 0) {
          setAnswerEvents(data.logged_events);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Lỗi kết nối khi tải phiên chơi');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
    }

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, router]);

  // Countdown Timer
  useEffect(() => {
    if (
      !session ||
      session.play_mode === 'learning' ||
      isPaused ||
      showExplain ||
      session.game_code === 'flip_card'
    ) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, isPaused, showExplain, currentQIndex]);

  const handleTimeOut = () => {
    sound.playWrong();
    if (session?.play_mode === 'adventure') {
      setHearts((h) => Math.max(0, h - 1));
    }
    setCombo(0);

    const currentQ = session?.questions[currentQIndex];
    if (currentQ) {
      setExplainData({
        isCorrect: false,
        correctAnswer: currentQ.payload.correct_answer,
        userAnswer: 'Hết giờ',
        grammarNote: currentQ.payload.explanation_refs?.grammar_note,
        meaning: currentQ.payload.explanation_refs?.meaning,
      });
      setShowExplain(true);
    }
  };

  const handleAnswer = (
    userAnswerText: string,
    isCorrect: boolean,
    attemptNo: number,
    hintUsed: boolean
  ) => {
    const elapsed = Date.now() - questionStartTime;
    // Section 8.7: anti-cheat response_ms >= 250ms
    const responseMs = Math.max(260, elapsed);
    const currentQ = session?.questions[currentQIndex];
    if (!currentQ) return;

    const event: AnswerEvent = {
      client_event_id: `ev_${session?.id || sessionId}_${currentQ.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question_id: currentQ.id,
      user_answer: userAnswerText,
      attempt_no: attemptNo,
      response_ms: responseMs,
      hint_used: hintUsed,
    };

    const nextEvents = [...answerEvents, event];
    setAnswerEvents(nextEvents);

    // Lỗi 6: Đồng bộ batch event lên server để lưu vào logged_events
    fetch(`/api/v1/sessions/${session?.id || sessionId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [event] }),
    }).catch(() => {});

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const mult = Math.min(3.0, 1 + 0.5 * Math.floor(newCombo / 3));
      const base = session?.config?.base_score || 100;
      setScore((s) => s + Math.round(base * mult));

      // Chuyển sang câu tiếp theo
      advanceQuestion(nextEvents);
    } else {
      setCombo(0);
      if (session?.play_mode === 'adventure') {
        const nextHearts = hearts - 1;
        setHearts(nextHearts);
        if (nextHearts <= 0) {
          // Hết tim trong chế độ Adventure -> thua phiên
          setTimeout(() => {
            finishSession(false, nextEvents);
          }, 600);
        }
      }
    }
  };

  const advanceQuestion = (eventsList: AnswerEvent[] = answerEvents) => {
    if (!session) return;
    if (currentQIndex < session.questions.length - 1) {
      setCurrentQIndex((idx) => idx + 1);
      const resetTime = session.game_code === 'sentence_builder' ? 40 : 25;
      setTimeLeft(resetTime);
      setQuestionStartTime(Date.now());
    } else {
      // Đã trả lời hết tất cả câu hỏi
      finishSession(true, eventsList);
    }
  };

  const handleFlipCardComplete = (accuracy: number, mismatches: number, events: any[]) => {
    const formattedEvents: AnswerEvent[] = (events || []).map((e: any, idx: number) => ({
      client_event_id: e.client_event_id || `ev_flip_${Date.now()}_${idx}`,
      question_id: e.question_id || session?.questions[idx]?.id || `q_${idx + 1}`,
      user_answer: e.user_answer || 'matched',
      attempt_no: e.attempt_no || 1,
      response_ms: Math.max(300, e.response_ms || 1000),
      hint_used: Boolean(e.hint_used),
    }));

    setAnswerEvents(formattedEvents);

    // Sync events lên server
    fetch(`/api/v1/sessions/${session?.id || sessionId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: formattedEvents }),
    }).catch(() => {});

    // Flip card win condition
    const isWin = session?.play_mode === 'learning' ? true : accuracy >= 60;
    finishSession(isWin, formattedEvents);
  };

  const finishSession = async (isWin: boolean, eventsList: AnswerEvent[] = answerEvents) => {
    try {
      if (isWin) sound.playWin();
      else sound.playWrong();

      const totalDuration = Math.max(1000, Date.now() - sessionStartTimeRef.current);
      await fetch(`/api/v1/sessions/${session?.id || sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_ms: totalDuration,
          events: eventsList,
        }),
      });
      router.push(`/app/result/${session?.id || sessionId}`);
    } catch (err) {
      router.push(`/app/result/${session?.id || sessionId}`);
    }
  };

  const handleShowExplain = (data: any) => {
    setExplainData(data);
    setShowExplain(true);
  };

  const handleExplainContinue = () => {
    setShowExplain(false);
    advanceQuestion();
  };

  const handleHint = () => {
    sound.playFlip();
  };

  const handleSkip = () => {
    sound.playWrong();
    handleAnswer('skip', false, 1, false);
    advanceQuestion();
  };

  // UI khi có lỗi tải session (Lỗi 7: không tự tạo pack rác, báo lỗi và cho quay về)
  if (errorMessage) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-black text-slate-900 dark:text-white mb-2">
              Không thể tải phiên chơi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {errorMessage}
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => router.back()}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại màn trước</span>
            </button>
            <Link
              href="/app/dashboard"
              className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors block"
            >
              Về Trang chủ (Dashboard)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Đang chuẩn bị phiên chơi từ máy chủ...</span>
        </div>
      </div>
    );
  }

  const currentQ = session.questions[currentQIndex] || session.questions[0];

  return (
    <div className="flex-1 flex flex-col justify-between py-2 max-w-4xl mx-auto w-full select-none">
      {/* Game HUD */}
      <GameHUD
        currentQuestion={currentQIndex + 1}
        totalQuestions={session.questions.length}
        hearts={hearts}
        maxHearts={session.config?.hearts || 5}
        score={score}
        combo={combo}
        timeLeft={timeLeft}
        playMode={session.play_mode}
        isPaused={isPaused}
        onPauseToggle={() => setIsPaused((p) => !p)}
        onHint={handleHint}
        onSkip={handleSkip}
        onExit={() => router.push(`/app/quest/${session.pack_id}`)}
      />

      {/* Game Board Container */}
      <div className="flex-1 flex items-center justify-center py-4">
        <GameBoard
          gameCode={session.game_code}
          question={currentQ}
          allQuestions={session.questions}
          playMode={session.play_mode}
          onAnswer={handleAnswer}
          onFlipCardComplete={handleFlipCardComplete}
          onShowExplain={handleShowExplain}
        />
      </div>

      {/* Bottom Information & Action Bar */}
      <div className="max-w-xl mx-auto w-full px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <button
          onClick={handleSkip}
          className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          Bỏ qua câu này
        </button>
        <span className="font-semibold text-slate-500">
          Cấp L{session.level} · Vòng {session.round_no}:{' '}
          {session.game_code === 'flip_card'
            ? 'Ghép thẻ nhận diện'
            : session.game_code === 'fill_blank'
            ? 'Điền dạng từ'
            : session.game_code === 'sentence_builder'
            ? 'Xây dựng câu'
            : session.game_code === 'speed_quiz'
            ? 'Phản xạ tốc độ'
            : session.game_code}
        </span>
      </div>

      {/* ExplainSheet Modal */}
      {showExplain && explainData && (
        <ExplainSheet
          isOpen={showExplain}
          isCorrect={explainData.isCorrect}
          correctAnswer={explainData.correctAnswer}
          userAnswer={explainData.userAnswer}
          grammarNote={explainData.grammarNote}
          distractorReasons={explainData.distractorReasons}
          meaning={explainData.meaning}
          translation={explainData.translation}
          onContinue={handleExplainContinue}
          entityId={currentQ.vocab_id}
        />
      )}
    </div>
  );
}
