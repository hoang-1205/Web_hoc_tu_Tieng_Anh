import fs from 'fs';
import path from 'path';
import {
  User, Topic, PartOfSpeech, WordFamily, Vocabulary, ExampleSentence,
  GrammarTip, AffixRule, StudyPack, GameSession, SessionQuestion,
  UserWordProgress, UserWordSkillStat, UserPosStat, LearningPath,
  UserPath, DailyQuest, Badge, ShopItem, GameCode, PlayMode, SkillCode, ErrorCategory
} from '@/types';
import {
  SEED_TOPICS, SEED_POS, SEED_WORD_FAMILIES, SEED_GRAMMAR_TIPS,
  SEED_AFFIX_RULES, SEED_VOCABULARIES, SEED_LEARNING_PATHS,
  SEED_BADGES, SEED_SHOP_ITEMS
} from '@/data/seedData';

interface StoreData {
  user: User;
  topics: Topic[];
  partsOfSpeech: PartOfSpeech[];
  wordFamilies: WordFamily[];
  vocabularies: Vocabulary[];
  grammarTips: GrammarTip[];
  affixRules: AffixRule[];
  learningPaths: LearningPath[];
  userPaths: Record<string, UserPath>;
  studyPacks: Record<string, StudyPack>;
  sessions: Record<string, GameSession>;
  wordProgress: Record<string, Record<string, UserWordProgress>>; // userId -> vocabId -> progress
  skillStats: Record<string, Record<string, UserWordSkillStat>>; // userId -> `${vocabId}_${skill}` -> stat
  posStats: Record<string, Record<number, UserPosStat>>; // userId -> posId -> stat
  dailyQuests: Record<string, DailyQuest[]>; // userId -> quests
  badges: Badge[];
  shopItems: ShopItem[];
  feedback: any[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'vocabquest_store.json');

class StoreManager {
  private data: StoreData | null = null;

  private initDefaults(): StoreData {
    const defaultUser: User = {
      id: 'usr_demo_1',
      email: 'learner@vocabquest.app',
      display_name: 'Học Bá Alpha',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'learner',
      cefr_level: 'A2',
      xp: 1240,
      level: 6,
      coins: 340,
      streak_current: 7,
      streak_longest: 14,
      streak_freezes: 1,
      last_active_date: new Date().toISOString().slice(0, 10),
      timezone: 'Asia/Ho_Chi_Minh',
      daily_goal_words: 10,
      difficulty_tiers: {
        flip_card: 1,
        fill_blank: 1,
        speed_quiz: 1,
        sentence_builder: 1,
        word_basket: 1,
        family_morph: 1,
        audio_shooter: 1,
        topic_express: 1,
      },
      onboarded: true,
      play_mode: 'adventure',
      created_at: new Date().toISOString(),
    };

    // Pre-populate initial progress for user
    const initialProgress: Record<string, UserWordProgress> = {};
    SEED_VOCABULARIES.forEach((v, index) => {
      const isMastered = index < 3;
      const isNotebook = index === 4 || index === 5;
      initialProgress[v.id] = {
        user_id: defaultUser.id,
        vocab_id: v.id,
        status: isMastered ? 'mastered' : index < 8 ? 'learning' : 'new',
        repetition: isMastered ? 5 : index < 8 ? 2 : 0,
        ease_factor: 2.5,
        interval_days: isMastered ? 24 : index < 8 ? 3 : 0,
        next_review_at: isNotebook ? new Date(Date.now() - 3600000).toISOString() : new Date(Date.now() + 86400000 * 2).toISOString(),
        last_quality: 4,
        correct_count: isMastered ? 6 : index < 8 ? 2 : 0,
        wrong_count: isNotebook ? 2 : 0,
        lapse_count: isNotebook ? 1 : 0,
        correct_streak: isMastered ? 4 : isNotebook ? 0 : 2,
        best_level_passed: isMastered ? 3 : 2,
        in_notebook: isNotebook,
        notebook_added_at: isNotebook ? new Date().toISOString() : undefined,
        first_seen_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      };
    });

    // Default quests
    const defaultQuests: DailyQuest[] = [
      {
        quest_code: 'review_10',
        title_vi: 'Ôn tập 10 từ đến hạn SRS',
        target: 10,
        progress: 6,
        reward_coins: 20,
        claimed: false,
      },
      {
        quest_code: 'combo_x2',
        title_vi: 'Đạt chuỗi Combo x2 trong bất kỳ game nào',
        target: 1,
        progress: 1,
        reward_coins: 15,
        claimed: false,
      },
      {
        quest_code: 'complete_pack',
        title_vi: 'Hoàn thành trọn vẹn 1 Pack (L1 → L3)',
        target: 1,
        progress: 0,
        reward_coins: 30,
        claimed: false,
      },
    ];

    // Default user path
    const defaultUserPaths: Record<string, UserPath> = {
      [defaultUser.id]: {
        user_id: defaultUser.id,
        path_id: 2, // A2 Travel & Life
        current_step: 2,
        step_progress: 1,
        started_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
    };

    return {
      user: defaultUser,
      topics: SEED_TOPICS,
      partsOfSpeech: SEED_POS,
      wordFamilies: SEED_WORD_FAMILIES,
      vocabularies: SEED_VOCABULARIES,
      grammarTips: SEED_GRAMMAR_TIPS,
      affixRules: SEED_AFFIX_RULES,
      learningPaths: SEED_LEARNING_PATHS,
      userPaths: defaultUserPaths,
      studyPacks: {},
      sessions: {},
      wordProgress: { [defaultUser.id]: initialProgress },
      skillStats: {},
      posStats: {},
      dailyQuests: { [defaultUser.id]: defaultQuests },
      badges: SEED_BADGES,
      shopItems: SEED_SHOP_ITEMS,
      feedback: [],
    };
  }

  public get(): StoreData {
    if (!this.data) {
      try {
        if (fs.existsSync(DB_PATH)) {
          const raw = fs.readFileSync(DB_PATH, 'utf-8');
          this.data = JSON.parse(raw);
        } else {
          this.data = this.initDefaults();
          this.save();
        }
      } catch (err) {
        console.warn('Failed to read store file, falling back to in-memory defaults:', err);
        this.data = this.initDefaults();
      }
    }
    return this.data!;
  }

  public save(): void {
    if (!this.data) return;
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write store file:', err);
    }
  }

  // --- Vocabulary & Content Helpers ---
  public getVocabularies(filter?: {
    topic_id?: number;
    pos_id?: number;
    family_id?: number;
    search?: string;
  }): Vocabulary[] {
    const data = this.get();
    return data.vocabularies.filter((v) => {
      if (filter?.topic_id && !v.topic_ids.includes(filter.topic_id)) return false;
      if (filter?.pos_id && v.pos_id !== filter.pos_id) return false;
      if (filter?.family_id && v.family_id !== filter.family_id) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        return (
          v.headword.toLowerCase().includes(q) ||
          v.meaning_vi.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  public getVocabularyById(id: string): Vocabulary | undefined {
    return this.get().vocabularies.find((v) => v.id === id);
  }

  public getSessionById(sessionId: string): GameSession | undefined {
    return this.get().sessions[sessionId];
  }

  // --- Pack Builder Algorithm (Section 2.2 - Lỗi 1 Fix) ---
  public createPack(params: {
    userId: string;
    sourceType: 'topic' | 'pos' | 'family' | 'review';
    topicIds?: number[];
    posIds?: number[];
    familyId?: number;
    pathStepId?: number | null;
  }): StudyPack {
    const data = this.get();
    const userProgress = data.wordProgress[params.userId] || {};
    const now = new Date();

    // Candidate selection: STRICTLY approved and published only
    let pool = data.vocabularies.filter(
      (v) => v.review_status === 'approved' && v.is_published === true
    );

    if (params.sourceType === 'topic' && params.topicIds && params.topicIds.length > 0) {
      pool = pool.filter((v) => v.topic_ids.some((t) => params.topicIds!.includes(t)));
    } else if (params.sourceType === 'pos' && params.posIds && params.posIds.length > 0) {
      pool = pool.filter((v) => params.posIds!.includes(v.pos_id));
    } else if (params.sourceType === 'family' && params.familyId) {
      pool = pool.filter((v) => v.family_id === params.familyId);
    } else if (params.sourceType === 'review') {
      pool = pool.filter((v) => {
        const p = userProgress[v.id];
        return p && (p.in_notebook || new Date(p.next_review_at) <= now);
      });
    }

    if (pool.length === 0) {
      throw new Error('Không có từ vựng nào đã được kiểm duyệt (Approved) thuộc phạm vi lựa chọn này.');
    }

    // 1. Up to 4 due SRS words from pool
    const dueSRS = pool.filter((v) => {
      const p = userProgress[v.id];
      return p && (new Date(p.next_review_at) <= now || p.in_notebook);
    }).sort((a, b) => {
      const la = userProgress[a.id]?.lapse_count || 0;
      const lb = userProgress[b.id]?.lapse_count || 0;
      return lb - la;
    }).slice(0, 4);

    // 2. New or learning words to fill up to 10
    const chosenIds = new Set(dueSRS.map((v) => v.id));
    const remainingNeeded = 10 - dueSRS.length;

    const newWords = pool.filter((v) => !chosenIds.has(v.id))
      .sort((a, b) => a.frequency_rank - b.frequency_rank)
      .slice(0, remainingNeeded);

    const packWordsList = [...dueSRS, ...newWords];

    // If still less than 10, backfill ONLY from the same filtered approved pool
    if (packWordsList.length < 10) {
      const remainingFromPool = pool.filter((v) => !packWordsList.some((p) => p.id === v.id));
      packWordsList.push(...remainingFromPool.slice(0, 10 - packWordsList.length));
    }

    const packId = `pack_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Level configuration according to rotation matrix (Section 3.4)
    const isReview = params.sourceType === 'review';
    const levels = isReview
      ? [
          {
            level: 2,
            rounds: [
              { round_no: 1, game_code: 'fill_blank' as GameCode },
              { round_no: 2, game_code: 'sentence_builder' as GameCode },
            ],
          },
          {
            level: 3,
            rounds: [
              { round_no: 1, game_code: 'speed_quiz' as GameCode },
            ],
          },
        ]
      : [
          {
            level: 1,
            rounds: [{ round_no: 1, game_code: 'flip_card' as GameCode }],
          },
          {
            level: 2,
            rounds: [
              { round_no: 1, game_code: 'fill_blank' as GameCode },
              { round_no: 2, game_code: 'sentence_builder' as GameCode },
            ],
          },
          {
            level: 3,
            rounds: [{ round_no: 1, game_code: 'speed_quiz' as GameCode }],
          },
        ];

    const pack: StudyPack = {
      id: packId,
      user_id: params.userId,
      source_type: params.sourceType,
      topic_ids: params.topicIds,
      pos_ids: params.posIds,
      family_id: params.familyId,
      path_step_id: params.pathStepId,
      status: 'in_progress',
      current_level: isReview ? 2 : 1,
      current_round: 1,
      words: packWordsList.map((w) => ({
        vocab_id: w.id,
        headword: w.headword,
        pos_code: w.pos_code,
        sense_no: w.sense_no,
        ipa_uk: w.ipa_uk,
        meaning_vi: w.meaning_vi,
        audio_url: w.audio_url_uk,
        is_review: Boolean(userProgress[w.id]?.in_notebook || (userProgress[w.id] && new Date(userProgress[w.id].next_review_at) <= now)),
      })),
      levels,
    };

    data.studyPacks[packId] = pack;
    this.save();
    return pack;
  }

  // --- Session & QuestionPlan Builder (Section 8.7 & 3.3) ---
  public createSession(params: {
    userId: string;
    packId: string;
    level: number;
    roundNo: number;
    gameCode: GameCode;
    playMode: PlayMode;
  }): GameSession {
    const data = this.get();
    const pack = data.studyPacks[params.packId];
    if (!pack) throw new Error('Pack not found');

    const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const packVocabs = pack.words.map((w) => data.vocabularies.find((v) => v.id === w.vocab_id)!);

    // Build QuestionPlan according to game code
    const questions: SessionQuestion[] = [];

    if (params.gameCode === 'flip_card') {
      // 10 pairs (20 cards)
      packVocabs.forEach((v, idx) => {
        questions.push({
          id: `q_${sessionId}_${idx + 1}`,
          session_id: sessionId,
          question_no: idx + 1,
          vocab_id: v.id,
          question_type: '1',
          skill_code: 'meaning_recall',
          payload: {
            prompt: v.headword,
            correct_answer: v.meaning_vi,
            explanation_refs: {
              meaning: v.meaning_vi,
              rule_text: `${v.headword} (${v.pos_code}): ${v.meaning_vi}`,
            },
          },
        });
      });
    } else if (params.gameCode === 'fill_blank') {
      // 10 questions: mix of 2A (letter blank) and 2B (POS form from word family)
      packVocabs.forEach((v, idx) => {
        const sentence = v.sentences?.[0] || {
          sentence_template: `This is an example for {{blank}}.`,
          sentence_text: `This is an example for ${v.headword}.`,
          blank_text: v.headword,
          slot_pattern: 'GENERAL',
          grammar_note: 'Điền từ vựng phù hợp vào chỗ trống.',
          translation_vi: 'Đây là câu ví dụ minh họa.',
          chunks: ['This is', 'an example', `for ${v.headword}.`],
        };

        const isPosForm = Boolean(v.family_id && (idx % 2 === 1 || v.family_id === 1 || v.family_id === 4));
        const skillCode: SkillCode = isPosForm ? 'pos_form' : 'spelling';

        let options: { id: string; text: string; pos_code?: any }[] | undefined;
        let distractorReasons: Record<string, string> = (sentence as any).option_explanations || {};

        if (isPosForm) {
          // Generate 4 forms from family or related words
          const family = data.wordFamilies.find((f) => f.id === v.family_id);
          const relatedVocabs = data.vocabularies.filter((x) => x.family_id === v.family_id);
          const choices = relatedVocabs.map((x) => ({
            id: x.id,
            text: x.headword,
            pos_code: x.pos_code,
          }));

          // Fill with distractors from family if needed
          if (family && choices.length < 4) {
            family.distractor_forms.slice(0, 4 - choices.length).forEach((d) => {
              choices.push({ id: d, text: d, pos_code: 'noun' as any });
            });
          }

          // Fallback options
          while (choices.length < 4) {
            choices.push({ id: `opt_${choices.length}`, text: `${v.headword}ed`, pos_code: 'verb' as any });
          }

          // Ensure target word is in choices
          if (!choices.some((c) => c.text === sentence.blank_text)) {
            choices[0] = { id: v.id, text: sentence.blank_text, pos_code: v.pos_code };
          }

          // Shuffle
          options = choices.sort(() => Math.random() - 0.5);
        }

        questions.push({
          id: `q_${sessionId}_${idx + 1}`,
          session_id: sessionId,
          question_no: idx + 1,
          vocab_id: v.id,
          question_type: isPosForm ? '2B' : '2A',
          skill_code: skillCode,
          payload: {
            prompt: sentence.sentence_template,
            full_sentence: sentence.sentence_text,
            blank_text: sentence.blank_text,
            translation: sentence.translation_vi,
            options,
            correct_answer: sentence.blank_text,
            slot_pattern: sentence.slot_pattern,
            explanation_refs: {
              grammar_note: sentence.grammar_note,
              distractor_reasons: distractorReasons,
              meaning: v.meaning_vi,
            },
          },
        });
      });
    } else if (params.gameCode === 'sentence_builder') {
      // 10 sentence construction questions
      packVocabs.forEach((v, idx) => {
        const sentence = v.sentences?.[0] || {
          sentence_text: `She usually goes to work by bus.`,
          chunks: ['She', 'usually', 'goes to work', 'by bus.'],
          grammar_note: 'Trạng từ tần suất đứng trước động từ thường.',
          translation_vi: 'Cô ấy thường đi làm bằng xe buýt.',
          word_order_rule: 'ADV_BEFORE_VERB',
        };

        questions.push({
          id: `q_${sessionId}_${idx + 1}`,
          session_id: sessionId,
          question_no: idx + 1,
          vocab_id: v.id,
          question_type: '8',
          skill_code: 'sentence_use',
          payload: {
            prompt: sentence.translation_vi,
            chunks: [...sentence.chunks].sort(() => Math.random() - 0.5),
            correct_chunks: sentence.chunks,
            correct_answer: sentence.sentence_text,
            explanation_refs: {
              grammar_note: sentence.grammar_note,
              rule_text: sentence.word_order_rule || 'Trật tự câu chuẩn: S + V + O',
              translation: sentence.translation_vi,
            },
          },
        });
      });
    } else if (params.gameCode === 'speed_quiz') {
      // 15 questions: 10 synonym/antonym/meaning (3A/3C) + 5 quick scramble (3B)
      for (let i = 0; i < 15; i++) {
        const v = packVocabs[i % packVocabs.length];
        const isAntonym = i % 3 === 2 && v.antonyms && v.antonyms.length > 0;
        const isSynonym = i % 3 === 1 && v.synonyms && v.synonyms.length > 0;

        let questionType = '3C';
        let promptText = `Nghĩa của từ "${v.headword}" là gì?`;
        let correctAnswer = v.meaning_vi;

        if (isAntonym) {
          questionType = '3A';
          promptText = `Từ TRÁI NGHĨA với "${v.headword}" (${v.pos_code}) là:`;
          correctAnswer = v.antonyms![0];
        } else if (isSynonym) {
          questionType = '3A';
          promptText = `Từ ĐỒNG NGHĨA với "${v.headword}" (${v.pos_code}) là:`;
          correctAnswer = v.synonyms![0];
        }

        // Generate 4 distractors of SAME POS
        const samePos = data.vocabularies.filter((x) => x.pos_id === v.pos_id && x.id !== v.id);
        const choices = [
          { id: 'correct', text: correctAnswer },
          ...samePos.slice(0, 3).map((x) => ({
            id: x.id,
            text: questionType === '3C' ? x.meaning_vi : x.headword,
          })),
        ].sort(() => Math.random() - 0.5);

        questions.push({
          id: `q_${sessionId}_${i + 1}`,
          session_id: sessionId,
          question_no: i + 1,
          vocab_id: v.id,
          question_type: questionType,
          skill_code: 'meaning_recall',
          payload: {
            prompt: promptText,
            headword: v.headword,
            options: choices,
            correct_answer: correctAnswer,
            explanation_refs: {
              rule_text: `${v.headword} (${v.pos_code}): ${v.meaning_vi}`,
              meaning: v.meaning_vi,
            },
          },
        });
      }
    } else {
      // General fallback / bonus games (word_basket, family_morph, audio_shooter, topic_express)
      packVocabs.forEach((v, idx) => {
        questions.push({
          id: `q_${sessionId}_${idx + 1}`,
          session_id: sessionId,
          question_no: idx + 1,
          vocab_id: v.id,
          question_type: params.gameCode,
          skill_code: 'pos_form',
          payload: {
            prompt: `Phân loại hoặc nhận diện: ${v.headword}`,
            headword: v.headword,
            pos_code: v.pos_code,
            correct_answer: v.pos_code,
            explanation_refs: {
              meaning: v.meaning_vi,
              rule_text: `${v.headword} là ${v.pos_code}.`,
            },
          },
        });
      });
    }

    const session: GameSession = {
      id: sessionId,
      user_id: params.userId,
      pack_id: params.packId,
      game_code: params.gameCode,
      level: params.level,
      round_no: params.roundNo,
      play_mode: params.playMode,
      seed: Math.floor(Math.random() * 100000),
      config_version: 2,
      config: {
        hearts: params.playMode === 'learning' ? 999 : params.gameCode === 'speed_quiz' ? 3 : 5,
        time_limit_ms: params.playMode === 'learning' ? 0 : 25000,
        base_score: 100,
      },
      started_at: new Date().toISOString(),
      score: 0,
      max_combo: 0,
      accuracy: 0,
      hearts_left: params.playMode === 'learning' ? 999 : params.gameCode === 'speed_quiz' ? 3 : 5,
      stars: 0,
      xp_earned: 0,
      coins_earned: 0,
      is_repeat: false,
      integrity_status: 'ok',
      questions,
    };

    data.sessions[sessionId] = session;
    this.save();
    return session;
  }

  // --- Complete Session & Run Server SRS Calculation (Section 1.2, 4.5, 8.7) ---
  public completeSession(sessionId: string, payload: {
    duration_ms: number;
    events: {
      client_event_id: string;
      question_id: string;
      user_answer: string;
      attempt_no: number;
      response_ms: number;
      hint_used: boolean;
    }[];
  }): {
    session: GameSession;
    streak: { current: number; extended_today: boolean };
    wrong_words: { vocab_id: string; headword: string; error_category: ErrorCategory; next_review_at: string }[];
    level_up: boolean;
    next?: { level: number; round_no: number; game_code: GameCode } | null;
  } {
    const data = this.get();
    const session = data.sessions[sessionId];
    if (!session) throw new Error('Session not found');

    // Lỗi 4: Idempotency check - if already rewarded/completed, return existing result without re-awarding
    if (session.rewarded_at && session.completed_result) {
      return session.completed_result;
    }

    // Lỗi 9: Chỉ giữ các event thuộc về session.questions, loại bỏ event lạ
    const validQuestionIds = new Set(session.questions.map((q) => q.id));

    // Khử trùng lặp theo client_event_id (hoặc cặp question_id + attempt_no)
    const allEventsMap = new Map<string, any>();
    const registerEvent = (e: any) => {
      if (!e || !e.question_id || !validQuestionIds.has(e.question_id)) {
        return; // Bỏ qua/từ chối event ngoài danh sách câu
      }
      const eventKey = e.client_event_id || `${e.question_id}_att_${e.attempt_no || 1}`;
      if (!allEventsMap.has(eventKey)) {
        allEventsMap.set(eventKey, {
          client_event_id: e.client_event_id || eventKey,
          question_id: e.question_id,
          user_answer: String(e.user_answer ?? ''),
          attempt_no: Number(e.attempt_no || 1),
          response_ms: Number(e.response_ms || 0),
          hint_used: Boolean(e.hint_used),
        });
      }
    };

    (session.logged_events || []).forEach(registerEvent);
    (payload.events || []).forEach(registerEvent);
    const mergedEvents = Array.from(allEventsMap.values());

    // Lỗi 10: Gom tất cả event theo question_id
    const eventsByQuestion = new Map<string, any[]>();
    mergedEvents.forEach((ev) => {
      const list = eventsByQuestion.get(ev.question_id) || [];
      list.push(ev);
      eventsByQuestion.set(ev.question_id, list);
    });

    const isAnswerCorrect = (userAns: string, q: SessionQuestion): boolean => {
      if (!userAns) return false;
      const clean = userAns.trim().toLowerCase();
      const target = (q.payload.correct_answer || '').trim().toLowerCase();
      if (clean === target) return true;
      if (q.payload.accepted_answers && Array.isArray(q.payload.accepted_answers)) {
        return q.payload.accepted_answers.some(
          (a: string) => a.trim().toLowerCase() === clean
        );
      }
      return false;
    };

    const user = data.user;
    let totalScore = 0;
    let combo = 0;
    let maxCombo = 0;
    let firstTryCorrectCount = 0;
    let hearts = session.config.hearts;
    const wrongWordsMap: Map<string, ErrorCategory> = new Map();
    const vocabResults: Map<string, { q: number; isCorrect: boolean; skill: SkillCode }> = new Map();

    session.questions.forEach((q) => {
      const qEventsRaw = eventsByQuestion.get(q.id);
      const vocab = data.vocabularies.find((v) => v.id === q.vocab_id);
      if (!qEventsRaw || qEventsRaw.length === 0) {
        return;
      }

      // Lỗi 10: Khử trùng lặp theo attempt_no và sắp xếp theo thứ tự lần thử
      const attemptMap = new Map<number, any>();
      qEventsRaw.forEach((ev) => {
        const att = ev.attempt_no || 1;
        if (!attemptMap.has(att)) {
          attemptMap.set(att, ev);
        }
      });
      const sortedAttempts = Array.from(attemptMap.values()).sort(
        (a, b) => (a.attempt_no || 1) - (b.attempt_no || 1)
      );

      // Đánh giá lần thử đầu tiên (attempt_no === 1) cho accuracy
      const firstAttempt = sortedAttempts.find((a) => (a.attempt_no || 1) === 1) || sortedAttempts[0];
      const isFirstTryCorrect = Boolean(firstAttempt && isAnswerCorrect(firstAttempt.user_answer, q));

      if (isFirstTryCorrect && !firstAttempt.hint_used) {
        firstTryCorrectCount++;
      }

      // Đánh giá tất cả lần thử để tìm kết quả cuối cùng & chất lượng q của câu này:
      // - Đúng ngay lần đầu (attempt_no === 1, không hint): q = (sentence_use/spelling ? 5 : 4)
      // - Đúng sau lần đầu (attempt_no >= 2) hoặc có dùng hint: q = 3
      // - Sai toàn bộ: q = 1
      const correctAttempt = sortedAttempts.find((a) => isAnswerCorrect(a.user_answer, q));
      const isQuestionSolved = Boolean(correctAttempt);

      let qRating = 1;
      let errorCategory: ErrorCategory = 'meaning';

      if (isQuestionSolved) {
        if (isFirstTryCorrect && !firstAttempt.hint_used) {
          qRating = (q.skill_code === 'sentence_use' || q.skill_code === 'spelling') ? 5 : 4;
        } else {
          // Lỗi 10: Đúng sau lần thử đầu hoặc có dùng hint nhận q = 3
          qRating = 3;
        }

        combo++;
        if (combo > maxCombo) maxCombo = combo;

        // Score calculation with combo multiplier capped at 4.0
        const mult = Math.min(3.0, 1 + 0.5 * Math.floor(combo / 3));
        const multTotal = Math.min(4.0, mult);
        const base = session.config.base_score || 100;
        const speedBonus = correctAttempt.response_ms > 0 ? Math.max(0, 1.2 - correctAttempt.response_ms / 15000) : 1;
        totalScore += Math.round(base * speedBonus * multTotal);
      } else {
        combo = 0;
        if (q.skill_code === 'pos_form') errorCategory = 'pos';
        else if (q.skill_code === 'spelling') errorCategory = 'spelling';
        else if (q.skill_code === 'sentence_use') errorCategory = 'word_order';
        else if (q.skill_code === 'listening') errorCategory = 'listening';
        else errorCategory = 'meaning';

        wrongWordsMap.set(q.vocab_id, errorCategory);
      }

      // Trừ tim trong Adventure: mỗi lần thử sai trừ 1 tim
      if (session.play_mode === 'adventure') {
        const wrongAttemptsCount = sortedAttempts.filter((a) => !isAnswerCorrect(a.user_answer, q)).length;
        hearts -= wrongAttemptsCount;
      }

      if (session.play_mode === 'learning') {
        qRating = Math.min(4, qRating);
      }

      // Lỗi 5 & 10: Cập nhật SRS một lần mỗi từ với q thấp nhất trong phiên
      const existing = vocabResults.get(q.vocab_id);
      if (!existing) {
        vocabResults.set(q.vocab_id, {
          q: qRating,
          isCorrect: isQuestionSolved,
          skill: q.skill_code,
        });
      } else {
        vocabResults.set(q.vocab_id, {
          q: Math.min(existing.q, qRating),
          isCorrect: existing.isCorrect && isQuestionSolved,
          skill: q.skill_code,
        });
      }

      // Update skill stats
      if (!data.skillStats[user.id]) data.skillStats[user.id] = {};
      const skillKey = `${q.vocab_id}_${q.skill_code}`;
      const stat = data.skillStats[user.id][skillKey] || {
        user_id: user.id,
        vocab_id: q.vocab_id,
        skill_code: q.skill_code,
        attempts: 0,
        correct: 0,
      };
      stat.attempts += sortedAttempts.length;
      if (isQuestionSolved) {
        stat.correct++;
        stat.last_correct_at = new Date().toISOString();
      }
      data.skillStats[user.id][skillKey] = stat;

      // Update POS stats
      if (vocab) {
        if (!data.posStats[user.id]) data.posStats[user.id] = {};
        const posStat = data.posStats[user.id][vocab.pos_id] || {
          user_id: user.id,
          pos_id: vocab.pos_id,
          pos_code: vocab.pos_code,
          attempts: 0,
          errors: 0,
          ewma_error: 0.2,
        };
        posStat.attempts += sortedAttempts.length;
        if (!isQuestionSolved) posStat.errors++;
        posStat.ewma_error = 0.8 * posStat.ewma_error + 0.2 * (isQuestionSolved ? 0 : 1);
        data.posStats[user.id][vocab.pos_id] = posStat;
      }
    });

    // Lỗi 9: Khử trùng lặp theo câu, đếm số question_id DUY NHẤT có kết quả
    const answeredQuestionIds = new Set(
      session.questions
        .filter((q) => {
          const list = eventsByQuestion.get(q.id);
          return list && list.length > 0;
        })
        .map((q) => q.id)
    );
    const hasAnsweredAllQuestions =
      session.questions.length > 0 &&
      session.questions.every((q) => answeredQuestionIds.has(q.id));

    const totalQuestions = session.questions.length || 1;
    const accuracy = Math.round((firstTryCorrectCount / totalQuestions) * 100);

    // Lỗi 3 & 9: Ngưỡng qua màn riêng cho từng game theo bảng cấu hình 8.8
    const accuracyThresholds: Record<GameCode, number> = {
      flip_card: 60,
      fill_blank: 70,
      sentence_builder: 70,
      speed_quiz: 70,
      word_basket: 70,
      family_morph: 70,
      audio_shooter: 66,
      topic_express: 75,
    };
    const requiredAccuracy = accuracyThresholds[session.game_code] ?? 70;

    // Lỗi 9: Chế độ Learning: CHỈ HOÀN TẤT KHI ĐÃ CÓ KẾT QUẢ CHO ĐỦ TỪNG question_id trong session
    const isWin = session.play_mode === 'learning'
      ? hasAnsweredAllQuestions
      : hearts > 0 && accuracy >= requiredAccuracy && hasAnsweredAllQuestions;

    // Stars (chỉ cấp trong Adventure khi thắng)
    let stars = 0;
    if (isWin && session.play_mode === 'adventure') {
      if (accuracy >= 90) stars = 3;
      else if (accuracy >= 75) stars = 2;
      else stars = 1;
    }

    // XP and Coins
    let xpEarned = Math.round(totalScore / 20) + 25 * stars;
    let coinsEarned = 5 * stars + Math.floor(maxCombo / 3);
    if (session.play_mode === 'learning' || session.is_repeat) {
      xpEarned = Math.round(xpEarned * 0.5);
      coinsEarned = Math.round(coinsEarned * 0.5);
    }

    // Update session
    session.finished_at = new Date().toISOString();
    session.duration_ms = payload.duration_ms;
    session.score = totalScore;
    session.max_combo = maxCombo;
    session.accuracy = accuracy;
    session.hearts_left = Math.max(0, hearts);
    session.stars = stars;
    session.result = isWin ? 'win' : 'lose';
    session.xp_earned = xpEarned;
    session.coins_earned = coinsEarned;

    // Update SRS Progress for each vocab in session (một lần cho mỗi từ)
    if (!data.wordProgress[user.id]) data.wordProgress[user.id] = {};
    const wrongWordsList: { vocab_id: string; headword: string; error_category: ErrorCategory; next_review_at: string }[] = [];

    vocabResults.forEach((res, vocabId) => {
      const vocab = data.vocabularies.find((v) => v.id === vocabId);
      if (!vocab) return;

      const p: UserWordProgress = data.wordProgress[user.id][vocabId] || {
        user_id: user.id,
        vocab_id: vocabId,
        status: 'new',
        repetition: 0,
        ease_factor: 2.5,
        interval_days: 0,
        next_review_at: new Date().toISOString(),
        last_quality: res.q,
        correct_count: 0,
        wrong_count: 0,
        lapse_count: 0,
        correct_streak: 0,
        best_level_passed: session.level,
        in_notebook: false,
        first_seen_at: new Date().toISOString(),
      };

      p.last_quality = res.q;
      p.last_reviewed_at = new Date().toISOString();

      if (res.q < 3) {
        // Lapse
        p.repetition = 0;
        p.lapse_count++;
        p.correct_streak = 0;
        p.wrong_count++;
        p.next_review_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
        p.in_notebook = true;
        p.notebook_added_at = new Date().toISOString();

        wrongWordsList.push({
          vocab_id: vocabId,
          headword: vocab.headword,
          error_category: wrongWordsMap.get(vocabId) || 'meaning',
          next_review_at: p.next_review_at,
        });
      } else {
        // Correct recall
        p.repetition++;
        p.correct_streak++;
        p.correct_count++;
        let interval = 1;
        if (p.repetition === 1) interval = 1;
        else if (p.repetition === 2) interval = 3;
        else interval = Math.round(p.interval_days * p.ease_factor);

        p.interval_days = interval;
        p.next_review_at = new Date(Date.now() + interval * 86400000).toISOString();

        if (p.correct_streak >= 2) {
          p.in_notebook = false;
        }
      }

      // Ease factor update
      p.ease_factor = Math.max(
        1.3,
        Number((p.ease_factor + 0.1 - (5 - res.q) * (0.08 + (5 - res.q) * 0.02)).toFixed(2))
      );

      // Check mastered_v2 criteria (Section 8.4)
      const hasMeaning = (data.skillStats[user.id]?.[`${vocabId}_meaning_recall`]?.correct || 0) > 0 ||
        (data.skillStats[user.id]?.[`${vocabId}_recognition`]?.correct || 0) > 0;
      const hasUsage = (data.skillStats[user.id]?.[`${vocabId}_pos_form`]?.correct || 0) > 0 ||
        (data.skillStats[user.id]?.[`${vocabId}_sentence_use`]?.correct || 0) > 0 ||
        (data.skillStats[user.id]?.[`${vocabId}_spelling`]?.correct || 0) > 0;

      if (p.repetition >= 4 && p.interval_days >= 21 && hasMeaning && hasUsage) {
        p.status = 'mastered';
      } else if (p.repetition >= 1) {
        p.status = 'reviewing';
      } else {
        p.status = 'learning';
      }

      data.wordProgress[user.id][vocabId] = p;
    });

    // Update user stats
    const oldLevel = user.level;
    user.xp += xpEarned;
    user.coins += coinsEarned;
    // XP to next level: round(100 * L^1.5)
    const nextLevelXP = Math.round(100 * Math.pow(user.level, 1.5));
    let levelUp = false;
    if (user.xp >= nextLevelXP) {
      user.level += 1;
      levelUp = true;
    }

    // Streak update
    const today = new Date().toISOString().slice(0, 10);
    let extendedToday = false;
    if (user.last_active_date !== today) {
      user.streak_current += 1;
      if (user.streak_current > user.streak_longest) {
        user.streak_longest = user.streak_current;
      }
      user.last_active_date = today;
      extendedToday = true;
    }

    // Update daily quests
    const quests = data.dailyQuests[user.id] || [];
    quests.forEach((q) => {
      if (q.quest_code === 'combo_x2' && maxCombo >= 6) {
        q.progress = Math.min(q.target, q.progress + 1);
      }
      if (q.quest_code === 'complete_pack' && isWin && session.level === 3) {
        q.progress = Math.min(q.target, q.progress + 1);
      }
    });

    // Lỗi 2: Tiến trạng thái pack theo cặp level/round dựa trên pack.levels
    const pack = data.studyPacks[session.pack_id];
    let nextInfo: { level: number; round_no: number; game_code: GameCode } | null = null;

    if (pack && isWin) {
      const currentLevelConfig = pack.levels.find((l) => l.level === session.level);
      const currentRoundNo = session.round_no || 1;
      const hasNextRoundInLevel =
        currentLevelConfig && currentLevelConfig.rounds.some((r) => r.round_no === currentRoundNo + 1);

      if (hasNextRoundInLevel) {
        // Vẫn ở level hiện tại (ví dụ L2), chuyển tiếp sang Round 2 (sentence_builder)
        pack.current_level = session.level;
        pack.current_round = currentRoundNo + 1;
        const nextRoundConfig = currentLevelConfig.rounds.find((r) => r.round_no === currentRoundNo + 1)!;
        nextInfo = {
          level: session.level,
          round_no: nextRoundConfig.round_no,
          game_code: nextRoundConfig.game_code,
        };
      } else {
        // Đã hoàn thành mọi round của level này, chuyển sang level tiếp theo
        const nextLevelConfig = pack.levels.find((l) => l.level === session.level + 1);
        if (nextLevelConfig) {
          pack.current_level = session.level + 1;
          pack.current_round = 1;
          const firstRound = nextLevelConfig.rounds[0];
          nextInfo = {
            level: nextLevelConfig.level,
            round_no: firstRound.round_no,
            game_code: firstRound.game_code,
          };
        } else {
          // Hoàn thành trọn vẹn cả 3 level của pack!
          pack.status = 'completed';
          pack.completed_at = new Date().toISOString();
          nextInfo = null;
        }
      }
    }

    // Lỗi 4: Lưu kết quả đã hoàn tất và mốc rewarded_at để đảm bảo idempotent
    session.rewarded_at = new Date().toISOString();
    const finalResult = {
      session,
      streak: { current: user.streak_current, extended_today: extendedToday },
      wrong_words: wrongWordsList,
      level_up: levelUp,
      next: nextInfo,
    };
    session.completed_result = finalResult;

    this.save();
    return finalResult;
  }

  // --- Review Queue Helper ---
  public getReviewQueue(userId: string): { due: Vocabulary[]; notebook: Vocabulary[] } {
    const data = this.get();
    const userProgress = data.wordProgress[userId] || {};
    const now = new Date();

    const due: Vocabulary[] = [];
    const notebook: Vocabulary[] = [];

    data.vocabularies.forEach((v) => {
      const p = userProgress[v.id];
      if (!p) return;
      if (p.in_notebook) {
        notebook.push(v);
      } else if (p.status !== 'new' && new Date(p.next_review_at) <= now) {
        due.push(v);
      }
    });

    return { due, notebook };
  }
}

export const dbStore = new StoreManager();
