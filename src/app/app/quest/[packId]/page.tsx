'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sound } from '@/lib/audio';
import { PosChip } from '@/components/common/PosChip';
import {
  Volume2, Sparkles, ArrowRight, ShieldCheck, Play, ChevronLeft,
  ChevronRight, Lock, CheckCircle2, Heart, Clock, Zap
} from 'lucide-react';
import { PlayMode, POSCode, StudyPack, GameCode } from '@/types';

export default function QuestLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const packId = params.packId as string;

  const [pack, setPack] = useState<StudyPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playMode, setPlayMode] = useState<PlayMode>('adventure');
  const [accent, setAccent] = useState<'uk' | 'us'>('uk');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/packs/${packId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setPack(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    fetch('/api/v1/me')
      .then((r) => r.json())
      .then((u) => {
        if (u.play_mode) setPlayMode(u.play_mode);
      })
      .catch(() => {});
  }, [packId]);

  if (loading || !pack) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Đang chuẩn bị phòng học (Lobby)...</span>
        </div>
      </div>
    );
  }

  const currentLevel = pack.current_level || 1;
  const currentRound = pack.current_round || 1;
  const levelConfig = pack.levels?.find((l) => l.level === currentLevel);
  const roundConfig =
    levelConfig?.rounds?.find((r) => r.round_no === currentRound) ||
    levelConfig?.rounds?.[0];
  const targetRound = roundConfig ? roundConfig.round_no : 1;
  const targetGameCode: GameCode = roundConfig
    ? roundConfig.game_code
    : (currentLevel === 1 ? 'flip_card' : currentLevel === 2 ? 'fill_blank' : 'speed_quiz');

  const currentWord = pack.words[currentIndex];

  const handleStartGame = async () => {
    if (isStarting) return;
    setIsStarting(true);
    sound.playFlip();

    try {
      const res = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack_id: pack.id,
          level: currentLevel,
          round_no: targetRound,
          game_code: targetGameCode,
          play_mode: playMode,
        }),
      });
      const session = await res.json();
      if (session.id) {
        router.push(`/app/play/${session.id}`);
      } else {
        throw new Error(session.error?.message || 'Không thể tạo phiên');
      }
    } catch (err) {
      console.error(err);
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Lobby · Xem trước 10 từ trước khi vào game</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white">
          Sảnh Chuẩn Bị Nhiệm Vụ (Quest Lobby)
        </h1>
      </div>

      {/* 3-Level Progression Chain (Lỗi 2: Hiển thị đúng Round của Level) */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { level: 1, title: 'Cấp L1', game: 'Flip Card', desc: 'Nhận diện mặt chữ & IPA' },
          {
            level: 2,
            title: 'Cấp L2',
            game:
              currentLevel === 2 && currentRound === 2
                ? 'Round 2: Sentence'
                : currentLevel === 2 && currentRound === 1
                ? 'Round 1: Fill Blank'
                : 'Fill Blank & Sentence',
            desc:
              currentLevel === 2
                ? `Vòng ${currentRound}/2: ${currentRound === 1 ? 'Điền khuyết' : 'Xây dựng câu'}`
                : 'Dạng từ & Trật tự câu',
          },
          { level: 3, title: 'Cấp L3', game: 'Speed Quiz', desc: 'Phản xạ đồng/trái nghĩa' },
        ].map((lvl) => {
          const isPassed = lvl.level < pack.current_level;
          const isCurrent = lvl.level === pack.current_level;
          const isLocked = lvl.level > pack.current_level;

          return (
            <div
              key={lvl.level}
              className={`p-4 rounded-3xl border-2 text-center transition-all ${
                isCurrent
                  ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 shadow-lg shadow-brand-500/10'
                  : isPassed
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                <span className="text-xs font-black uppercase">{lvl.title}</span>
              </div>
              <h4 className="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {lvl.game}
              </h4>
              <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5">{lvl.desc}</p>
            </div>
          );
        })}
      </div>

      {/* 10-Word Preview Carousel */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 relative text-center">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black text-slate-400">
            Từ {currentIndex + 1}/10
          </span>

          {/* UK / US accent selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setAccent('uk')}
              className={`px-2.5 py-0.5 rounded-lg transition-all ${accent === 'uk' ? 'bg-white dark:bg-slate-900 shadow-sm text-brand-600' : 'text-slate-500'}`}
            >
              Giọng UK
            </button>
            <button
              onClick={() => setAccent('us')}
              className={`px-2.5 py-0.5 rounded-lg transition-all ${accent === 'us' ? 'bg-white dark:bg-slate-900 shadow-sm text-brand-600' : 'text-slate-500'}`}
            >
              Giọng US
            </button>
          </div>
        </div>

        {/* Word Display */}
        {currentWord && (
          <div className="py-4 space-y-3">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
                {currentWord.headword}
              </h2>
              <button
                onClick={() => sound.speak(currentWord.headword, accent)}
                className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 hover:scale-105 active:scale-95 transition-transform"
                title="Nghe phát âm chuẩn"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <PosChip posCode={currentWord.pos_code as POSCode} />
              <span className="text-sm font-mono text-slate-400">
                {currentWord.ipa_uk || '/.../'}
              </span>
            </div>

            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 max-w-md mx-auto pt-2">
              {currentWord.meaning_vi}
            </p>
          </div>
        )}

        {/* Carousel Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60">
          <button
            onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
            disabled={currentIndex === 0}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {pack.words.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentIndex === i ? 'w-6 bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIndex((idx) => Math.min(pack.words.length - 1, idx + 1))}
            disabled={currentIndex === pack.words.length - 1}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mode Selector & Big Start Button */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Chế độ chơi:
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPlayMode('learning')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                playMode === 'learning'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              Học không áp lực (Vô hạn Máu, không timer)
            </button>
            <button
              onClick={() => setPlayMode('adventure')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                playMode === 'adventure'
                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              Thử thách (Máu & Timer & Combo x3)
            </button>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={isStarting}
          className="w-full sm:w-auto px-10 py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-heading font-black text-lg rounded-2xl shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>
            {isStarting
              ? 'Đang vào ván...'
              : `Bắt Đầu L${currentLevel} · Vòng ${targetRound} >`}
          </span>
        </button>
      </div>
    </div>
  );
}
