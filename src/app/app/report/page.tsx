'use client';

import React, { useState, useEffect } from 'react';
import { PosChip } from '@/components/common/PosChip';
import {
  BarChart3, CheckCircle2, AlertTriangle, Sparkles, Brain,
  Calendar, ArrowRight, ShieldCheck
} from 'lucide-react';
import { POSCode } from '@/types';

export default function WeeklyReportPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/reports/weekly')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setReport(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !report) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Đang tổng hợp báo cáo học tập tuần...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-bold mb-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span>Báo Cáo Tiến Độ Học Tập Tuần ({report.week})</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white">
          Learning Report — Tổng Kết Tuần
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Đo lường sự tiến bộ thực chất, tách bạch giữa nhớ nghĩa bề mặt và khả năng dùng đúng từ trong câu.
        </p>
      </div>

      {/* 3 Distinct Core Metrics (Section 8.9) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Từ đã gặp */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            1. Từ đã gặp trong tuần
          </span>
          <div className="text-4xl font-heading font-black text-slate-900 dark:text-white tabular-nums mb-1">
            {report.words_seen}
          </div>
          <p className="text-xs text-slate-500">
            Có ít nhất 1 câu hỏi xuất hiện trong tuần
          </p>
        </div>

        {/* Metric 2: Từ trả lời đúng ngay lần 1 */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            2. Trả lời đúng lần đầu
          </span>
          <div className="text-4xl font-heading font-black text-brand-600 dark:text-brand-400 tabular-nums mb-1">
            {report.words_correct}
          </div>
          <p className="text-xs text-slate-500">
            Tự nhớ đúng ngay lần thử đầu, không cần gợi ý
          </p>
        </div>

        {/* Metric 3: Từ đạt thông thạo (Mastered v2) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border-2 border-emerald-500/60 dark:border-emerald-500/40">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            3. Đạt mức thông thạo (Mastered)
          </span>
          <div className="text-4xl font-heading font-black text-emerald-600 dark:text-emerald-400 tabular-nums mb-1">
            {report.words_mastered}
          </div>
          <p className="text-xs text-slate-500">
            Thỏa mãn SM-2 (interval ≥ 21 ngày) và dùng đúng trong câu
          </p>
        </div>
      </div>

      {/* Natural Language Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2.5 mb-3">
          <Brain className="w-5 h-5 text-brand-600" />
          <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">
            Đánh Giá Tổng Quan Từ AI Tutor
          </h3>
        </div>

        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-700/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
          &quot;{report.summary_text_vi}&quot;
        </p>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Tỷ lệ nhớ đúng khi ôn lại SRS:</span>
          <span className="font-heading font-black text-base text-emerald-600 tabular-nums">
            {report.recall_rate}%
          </span>
        </div>
      </div>

      {/* POS Weaknesses & Specific Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="font-heading font-black text-base text-slate-900 dark:text-white mb-4">
            Độ Chính Xác 5 Loại Từ (POS)
          </h3>
          <div className="space-y-3">
            {report.by_pos?.map((p: any) => (
              <div key={p.pos_id} className="flex items-center justify-between gap-3">
                <PosChip posCode={p.code as POSCode} size="sm" />
                <div className="flex-1">
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.accuracy}%`, backgroundColor: p.color_hex }}
                    />
                  </div>
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 min-w-[36px] text-right">
                  {p.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="font-heading font-black text-base text-slate-900 dark:text-white mb-4">
            Điểm Cần Chú Ý Trong Tuần Tới
          </h3>

          <div className="space-y-3">
            {report.weak_points?.map((wp: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                      {wp.title_vi}
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      {wp.tip_vi}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
