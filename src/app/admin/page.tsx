'use client';

import React, { useState, useEffect } from 'react';
import { PosChip } from '@/components/common/PosChip';
import { sound } from '@/lib/audio';
import {
  ShieldAlert, CheckCircle2, Clock, XCircle, Plus, Search,
  Flag, BookOpen, Layers, Volume2, Edit3, Trash2
} from 'lucide-react';
import { Vocabulary, POSCode } from '@/types';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'vocab' | 'families' | 'feedback'>('vocab');
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/vocabularies').then((r) => r.json()),
      fetch('/api/v1/topics').then((r) => r.json()),
    ])
      .then(([v]) => {
        if (v.items) setVocabularies(v.items);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));

    // Simulated feedback items
    setFeedbacks([
      {
        id: 'fb_1',
        entity_id: '1002',
        headword: 'decisive',
        reason: 'Câu ví dụ chưa tự nhiên',
        created_at: '2026-10-28T14:30:00Z',
        status: 'pending',
      },
      {
        id: 'fb_2',
        entity_id: '1005',
        headword: 'persuasively',
        reason: 'Đáp án chưa chính xác',
        created_at: '2026-10-29T08:15:00Z',
        status: 'pending',
      },
    ]);
  }, []);

  const handleUpdateStatus = (vocabId: string, newStatus: 'approved' | 'rejected') => {
    sound.playCorrect();
    setVocabularies((prev) =>
      prev.map((v) => (v.id === vocabId ? { ...v, review_status: newStatus } : v))
    );
  };

  const filteredVocabs = vocabularies.filter(
    (v) =>
      v.headword.toLowerCase().includes(search.toLowerCase()) ||
      v.meaning_vi.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full space-y-6 animate-fadeIn">
      {/* CMS Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Hệ Thống Quản Trị & Kiểm Duyệt Nội Dung (CMS)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white">
            Quy Trình Kiểm Duyệt Chuẩn 6 Bước
          </h1>
          <p className="text-xs text-slate-500">
            Chỉ những mục từ và câu ví dụ đạt trạng thái Approved mới được đưa vào Game & Study Packs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700">
        {[
          { id: 'vocab', label: `Kho Từ Vựng (${vocabularies.length})`, icon: BookOpen },
          { id: 'feedback', label: `Báo Lỗi Nội Dung (${feedbacks.length})`, icon: Flag },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 rounded-xl font-heading font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Vocabulary Management Tab */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo từ tiếng Anh hoặc nghĩa tiếng Việt..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/60 uppercase font-black text-slate-400">
                  <tr>
                    <th className="py-4 px-4">Từ vựng & IPA</th>
                    <th className="py-4 px-4">Loại từ</th>
                    <th className="py-4 px-4">Nghĩa tiếng Việt</th>
                    <th className="py-4 px-4">Độ khó</th>
                    <th className="py-4 px-4">Trạng thái duyệt</th>
                    <th className="py-4 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredVocabs.map((vocab) => (
                    <tr key={vocab.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-heading font-black text-sm text-slate-900 dark:text-white">
                          {vocab.headword}
                        </div>
                        <span className="text-[11px] font-ipa text-slate-400">{vocab.ipa_uk}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <PosChip posCode={vocab.pos_code} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {vocab.meaning_vi}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-400">
                        {vocab.cefr_level}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            vocab.review_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {vocab.review_status === 'approved' ? '✓ Đã duyệt (Approved)' : 'Đang chờ duyệt'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(vocab.id, 'approved')}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Duyệt (Approve)"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(vocab.id, 'rejected')}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Từ chối (Reject)"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Content Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="font-heading font-black text-base text-slate-900 dark:text-white mb-2">
            Hàng Chờ Xử Lý Báo Lỗi Từ Người Học (Content Feedback)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Người học gửi báo lỗi trực tiếp từ ExplainSheet. Câu bị báo lỗi ≥ 3 lần sẽ tự động tạm ẩn để biên tập viên kiểm tra lại.
          </p>

          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading font-black text-sm text-slate-900 dark:text-white">
                      Từ: {fb.headword} (ID #{fb.entity_id})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                      {fb.reason}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Báo cáo lúc: {new Date(fb.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playCorrect();
                      setFeedbacks((prev) => prev.filter((f) => f.id !== fb.id));
                    }}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Xác nhận & Giữ nguyên
                  </button>
                  <button
                    onClick={() => {
                      sound.playCorrect();
                      setFeedbacks((prev) => prev.filter((f) => f.id !== fb.id));
                    }}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
                  >
                    Sửa & Cập nhật
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
