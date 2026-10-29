'use client';

import React, { useState } from 'react';
import { PosChip } from './PosChip';
import { POSCode } from '@/types';
import { Volume2, AlertCircle, CheckCircle2, XCircle, ArrowRight, Flag, ShieldCheck } from 'lucide-react';
import { sound } from '@/lib/audio';

interface ExplainSheetProps {
  isOpen: boolean;
  isCorrect?: boolean;
  correctAnswer: string;
  headword?: string;
  posCode?: POSCode;
  meaning?: string;
  translation?: string;
  grammarNote?: string;
  distractorReasons?: Record<string, string>;
  userAnswer?: string;
  onContinue: () => void;
  entityId?: string;
}

export const ExplainSheet: React.FC<ExplainSheetProps> = ({
  isOpen,
  isCorrect = false,
  correctAnswer,
  headword,
  posCode = 'noun',
  meaning,
  translation,
  grammarNote,
  distractorReasons,
  userAnswer,
  onContinue,
  entityId,
}) => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('Đáp án chưa chính xác');

  if (!isOpen) return null;

  const handleReportFeedback = async () => {
    try {
      await fetch('/api/v1/content/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'sentence',
          entity_id: entityId || 'unknown',
          reason: feedbackReason,
        }),
      });
      setFeedbackSent(true);
      setTimeout(() => {
        setFeedbackModalOpen(false);
        setFeedbackSent(false);
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 p-6 max-h-[85vh] overflow-y-auto transform transition-all animate-slideUp">
        {/* Header Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

        {/* Status Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                {isCorrect ? 'Chính xác! Làm tốt lắm' : 'Chưa đúng rồi! Hãy xem giải thích'}
              </h3>
              {!isCorrect && userAnswer && (
                <p className="text-xs text-rose-500 font-medium">
                  Bạn đã chọn: <span className="line-through">{userAnswer}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => sound.speak(correctAnswer, 'uk')}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Nghe phát âm"
          >
            <Volume2 className="w-4 h-4 text-brand-600" />
            <span>Nghe</span>
          </button>
        </div>

        {/* Target Answer Showcase */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Đáp án đúng
            </span>
            <PosChip posCode={posCode} size="sm" />
          </div>

          <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            {correctAnswer}
          </div>

          {meaning && (
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {meaning}
            </p>
          )}

          {translation && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
              &quot;{translation}&quot;
            </p>
          )}
        </div>

        {/* Grammar Note */}
        {grammarNote && (
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-1">
                  Mẹo ngữ pháp & Quy tắc cốt lõi
                </h4>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  {grammarNote}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Why Distractors Are Wrong */}
        {distractorReasons && Object.keys(distractorReasons).length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Vì sao không chọn các phương án còn lại:
            </h4>
            <div className="space-y-2">
              {Object.entries(distractorReasons).map(([word, reason]) => (
                <div key={word} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <span className="font-semibold text-rose-600 dark:text-rose-400 min-w-[70px]">
                    ✗ {word}:
                  </span>
                  <span className="flex-1">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-3">
          <button
            onClick={() => setFeedbackModalOpen(true)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5 py-2 px-1 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Báo lỗi nội dung</span>
          </button>

          <button
            onClick={onContinue}
            className="flex-1 sm:flex-none sm:min-w-[180px] bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span>Tiếp tục</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Modal */}
        {feedbackModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Flag className="w-4 h-4 text-brand-600" />
                Báo cáo câu hỏi
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Đóng góp của bạn giúp đội ngũ biên tập chuẩn hóa dữ liệu học tập.
              </p>

              {feedbackSent ? (
                <div className="py-6 text-center text-emerald-600 font-semibold text-sm flex flex-col items-center gap-2">
                  <ShieldCheck className="w-8 h-8" />
                  Đã ghi nhận báo cáo! Cảm ơn bạn.
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {['Đáp án chưa chính xác', 'Câu ví dụ chưa tự nhiên', 'Lỗi loại từ (POS)', 'Lỗi chính tả / phát âm'].map((r) => (
                      <label key={r} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="feedback_reason"
                          checked={feedbackReason === r}
                          onChange={() => setFeedbackReason(r)}
                          className="text-brand-600"
                        />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setFeedbackModalOpen(false)}
                      className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleReportFeedback}
                      className="flex-1 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl"
                    >
                      Gửi báo cáo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
