'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/audio';
import {
  Sparkles, CheckCircle2, ArrowRight, Target, Compass, BookOpen,
  Award, Zap, ShieldCheck
} from 'lucide-react';
import { CEFRLevel } from '@/types';

interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  correct: string;
  level: CEFRLevel;
  explanation: string;
}

const PLACEMENT_QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    question: 'She _____ to school by bicycle every morning.',
    options: ['go', 'goes', 'going', 'gone'],
    correct: 'goes',
    level: 'A1',
    explanation: 'Chủ ngữ số ít "She" ở thì hiện tại đơn đi với động từ thêm -s/es ("goes").',
  },
  {
    id: 2,
    question: 'Hoi An is a very _____ ancient town in Vietnam.',
    options: ['peace', 'peaceful', 'peacefully', 'peaces'],
    correct: 'peaceful',
    level: 'A1',
    explanation: 'Đứng trước cụm danh từ "ancient town" cần một tính từ ("peaceful").',
  },
  {
    id: 3,
    question: 'They decided to _____ their vacation because of heavy rain.',
    options: ['put off', 'put on', 'take after', 'look for'],
    correct: 'put off',
    level: 'A2',
    explanation: 'Cụm động từ "put off" có nghĩa là trì hoãn, hoãn lại.',
  },
  {
    id: 4,
    question: 'Can you show me the detailed _____ for our tour tomorrow?',
    options: ['itinerary', 'destination', 'passport', 'luggage'],
    correct: 'itinerary',
    level: 'A2',
    explanation: '"itinerary" là lịch trình chi tiết của chuyến đi.',
  },
  {
    id: 5,
    question: 'The CEO made a _____ decision to enter the new market.',
    options: ['decisive', 'decide', 'decisively', 'decision'],
    correct: 'decisive',
    level: 'B1',
    explanation: 'Đứng sau mạo từ "a" và trước danh từ "decision" cần một tính từ ("decisive").',
  },
  {
    id: 6,
    question: 'The candidates presented their proposals very _____.',
    options: ['persuasion', 'persuade', 'persuasive', 'persuasively'],
    correct: 'persuasively',
    level: 'B1',
    explanation: 'Bổ nghĩa cho động từ "presented" sau tân ngữ cần trạng từ chỉ cách thức ("persuasively").',
  },
  {
    id: 7,
    question: 'Smoking can severely _____ your respiratory health.',
    options: ['affect', 'effect', 'effective', 'affection'],
    correct: 'affect',
    level: 'B1',
    explanation: 'Đứng sau "can" cần động từ nguyên mẫu ("affect" là động từ, "effect" là danh từ).',
  },
  {
    id: 8,
    question: 'We need to _____ innovative solutions to reduce carbon emissions.',
    options: ['collaborate on', 'get along', 'give away', 'run into'],
    correct: 'collaborate on',
    level: 'B1',
    explanation: '"collaborate on" nghĩa là hợp tác cùng thực hiện một giải pháp/dự án.',
  },
  {
    id: 9,
    question: 'The hotel is _____ located within walking distance of the station.',
    options: ['convenient', 'conveniently', 'convenience', 'convening'],
    correct: 'conveniently',
    level: 'B1',
    explanation: 'Bổ nghĩa cho tính từ/phân từ "located" cần một trạng từ ("conveniently").',
  },
  {
    id: 10,
    question: 'Her arguments were supported by _____ evidence from official sources.',
    options: ['substantial', 'substance', 'substantially', 'substantiate'],
    correct: 'substantial',
    level: 'B1',
    explanation: 'Đứng trước danh từ "evidence" cần tính từ chỉ mức độ/quy mô ("substantial").',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'goals' | 'test' | 'result'>('goals');

  // Goals Form
  const [goal, setGoal] = useState<'communication' | 'workplace' | 'exam'>('communication');
  const [dailyWords, setDailyWords] = useState<number>(10);

  // Test State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQ = PLACEMENT_QUESTIONS[currentIndex];

  const handleSelectAnswer = (option: string) => {
    sound.playFlip();
    const updated = { ...userAnswers, [currentQ.id]: option };
    setUserAnswers(updated);

    if (currentIndex < PLACEMENT_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Complete test
      submitTest(updated);
    }
  };

  const submitTest = async (answers: Record<number, string>) => {
    setIsSubmitting(true);
    let correctCount = 0;
    const answerPayload = PLACEMENT_QUESTIONS.map((q) => {
      const isCorrect = answers[q.id] === q.correct;
      if (isCorrect) correctCount++;
      return {
        question_id: q.id,
        answer: answers[q.id],
        is_correct: isCorrect,
      };
    });

    try {
      const res = await fetch('/api/v1/onboarding/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answerPayload,
          daily_goal_words: dailyWords,
          goal,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      sound.playWin();
      setStep('result');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10">
      {/* Step 1: Goals & Daily Commitment */}
      {step === 'goals' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center mb-4">
            <Target className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white mb-2">
            Thiết Lập Mục Tiêu Học Tập
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            VocabQuest sẽ cá nhân hóa lộ trình và tần suất ôn tập SRS phù hợp với bạn.
          </p>

          {/* Goal selection */}
          <div className="space-y-3 mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Mục tiêu chính của bạn:
            </label>
            {[
              {
                id: 'communication',
                title: 'Giao tiếp đời sống & Du lịch',
                desc: 'Tự tin nói chuyện, hỏi đường, mua sắm và chia sẻ cảm xúc.',
                icon: Compass,
              },
              {
                id: 'workplace',
                title: 'Công sở & Kinh doanh (TOEIC)',
                desc: 'Viết email chuẩn ngữ pháp, họp nhóm, làm việc với đối tác.',
                icon: Award,
              },
              {
                id: 'exam',
                title: 'Luyện thi Học thuật (IELTS / THPT)',
                desc: 'Mở rộng họ từ vựng học thuật, viết luận và trật tự câu phức tạp.',
                icon: Zap,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = goal === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setGoal(item.id as any)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 shadow-md shadow-brand-500/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily Goal Words */}
          <div className="mb-8">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Mục tiêu học từ mỗi ngày:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { count: 5, time: '~5 phút/ngày', label: 'Nhẹ nhàng' },
                { count: 10, time: '~10 phút/ngày', label: 'Khuyên dùng' },
                { count: 20, time: '~20 phút/ngày', label: 'Cấp tốc' },
              ].map((tier) => (
                <button
                  key={tier.count}
                  onClick={() => setDailyWords(tier.count)}
                  className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
                    dailyWords === tier.count
                      ? 'border-brand-600 bg-brand-600 text-white font-bold shadow-md'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white'
                  }`}
                >
                  <span className="block font-heading font-black text-xl">{tier.count} từ</span>
                  <span className="block text-[10px] opacity-80">{tier.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep('test')}
            className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-heading font-black text-base shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <span>Tiếp Tục Làm Test Xếp Lớp (10 câu)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: 10-Question Placement Test */}
      {step === 'test' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 animate-fadeIn">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Bài Test Xếp Trình Độ Ước Lượng
            </span>
            <span className="text-xs font-black text-slate-400">
              Câu {currentIndex + 1}/{PLACEMENT_QUESTIONS.length}
            </span>
          </div>

          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / PLACEMENT_QUESTIONS.length) * 100}%` }}
            />
          </div>

          <h3 className="text-lg sm:text-xl font-heading font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">
            {currentQ.question}
          </h3>

          <div className="space-y-3 mb-6">
            {currentQ.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelectAnswer(opt)}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-brand-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-brand-50/50 text-left font-heading font-bold text-base text-slate-800 dark:text-white shadow-sm transition-all active:scale-98"
              >
                {opt}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 text-center italic">
            * Lưu ý: Kết quả là ước lượng ban đầu để gợi ý lộ trình, bạn có thể tự do điều chỉnh bất kỳ lúc nào.
          </p>
        </div>
      )}

      {/* Step 3: Result & Path Recommendation */}
      {step === 'result' && testResult && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-brand-500/40 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white mb-1">
            Hoàn Thành Bài Test!
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Bạn đã trả lời đúng {testResult.score}/{testResult.total} câu.
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 mb-6 inline-block w-full max-w-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Trình độ ước lượng của bạn:
            </span>
            <span className="text-4xl font-heading font-black text-brand-600 dark:text-brand-400">
              {testResult.cefr_level}
            </span>
            <span className="block text-xs text-slate-500 mt-2">
              {testResult.cefr_level === 'A1'
                ? 'Nền tảng giao tiếp căn bản'
                : testResult.cefr_level === 'A2'
                ? 'Giao tiếp tự nhiên đời sống & du lịch'
                : 'Công sở & ngữ pháp ứng dụng cao'}
            </span>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/app/dashboard')}
              className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-heading font-black text-base shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <span>Vào Bảng Điều Khiển (Dashboard)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
