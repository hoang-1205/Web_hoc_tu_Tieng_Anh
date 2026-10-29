'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/audio';
import {
  Compass, CheckCircle2, Lock, ArrowRight, Sparkles, BookOpen,
  Award, Play, Target
} from 'lucide-react';
import { LearningPath } from '@/types';

export default function LearningPathPage() {
  const router = useRouter();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activePathId, setActivePathId] = useState<number>(2);
  const [userPathData, setUserPathData] = useState<any>({ current_step: 2, step_progress: 1 });
  const [loading, setLoading] = useState(true);
  const [isStartingStep, setIsStartingStep] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/paths').then((r) => r.json()),
      fetch('/api/v1/me/path').then((r) => r.json()),
    ])
      .then(([p, up]) => {
        if (p.items) setPaths(p.items);
        if (up && !up.error) {
          setActivePathId(up.path_id);
          setUserPathData(up);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const currentPath = paths.find((p) => p.id === activePathId) || paths[0];

  const handleStartStep = async (step: any) => {
    if (isStartingStep) return;
    setIsStartingStep(true);
    sound.playFlip();

    try {
      const res = await fetch('/api/v1/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: step.family_id ? 'family' : step.pos_id ? 'pos' : 'topic',
          topic_ids: [step.topic_id],
          pos_ids: step.pos_id ? [step.pos_id] : undefined,
          family_id: step.family_id || undefined,
          path_step_id: step.id,
        }),
      });
      const pack = await res.json();
      router.push(`/app/quest/${pack.id || pack.pack_id}`);
    } catch (err) {
      console.error(err);
      setIsStartingStep(false);
    }
  };

  const handleSwitchPath = async (pathId: number) => {
    setActivePathId(pathId);
    try {
      await fetch('/api/v1/me/path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path_id: pathId }),
      });
    } catch (e) {}
  };

  if (loading || !currentPath) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Đang tải lộ trình học...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-bold mb-2">
          <Compass className="w-4 h-4 text-brand-600" />
          <span>Lộ Trình Học Cá Nhân Hóa (Learning Paths)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white">
          Chinh Phục Lộ Trình CEFR Của Bạn
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Mỗi bước học tập trung rèn luyện 1 kỹ năng trọng tâm và kết hợp ôn tập ngắt quãng.
        </p>
      </div>

      {/* Path Tabs Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {paths.map((p) => {
          const isSelected = p.id === activePathId;
          return (
            <button
              key={p.id}
              onClick={() => handleSwitchPath(p.id)}
              className={`p-4 rounded-3xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 shadow-lg shadow-brand-500/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                  {p.target_cefr}
                </span>
                {isSelected && <span className="text-[10px] font-black text-brand-600">Đang học</span>}
              </div>
              <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white leading-tight mb-1">
                {p.name_vi}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-2">{p.description_vi}</p>
            </button>
          );
        })}
      </div>

      {/* Steps Roadmap */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <h2 className="font-heading font-black text-lg text-slate-900 dark:text-white">
            Các Bước Trong Lộ Trình: {currentPath.name_vi}
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {currentPath.steps.length} bước cốt lõi
          </span>
        </div>

        <div className="space-y-4">
          {currentPath.steps.map((step) => {
            const isCompleted = step.step_no < userPathData.current_step;
            const isCurrent = step.step_no === userPathData.current_step;
            const isLocked = step.step_no > userPathData.current_step;

            return (
              <div
                key={step.id}
                className={`p-5 rounded-3xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCurrent
                    ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/30 shadow-md'
                    : isCompleted
                    ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-heading font-black text-base flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-brand-600 text-white animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓' : isLocked ? <Lock className="w-5 h-5" /> : step.step_no}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">
                        Bước {step.step_no}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        Trọng tâm: {step.skill_focus}
                      </span>
                    </div>
                    <h4 className="font-heading font-black text-base text-slate-900 dark:text-white">
                      {step.title_vi}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Yêu cầu hoàn thành: 3 Pack từ vựng chất lượng
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <button
                    onClick={() => handleStartStep(step)}
                    disabled={isStartingStep}
                    className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-heading font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Học Bước Này &gt;</span>
                  </button>
                )}

                {isCompleted && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã hoàn thành
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
