'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/audio';
import { PosChip } from '@/components/common/PosChip';
import {
  Repeat, BookMarked, CheckCircle2, Clock, Volume2, ArrowRight,
  Sparkles, Trash2, ShieldCheck, Filter
} from 'lucide-react';
import { POSCode, Vocabulary } from '@/types';

export default function ReviewPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'notebook' | 'due'>('notebook');
  const [queueData, setQueueData] = useState<any>({
    due_count: 0,
    notebook_count: 0,
    due_items: [],
    notebook_items: [],
  });
  const [loading, setLoading] = useState(true);
  const [isStartingReview, setIsStartingReview] = useState(false);

  useEffect(() => {
    fetch('/api/v1/review/queue')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setQueueData(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveFromNotebook = async (vocabId: string) => {
    sound.playCorrect();
    try {
      await fetch(`/api/v1/review/notebook/${vocabId}`, { method: 'DELETE' });
      setQueueData((prev: any) => ({
        ...prev,
        notebook_count: Math.max(0, prev.notebook_count - 1),
        notebook_items: prev.notebook_items.filter((v: Vocabulary) => v.id !== vocabId),
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartReviewGame = async () => {
    if (isStartingReview) return;
    setIsStartingReview(true);
    sound.playFlip();

    try {
      const res = await fetch('/api/v1/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_type: 'review' }),
      });
      const pack = await res.json();
      router.push(`/app/quest/${pack.id || pack.pack_id}`);
    } catch (e) {
      console.error(e);
      setIsStartingReview(false);
    }
  };

  const currentList: Vocabulary[] = activeTab === 'notebook' ? queueData.notebook_items : queueData.due_items;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Repeat className="w-7 h-7 text-emerald-600" />
            Trung Tâm Ôn Tập & Củng Cố
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Hàng đợi SRS thông minh kết hợp Sổ tay từ sai cá nhân hóa
          </p>
        </div>

        <button
          onClick={handleStartReviewGame}
          disabled={isStartingReview || (queueData.due_count === 0 && queueData.notebook_count === 0)}
          className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-heading font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isStartingReview ? 'Đang tải...' : 'Ôn Dạng Game (Pack 10 từ)'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('notebook')}
          className={`flex-1 py-3 rounded-xl font-heading font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'notebook'
              ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Sổ tay từ sai ({queueData.notebook_count})</span>
        </button>

        <button
          onClick={() => setActiveTab('due')}
          className={`flex-1 py-3 rounded-xl font-heading font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'due'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Đến hạn SRS hôm nay ({queueData.due_count})</span>
        </button>
      </div>

      {/* Word Cards List */}
      {currentList.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-heading font-black text-slate-900 dark:text-white mb-1">
            Tuyệt vời! Không có từ nào cần ôn lúc này
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Bạn đã hoàn thành tốt các câu hỏi trong ngày. Hãy học thêm từ mới ở Thư viện!
          </p>
          <button
            onClick={() => router.push('/app/library')}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold font-heading"
          >
            Mở Thư Viện Từ Vựng
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((vocab) => (
            <div
              key={vocab.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <PosChip posCode={vocab.pos_code} size="sm" />
                  <span className="text-xs font-ipa text-slate-400">{vocab.ipa_uk}</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white">
                    {vocab.headword}
                  </h3>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {vocab.meaning_vi}
                  </p>
                </div>

                {vocab.sentences?.[0] && (
                  <p className="text-xs text-slate-500 italic mt-1">
                    &quot;{vocab.sentences[0].sentence_text}&quot;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => sound.speak(vocab.headword, 'uk')}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 hover:text-brand-600 transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {activeTab === 'notebook' && (
                  <button
                    onClick={() => handleRemoveFromNotebook(vocab.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                    title="Đánh dấu đã thuộc và gỡ khỏi sổ tay"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã thuộc</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
