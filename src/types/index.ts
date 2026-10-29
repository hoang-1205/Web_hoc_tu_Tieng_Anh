// VocabQuest - Domain Types (Specification v2.0)

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type POSCode = 'noun' | 'verb' | 'adj' | 'adv' | 'phrasal_verb';

export type GameCode = 
  | 'flip_card' 
  | 'fill_blank' 
  | 'speed_quiz' 
  | 'sentence_builder' 
  | 'word_basket' 
  | 'family_morph' 
  | 'audio_shooter' 
  | 'topic_express';

export type PlayMode = 'learning' | 'adventure';

export type WordStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export type SkillCode = 
  | 'meaning_recall' 
  | 'recognition' 
  | 'listening' 
  | 'spelling' 
  | 'pos_form' 
  | 'context_fill' 
  | 'sentence_use';

export type ErrorCategory = 'meaning' | 'pos' | 'spelling' | 'listening' | 'word_order' | 'other';

export interface Topic {
  id: number;
  slug: string;
  name_vi: string;
  name_en: string;
  parent_id?: number | null;
  icon_url: string;
  color_hex: string;
  sort_order: number;
  is_active: boolean;
  word_count?: number;
  progress_pct?: number;
}

export interface PartOfSpeech {
  id: number;
  code: POSCode;
  name_vi: string;
  name_en: string;
  color_hex: string;
  icon_name: 'cube' | 'lightning' | 'star' | 'wind' | 'link';
  short_code: 'N' | 'V' | 'Adj' | 'Adv' | 'PV';
  grammar_summary: string;
}

export interface WordFamily {
  id: number;
  root_word: string;
  cefr_level: CEFRLevel;
  distractor_forms: string[];
  review_status: 'draft' | 'in_review' | 'approved' | 'rejected';
  is_active: boolean;
  members?: { vocab_id: string; headword: string; pos_code: POSCode }[];
}

export interface Vocabulary {
  id: string; // Serialized string for BigInt
  headword: string;
  pos_id: number;
  pos_code: POSCode;
  sense_no: number;
  sense_label?: string;
  family_id?: number | null;
  affix?: string | null;
  affix_breakdown?: { root: string; prefix?: string; suffix?: string; spelling_rule?: string };
  ipa_uk: string;
  ipa_us: string;
  audio_url_uk?: string;
  audio_url_us?: string;
  image_url?: string;
  meaning_vi: string;
  definition_en: string;
  cefr_level: CEFRLevel;
  frequency_rank: number;
  source?: string;
  review_status: 'draft' | 'in_review' | 'approved' | 'rejected';
  is_published: boolean;
  topic_ids: number[];
  synonyms?: string[];
  antonyms?: string[];
  confusables?: string[];
  sentences?: ExampleSentence[];
}

export interface ExampleSentence {
  id: string;
  vocab_id: string;
  sentence_text: string;
  sentence_template: string; // "She made a {{blank}} move."
  blank_text: string; // "decisive"
  slot_pattern: string; // "ADJ_BEFORE_NOUN"
  translation_vi: string;
  chunks: string[]; // ["She", "made", "a", "decisive move"]
  grammar_note: string;
  option_explanations?: Record<string, string>;
  word_order_rule?: string;
  audio_url?: string;
  source: 'static' | 'ai';
  cefr_level: CEFRLevel;
  topic_id?: number;
  is_approved: boolean;
  single_answer_verified: boolean;
}

export interface GrammarTip {
  id: number;
  pos_id: number;
  slot_pattern: string;
  rule_type: 'slot' | 'word_order';
  explanation_vi: string;
  example_en: string;
}

export interface AffixRule {
  id: number;
  affix: string;
  affix_type: 'prefix' | 'suffix';
  result_pos_id: number;
  source_pos_id?: number;
  explanation_vi: string;
  example_en: string;
  exceptions: string[];
  is_hint_only: boolean;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  role: 'learner' | 'editor' | 'admin';
  cefr_level: CEFRLevel;
  xp: number;
  level: number;
  coins: number;
  streak_current: number;
  streak_longest: number;
  streak_freezes: number;
  last_active_date: string;
  timezone: string;
  daily_goal_words: number;
  difficulty_tiers: Record<GameCode, number>;
  onboarded: boolean;
  play_mode: PlayMode;
  created_at: string;
}

export interface StudyPack {
  id: string;
  user_id: string;
  source_type: 'topic' | 'pos' | 'family' | 'review';
  topic_ids?: number[];
  pos_ids?: number[];
  family_id?: number;
  path_step_id?: number | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  current_level: number;
  current_round: number;
  words: {
    vocab_id: string;
    headword: string;
    pos_code: POSCode;
    sense_no: number;
    ipa_uk: string;
    meaning_vi: string;
    audio_url?: string;
    is_review: boolean;
  }[];
  levels: {
    level: number;
    rounds: { round_no: number; game_code: GameCode }[];
  }[];
  completed_at?: string;
}

export interface SessionQuestion {
  id: string;
  session_id: string;
  question_no: number;
  vocab_id: string;
  question_type: string;
  skill_code: SkillCode;
  payload: {
    prompt: string;
    options?: { id: string; text: string; pos_code?: POSCode }[];
    correct_answer: string;
    accepted_answers?: string[];
    explanation_refs?: {
      grammar_note?: string;
      distractor_reasons?: Record<string, string>;
      rule_text?: string;
      meaning?: string;
      translation?: string;
    };
    [key: string]: any;
  };
}

export interface GameSession {
  id: string;
  user_id: string;
  pack_id: string;
  game_code: GameCode;
  level: number;
  round_no: number;
  play_mode: PlayMode;
  seed: number;
  config_version: number;
  config: {
    hearts: number;
    time_limit_ms: number;
    base_score: number;
  };
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  score: number;
  max_combo: number;
  accuracy: number;
  hearts_left: number;
  stars: number;
  result?: 'win' | 'lose' | 'abandoned';
  xp_earned: number;
  coins_earned: number;
  is_repeat: boolean;
  integrity_status: 'ok' | 'unverified' | 'flagged';
  rewarded_at?: string;
  completed_result?: any;
  logged_events?: AnswerEvent[];
  questions: SessionQuestion[];
}

export interface AnswerEvent {
  client_event_id: string;
  question_id: string;
  user_answer: string;
  attempt_no: number;
  response_ms: number;
  hint_used: boolean;
}

export interface UserWordProgress {
  user_id: string;
  vocab_id: string;
  status: WordStatus;
  repetition: number;
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
  last_reviewed_at?: string;
  last_quality: number; // 1 - 5
  correct_count: number;
  wrong_count: number;
  lapse_count: number;
  correct_streak: number;
  best_level_passed: number;
  in_notebook: boolean;
  notebook_added_at?: string;
  first_seen_at: string;
}

export interface UserWordSkillStat {
  user_id: string;
  vocab_id: string;
  skill_code: SkillCode;
  attempts: number;
  correct: number;
  last_correct_at?: string;
}

export interface UserPosStat {
  user_id: string;
  pos_id: number;
  pos_code: POSCode;
  attempts: number;
  errors: number;
  ewma_error: number;
}

export interface LearningPath {
  id: number;
  code: string;
  name_vi: string;
  description_vi: string;
  target_cefr: CEFRLevel;
  goal: 'communication' | 'workplace' | 'exam';
  steps: LearningPathStep[];
}

export interface LearningPathStep {
  id: number;
  path_id: number;
  step_no: number;
  title_vi: string;
  topic_id: number;
  pos_id?: number | null;
  family_id?: number | null;
  skill_focus: SkillCode;
  packs_required: number;
}

export interface UserPath {
  user_id: string;
  path_id: number;
  current_step: number;
  step_progress: number;
  started_at: string;
}

export interface DailyQuest {
  quest_code: 'review_10' | 'combo_x2' | 'complete_pack';
  title_vi: string;
  target: number;
  progress: number;
  reward_coins: number;
  claimed: boolean;
}

export interface Badge {
  id: number;
  code: string;
  name_vi: string;
  description_vi: string;
  icon_name: string;
  criteria: Record<string, any>;
  earned_at?: string | null;
}

export interface ShopItem {
  id: number;
  code: string;
  name_vi: string;
  description_vi: string;
  item_type: 'consumable' | 'cosmetic';
  price_coins: number;
  icon_name: string;
  effect: Record<string, any>;
  owned_quantity?: number;
}
