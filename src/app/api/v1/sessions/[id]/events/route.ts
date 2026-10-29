import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { AnswerEvent } from '@/types';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    const data = dbStore.get();
    const session = data.sessions[params.id];

    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }

    if (session.rewarded_at) {
      return NextResponse.json(
        { error: { code: 'ALREADY_COMPLETED', message: 'Session has already been rewarded' } },
        { status: 400 }
      );
    }

    if (!session.logged_events) {
      session.logged_events = [];
    }

    const events = body.events || [];
    let accepted = 0;
    let duplicates = 0;
    const rejected: any[] = [];

    // Track existing client_event_id for uniqueness & idempotency
    const seenEventIds = new Set(session.logged_events.map((e) => e.client_event_id));

    events.forEach((ev: any) => {
      const clientEventId = ev.client_event_id || `ev_${ev.question_id}_${ev.attempt_no || 1}`;

      // Check unique constraint: idempotent handling for duplicate client_event_id
      if (seenEventIds.has(clientEventId)) {
        duplicates++;
        return;
      }

      // Validate question belongs to session
      const q = session.questions.find((quest) => quest.id === ev.question_id);
      if (!q) {
        rejected.push({ client_event_id: clientEventId, reason: 'question_not_in_session' });
        return;
      }

      const responseMs = Number(ev.response_ms || 0);

      // Anti-cheat validation (Section 8.7 & Lỗi 6):
      // 1. Minimum hard boundary: response_ms >= 250ms
      // 2. Minimum reading threshold based on question sentence/prompt length
      const promptText = (q.payload?.prompt || q.payload?.sentence_text || q.payload?.headword || '') as string;
      const wordCount = promptText.trim().split(/\s+/).filter(Boolean).length;
      const minReadingMs = Math.max(250, Math.min(1200, wordCount * 50));

      if (session.play_mode === 'adventure') {
        if (responseMs < 250) {
          rejected.push({
            client_event_id: clientEventId,
            reason: 'too_fast_absolute',
            response_ms: responseMs,
            min_required_ms: 250,
          });
          return;
        }

        if (responseMs < minReadingMs) {
          rejected.push({
            client_event_id: clientEventId,
            reason: 'reading_too_fast',
            response_ms: responseMs,
            min_required_ms: minReadingMs,
          });
          return;
        }
      }

      // Valid event: persist to session log
      const loggedEvent: AnswerEvent = {
        client_event_id: clientEventId,
        question_id: ev.question_id,
        user_answer: String(ev.user_answer ?? ''),
        attempt_no: Number(ev.attempt_no || 1),
        response_ms: responseMs,
        hint_used: Boolean(ev.hint_used),
      };

      session.logged_events!.push(loggedEvent);
      seenEventIds.add(clientEventId);
      accepted++;
    });

    dbStore.save();

    return NextResponse.json({ accepted, duplicates, rejected }, { status: 202 });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 400 });
  }
}
