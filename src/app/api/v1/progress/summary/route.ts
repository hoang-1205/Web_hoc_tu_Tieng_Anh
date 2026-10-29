import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET() {
  const data = dbStore.get();
  const userProgress = data.wordProgress[data.user.id] || {};
  const posStats = data.posStats[data.user.id] || {};

  let masteredCount = 0;
  let learningCount = 0;
  let reviewingCount = 0;

  Object.values(userProgress).forEach((p) => {
    if (p.status === 'mastered') masteredCount++;
    else if (p.status === 'reviewing') reviewingCount++;
    else if (p.status === 'learning') learningCount++;
  });

  const byPos = data.partsOfSpeech.map((pos) => {
    const stat = posStats[pos.id] || { attempts: 0, errors: 0, ewma_error: 0 };
    const accuracy = stat.attempts > 0 ? Math.round(((stat.attempts - stat.errors) / stat.attempts) * 100) : 85;
    return {
      pos_id: pos.id,
      code: pos.code,
      name_vi: pos.name_vi,
      color_hex: pos.color_hex,
      accuracy,
      attempts: stat.attempts,
      weak: stat.attempts >= 10 && stat.ewma_error >= 0.35,
    };
  });

  const byTopic = data.topics.map((t) => {
    const topicVocabs = data.vocabularies.filter((v) => v.topic_ids.includes(t.id));
    const masteredInTopic = topicVocabs.filter((v) => userProgress[v.id]?.status === 'mastered').length;
    const progressPct = topicVocabs.length > 0 ? Math.round((masteredInTopic / topicVocabs.length) * 100) : 0;
    return {
      topic_id: t.id,
      slug: t.slug,
      name_vi: t.name_vi,
      progress_pct: Math.max(t.progress_pct || 0, progressPct),
      word_count: topicVocabs.length,
    };
  });

  return NextResponse.json({
    mastered_count: masteredCount,
    learning_count: learningCount,
    reviewing_count: reviewingCount,
    total_words: data.vocabularies.length,
    by_pos: byPos,
    by_topic: byTopic,
  });
}
