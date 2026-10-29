'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { sound } from '@/lib/audio';
import { PosChip } from '@/components/common/PosChip';
import {
  Sparkles, Play, ArrowRight, Brain, Flame, Target, Trophy,
  Compass, CheckCircle2, ShieldCheck, Zap, Volume2, HelpCircle
} from 'lucide-react';

export default function LandingPage() {
  // 30-Second Guest Interactive Demo State
  const [demoSelected, setDemoSelected] = useState<string | null>(null);
  const [demoFeedback, setDemoFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const demoOptions = [
    { text: 'decision', pos: 'noun' as const, reason: 'Danh từ: không bổ nghĩa trực tiếp cho động từ "presented"' },
    { text: 'decide', pos: 'verb' as const, reason: 'Động từ nguyên mẫu: câu đã có động từ chính' },
    { text: 'decisive', pos: 'adj' as const, reason: 'Tính từ: chỉ bổ nghĩa cho danh từ' },
    { text: 'decisively', pos: 'adv' as const, reason: 'Chính xác! Trạng từ bổ nghĩa cho động từ "presented"' },
  ];

  const handleDemoAnswer = (opt: typeof demoOptions[0]) => {
    setDemoSelected(opt.text);
    if (opt.text === 'decisively') {
      sound.playCorrect();
      sound.speak('The team presented the plan decisively.', 'uk');
      setDemoFeedback({
        isCorrect: true,
        message: 'Chính xác! "decisively" là trạng từ (-ly) bổ nghĩa cách thức cho động từ "presented".',
      });
    } else {
      sound.playWrong();
      setDemoFeedback({
        isCorrect: false,
        message: `Chưa đúng: ${opt.reason}`,
      });
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold mb-6">
          <Sparkles className="w-4 h-4 text-brand-600 animate-spin" />
          <span>Phiên bản 2.0 · Thuật toán Spaced Repetition (SRS) & Mini-games Đột phá</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-heading font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight mb-6">
          Chinh Phục Từ Vựng Tiếng Anh Qua{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-500 to-pink-500">
            Game Hóa Ngữ Pháp
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 font-body leading-relaxed">
          Không còn học vẹt thụ động! VocabQuest giúp học sinh, sinh viên Việt Nam làm chủ 5 loại từ, biến đổi họ từ vựng (Word Families) và tự tin dùng từ chuẩn xác trong câu.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            href="/app/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-heading font-black text-lg shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span>Vào Học Ngay</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/onboarding"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-heading font-bold text-base shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span>Làm Bài Test Xếp Lớp (10 câu)</span>
          </Link>
        </div>

        {/* 30-Second Live Interactive Demo Card (Guest, No Login Required) */}
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-brand-500/40 relative overflow-hidden text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" />
              Chơi Thử 30 Giây (Khách)
            </span>
            <span className="text-xs text-slate-400 font-semibold">Cấp L2 · Word Formation</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-body text-slate-900 dark:text-white mb-2 leading-snug">
            The team presented the plan very{' '}
            <span className="inline-block px-3 py-0.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-2 border-dashed border-amber-400 font-black">
              [ ________ ]
            </span>{' '}
            at the conference.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-5">
            &quot;Đội ngũ đã trình bày kế hoạch một cách rất thuyết phục tại hội nghị.&quot;
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {demoOptions.map((opt) => (
              <button
                key={opt.text}
                onClick={() => handleDemoAnswer(opt)}
                className={`p-3.5 rounded-2xl font-heading font-black text-sm border-2 text-center transition-all duration-150 active:scale-95 ${
                  demoSelected === opt.text
                    ? opt.text === 'decisively'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white hover:border-brand-400'
                }`}
              >
                {opt.text}
              </button>
            ))}
          </div>

          {demoFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium animate-fadeIn flex items-start gap-2.5 ${
                demoFeedback.isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-800 dark:text-rose-200'
              }`}
            >
              {demoFeedback.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <HelpCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <span>{demoFeedback.message}</span>
            </div>
          )}
        </div>
      </section>

      {/* 3 Core Game Levels (L1 -> L2 -> L3) */}
      <section className="w-full bg-slate-100/60 dark:bg-slate-800/40 py-16 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-black text-slate-900 dark:text-white mb-3">
              Chuỗi 3 Cấp Độ Học Toàn Diện
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
              Học từng bộ 10 từ (Pack) qua 3 giai đoạn não bộ: Nhận diện ➔ Cấu trúc ngữ pháp ➔ Phản xạ siêu tốc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* L1 Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-heading font-black text-xl mb-4">
                L1
              </div>
              <h3 className="text-xl font-heading font-black text-slate-900 dark:text-white mb-2">
                G1 — Memory Flip Card
              </h3>
              <p className="text-xs font-semibold text-blue-600 mb-3 uppercase tracking-wider">
                Nhận diện từ ↔ Nghĩa ↔ IPA
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Lật thẻ 3D ghép nối 10 cặp từ vựng. Phát âm chuẩn IPA và nghĩa tiếng Việt kèm màu sắc đặc trưng của từng loại từ.
              </p>
            </div>

            {/* L2 Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-brand-500 dark:border-brand-500/80 shadow-lg relative">
              <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-black uppercase">
                Trọng Tâm MVP
              </span>
              <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-heading font-black text-xl mb-4">
                L2
              </div>
              <h3 className="text-xl font-heading font-black text-slate-900 dark:text-white mb-2">
                G2 & G8 — Điền Từ & Xây Câu
              </h3>
              <p className="text-xs font-semibold text-brand-600 mb-3 uppercase tracking-wider">
                Biến hình dạng từ & Trật tự câu
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Rèn luyện chính tả, chọn đúng dạng từ theo vị trí ngữ pháp (Word Formation), và kéo-thả các mảnh câu thành câu hoàn chỉnh.
              </p>
            </div>

            {/* L3 Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-heading font-black text-xl mb-4">
                L3
              </div>
              <h3 className="text-xl font-heading font-black text-slate-900 dark:text-white mb-2">
                G3 — Speed Quiz
              </h3>
              <p className="text-xs font-semibold text-amber-600 mb-3 uppercase tracking-wider">
                Phản xạ đồng/trái nghĩa & Time Bank
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Đồng nghĩa và trái nghĩa với nguyên tắc cùng loại từ (POS). Áp lực time bank 60 giây và combo điểm nhân tới x3.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EdTech & Scientific Features */}
      <section className="w-full max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-4">
              <Brain className="w-4 h-4" />
              <span>Khoa Học Trí Nhớ & EdTech</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white mb-4 leading-tight">
              Lặp Lại Ngắt Quãng SM-2 SRS Chuẩn Hóa
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Mỗi câu trả lời được phân loại chất lượng q (1–5) khách quan phía server. Không dùng thời gian để đo trí nhớ; từ sai tự động vào Sổ tay và chỉ rời sổ tay khi nhớ đúng 2 lần liên tiếp.
            </p>

            <div className="space-y-3">
              {[
                { title: 'Chế độ Học Tự Do (Learning Mode)', desc: 'Không áp lực thời gian, vô hạn máu, giải thích ngay sau mỗi câu.' },
                { title: 'Họ từ vựng (Word Families)', desc: 'Học trọn cụm Noun / Verb / Adj / Adv, bài trừ từ giả dạng decisation.' },
                { title: 'ExplainSheet Chi Tiết', desc: 'Chỉ rõ lý do vì sao đáp án đúng và vì sao từng phương án nhiễu sai.' },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{feat.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <h3 className="text-2xl font-heading font-black mb-4">
              Sẵn Sàng Làm Chủ Từ Vựng?
            </h3>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed mb-8">
              Bắt đầu hành trình học tập cùng VocabQuest ngay hôm nay. Trải nghiệm phương pháp học tập kết hợp game phản xạ và ngữ pháp ứng dụng.
            </p>

            <div className="space-y-3">
              <Link
                href="/app/dashboard"
                className="w-full py-4 rounded-2xl bg-white text-brand-700 hover:bg-slate-100 font-heading font-black text-center block shadow-lg transition-transform active:scale-95"
              >
                Bắt Đầu Học Miễn Phí
              </Link>
              <Link
                href="/app/library"
                className="w-full py-3.5 rounded-2xl bg-brand-700/60 hover:bg-brand-700 text-white font-heading font-bold text-sm text-center block border border-white/20 transition-colors"
              >
                Khám Phá Thư Viện Chủ Đề
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
