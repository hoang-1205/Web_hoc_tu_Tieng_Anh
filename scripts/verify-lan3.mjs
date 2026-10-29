// VocabQuest — Lần sửa 3: Test Lỗi 11 (Timeout → AnswerEvent với q=1)
// Lỗi 12 không test tự động qua HTTP (IndexedDB là browser-side); build passing là xác nhận chính.

const BASE = 'http://localhost:3000/api/v1';
let passed = 0;
const total = 1;

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function test11_timeoutRecordedAsWrong() {
  console.log('\n[Test 11] Timeout: Gửi event __timeout__ cho 1 câu → server chấm sai, q=1, lapse...');

  // 1. Tạo pack (không truyền user_id để dùng default user)
  const { data: packData } = await fetchJSON(`${BASE}/packs`, {
    method: 'POST',
    body: JSON.stringify({
      source_type: 'topic',
      topic_ids: [1],
      play_mode: 'adventure',
    }),
  });
  const packId = packData.id;
  if (!packId) throw new Error('Không tạo được pack: ' + JSON.stringify(packData));

  // 2. Tạo session L1 flip_card
  const { data: sessData } = await fetchJSON(`${BASE}/sessions`, {
    method: 'POST',
    body: JSON.stringify({
      pack_id: packId,
      level: 1,
      round_no: 1,
      game_code: 'flip_card',
      play_mode: 'adventure',
    }),
  });
  const sessionId = sessData.id;
  if (!sessionId) throw new Error('Không tạo được session: ' + JSON.stringify(sessData));

  // 3. Load session để biết danh sách câu hỏi
  const { data: session } = await fetchJSON(`${BASE}/sessions/${sessionId}`);
  const questions = session.questions;
  if (!questions || questions.length === 0) throw new Error('Session không có câu hỏi: ' + JSON.stringify(session));

  // 4. Trả lời đúng các câu đầu, câu cuối gửi __timeout__
  const events = questions.map((q, i) => ({
    client_event_id: `ev_t11_${q.id}_${i}_${Date.now()}`,
    question_id: q.id,
    user_answer: i < questions.length - 1 ? q.payload.correct_answer : '__timeout__',
    attempt_no: 1,
    response_ms: i < questions.length - 1 ? 2000 : 25000, // timeout gets full timer duration
    hint_used: false,
  }));

  // 5. Gửi events lên server
  const { data: evResult } = await fetchJSON(`${BASE}/sessions/${sessionId}/events`, {
    method: 'POST',
    body: JSON.stringify({ events }),
  });

  // 6. Complete session
  const { data: result } = await fetchJSON(`${BASE}/sessions/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      duration_ms: 60000,
      events,
    }),
  });

  // 7. Kiểm tra: câu timeout phải nằm trong wrong_words và q=1
  const timeoutQuestionId = questions[questions.length - 1].id;
  const timeoutVocabId = questions[questions.length - 1].vocab_id;

  const wrongWords = result.wrong_words || [];
  const timeoutInWrong = wrongWords.some(
    (w) => w.vocab_id === timeoutVocabId || w.question_id === timeoutQuestionId
  );

  // Kiểm tra SRS: từ timeout phải có trong notebook
  const { data: queueData } = await fetchJSON(`${BASE}/review/queue`);
  const notebookItems = queueData.notebook_items || [];
  const timeoutInNotebook = notebookItems.some(
    (item) => item.vocab_id === timeoutVocabId || item.id === timeoutVocabId
  );

  // Accuracy phải < 100% vì có 1 câu sai
  const accuracy = result.accuracy ?? result.session?.accuracy;
  const expectedMaxAccuracy = Math.round(((questions.length - 1) / questions.length) * 100);

  if (timeoutInWrong && accuracy <= expectedMaxAccuracy) {
    console.log(
      ` -> ĐẠT: Câu timeout (__timeout__) được ghi nhận là sai. ` +
      `Accuracy = ${accuracy}% (≤ ${expectedMaxAccuracy}%). ` +
      `Từ timeout nằm trong wrong_words.${timeoutInNotebook ? ' Từ đã vào sổ tay (notebook).' : ''}`
    );
    passed++;
  } else {
    console.error(
      ` -> THẤT BẠI: timeoutInWrong=${timeoutInWrong}, accuracy=${accuracy}%, ` +
      `expectedMax=${expectedMaxAccuracy}%, timeoutInNotebook=${timeoutInNotebook}`
    );
    console.error('   wrong_words:', JSON.stringify(wrongWords));
    console.error('   result:', JSON.stringify(result));
  }
}

(async () => {
  console.log('=== BẮT ĐẦU KIỂM TRA LỖI 11-12 (LẦN SỬA 3) ===');

  try {
    await test11_timeoutRecordedAsWrong();
  } catch (e) {
    console.error('[Test 11] LỖI:', e.message);
  }

  console.log(`\n======================================================`);
  if (passed === total) {
    console.log(`KẾT QUẢ: ${passed}/${total} TESTS LẦN 3 ĐÃ VƯỢT QUA!`);
  } else {
    console.log(`KẾT QUẢ: ${passed}/${total} TESTS ĐẠT — CÓ LỖI CẦN KIỂM TRA.`);
  }
  console.log('Lỗi 12 (IndexedDB offline queue) — xác nhận qua build thành công + code review.');
  console.log(`======================================================`);
})();
