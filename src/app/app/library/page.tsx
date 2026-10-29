'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PosChip } from '@/components/common/PosChip';
import { sound } from '@/lib/audio';
import {
  BookOpen, Search, Filter, Sparkles, Layers, Volume2,
  Compass, Briefcase, Cpu, GraduationCap, Award, MessageCircle, ArrowRight
} from 'lucide-react';
import { POSCode, Topic, Vocabulary, PartOfSpeech } from '@/types';

export default function LibraryPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [posList, setPosList] = useState<PartOfSpeech[]>([]);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingPack, setIsCreatingPack] = useState(false);

  // Filters
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedPosId, setSelectedPosId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFamilyOnly, setFilterFamilyOnly] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/topics').then((r) => r.json()),
      fetch('/api/v1/parts-of-speech').then((r) => r.json()),
      fetch('/api/v1/vocabularies').then((r) => r.json()),
    ])
      .then(([t, p, v]) => {
        if (t.items) setTopics(t.items);
        if (p.items) setPosList(p.items);
        if (v.items) setVocabularies(v.items);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Filtered vocabulary list
  const filteredVocabs = vocabularies.filter((v) => {
    if (selectedTopicId && !v.topic_ids.includes(selectedTopicId)) return false;
    if (selectedPosId && v.pos_id !== selectedPosId) return false;
    if (filterFamilyOnly && !v.family_id) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.headword.toLowerCase().includes(q) ||
        v.meaning_vi.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreatePack = async () => {
    if (isCreatingPack) return;
    setIsCreatingPack(true);
    sound.playFlip();

    try {
      const res = await fetch('/api/v1/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: filterFamilyOnly ? 'family' : selectedPosId ? 'pos' : 'topic',
          topic_ids: selectedTopicId ? [selectedTopicId] : undefined,
          pos_ids: selectedPosId ? [selectedPosId] : undefined,
          family_id: filterFamilyOnly ? 1 : undefined,
        }),
      });

      const pack = await res.json();
      router.push(`/app/quest/${pack.id || pack.pack_id}`);
    } catch (err) {
      console.error(err);
      setIsCreatingPack(false);
    }
  };

  const getTopicIcon = (slug: string) => {
    switch (slug) {
      case 'giao-tiep': return MessageCircle;
      case 'du-lich': return Compass;
      case 'cong-so': return Briefcase;
      case 'cong-nghe': return Cpu;
      case 'ielts': return GraduationCap;
      default: return Award;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full space-y-8 animate-fadeIn">
      {/* Header & Pack Creator Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white">
            Thư Viện Từ Vựng Đa Chiều
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Lọc theo Chủ đề × 5 Loại từ (POS) × Họ từ (Word Families)
          </p>
        </div>

        <button
          onClick={handleCreatePack}
          disabled={isCreatingPack || filteredVocabs.length === 0}
          className="w-full sm:w-auto px-6 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-heading font-black text-sm rounded-2xl shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isCreatingPack ? 'Đang tạo Pack...' : `Tạo Pack (10 từ)`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Topics Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
          1. Chọn Chủ đề học tập:
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {topics.map((t) => {
            const Icon = getTopicIcon(t.slug);
            const isSelected = selectedTopicId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTopicId(isSelected ? null : t.id)}
                className={`p-4 rounded-3xl border-2 text-left transition-all duration-150 flex flex-col justify-between h-32 active:scale-95 ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 shadow-md shadow-brand-500/10'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: t.color_hex }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                    {t.name_vi}
                  </h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {t.word_count || 45} từ
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* POS Filter Chips & Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm từ vựng (tiếng Anh hoặc nghĩa tiếng Việt)..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/60 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* POS Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1">Loại từ:</span>
            <button
              onClick={() => setSelectedPosId(null)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                selectedPosId === null
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
              }`}
            >
              Tất cả
            </button>
            {posList.map((pos) => {
              const isSelected = selectedPosId === pos.id;
              return (
                <button
                  key={pos.id}
                  onClick={() => setSelectedPosId(isSelected ? null : pos.id)}
                  className={`transition-all ${isSelected ? 'ring-2 ring-brand-500 rounded-full scale-105' : 'opacity-80 hover:opacity-100'}`}
                >
                  <PosChip posCode={pos.code} size="md" />
                </button>
              );
            })}
          </div>

          {/* Word Family Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterFamilyOnly}
              onChange={(e) => setFilterFamilyOnly(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-brand-600" />
              Chỉ xem từ thuộc Họ từ (Word Family)
            </span>
          </label>
        </div>
      </div>

      {/* Vocabulary Cards List */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-bold">
          <span>KẾT QUẢ: {filteredVocabs.length} TỪ KHẢ DỤNG</span>
          {filteredVocabs.length >= 10 && (
            <span className="text-brand-600">Đủ điều kiện tạo Pack 10 từ</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVocabs.map((vocab) => (
            <div
              key={vocab.id}
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <PosChip posCode={vocab.pos_code} size="sm" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                    CEFR {vocab.cefr_level}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white">
                    {vocab.headword}
                  </h3>
                  <button
                    onClick={() => sound.speak(vocab.headword, 'uk')}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-brand-600 transition-colors"
                    title="Nghe phát âm UK"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-xs font-ipa text-slate-400 block mb-2">
                  {vocab.ipa_uk}
                </span>

                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                  {vocab.meaning_vi}
                </p>
              </div>

              {vocab.sentences?.[0] && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 italic">
                  &quot;{vocab.sentences[0].sentence_text}&quot;
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
