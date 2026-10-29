import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET() {
  const data = dbStore.get();
  const userPath = data.userPaths[data.user.id] || {
    path_id: 2,
    current_step: 2,
    step_progress: 1,
  };

  const path = data.learningPaths.find((p) => p.id === userPath.path_id) || data.learningPaths[0];
  const step = path.steps.find((s) => s.step_no === userPath.current_step) || path.steps[0];

  return NextResponse.json({
    path,
    step,
    step_progress: userPath.step_progress,
    suggested_pack: {
      source_type: step.family_id ? 'family' : step.pos_id ? 'pos' : 'topic',
      topic_ids: [step.topic_id],
      pos_ids: step.pos_id ? [step.pos_id] : undefined,
      family_id: step.family_id || undefined,
      path_step_id: step.id,
    },
  });
}
