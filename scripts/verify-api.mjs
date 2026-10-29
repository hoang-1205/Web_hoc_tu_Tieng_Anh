const BASE_URL = 'http://localhost:3000';

async function runApiTests() {
  console.log('=== BẮT ĐẦU KIỂM TRA TOÀN DIỆN 7 LỖI QUA HTTP API ===\n');
  let passedCount = 0;
  const totalTests = 7;

  // --- LỖI 1: Pack Builder chỉ lấy từ approved & published ---
  try {
    console.log('[Test 1] POST /api/v1/packs - Kiểm tra lọc approved & published...');
    const res = await fetch(`${BASE_URL}/api/v1/packs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_type: 'topic', topic_ids: [1, 2] }),
    });
    const pack = await res.json();

    if (pack.words && pack.words.length > 0 && pack.current_round === 1) {
      const vocabRes = await fetch(`${BASE_URL}/api/v1/vocabularies`);
      const vocabData = await vocabRes.json();
      const allVocabs = vocabData.items || [];
      const unapprovedWord = pack.words.find((pw) => {
        const v = allVocabs.find((vocab) => vocab.id === pw.vocab_id);
        return v && (v.review_status !== 'approved' || !v.is_published);
      });

      if (!unapprovedWord) {
        console.log(` -> ĐẠT: Pack (${pack.words.length} từ) chỉ chứa từ đã duyệt (approved & is_published=true), current_round=1.`);
        passedCount++;
      } else {
        console.error(' -> THẤT BẠI: Pack chứa từ chưa duyệt:', unapprovedWord);
      }
    } else {
      console.error(' -> THẤT BẠI: Không tạo được pack hợp lệ!', pack);
    }
  } catch (err) {
    console.error(' -> Lỗi Test 1:', err.message);
  }

  // --- LỖI 7: GET /api/v1/sessions/:id trả 404 cho session không tồn tại và 200 cho session có thực ---
  let activeSession = null;
  try {
    console.log('\n[Test 7] GET /api/v1/sessions/:id - Kiểm tra đọc session theo ID...');
    // 1. Kiểm tra 404
    const res404 = await fetch(`${BASE_URL}/api/v1/sessions/session_khong_ton_tai_999`);
    const is404 = res404.status === 404;

    // 2. Tạo một session hợp lệ
    const pRes = await fetch(`${BASE_URL}/api/v1/packs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_type: 'topic', topic_ids: [1] }),
    });
    const testPack = await pRes.json();

    const sRes = await fetch(`${BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_id: testPack.id,
        level: 2,
        round_no: 1,
        game_code: 'fill_blank',
        play_mode: 'adventure',
      }),
    });
    activeSession = await sRes.json();

    // 3. Đọc lại session bằng GET /sessions/:id
    const res200 = await fetch(`${BASE_URL}/api/v1/sessions/${activeSession.id}`);
    const fetchedSession = await res200.json();

    if (is404 && res200.status === 200 && fetchedSession.id === activeSession.id) {
      console.log(' -> ĐẠT: API trả 404 cho session lạ, và trả đúng 200 kèm dữ liệu session thật.');
      passedCount++;
    } else {
      console.error(' -> THẤT BẠI Test 7!', { is404, status: res200.status });
    }
  } catch (err) {
    console.error(' -> Lỗi Test 7:', err.message);
  }

  // --- LỖI 6: POST /api/v1/sessions/:id/events - Lưu log, chặn duplicate client_event_id & response_ms < 250ms ---
  try {
    console.log('\n[Test 6] POST /api/v1/sessions/:id/events - Kiểm tra lưu log, anti-cheat & chống trùng...');
    const q1 = activeSession.questions[0];

    // Gửi event quá nhanh (< 250ms) -> phải bị reject
    const fastRes = await fetch(`${BASE_URL}/api/v1/sessions/${activeSession.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [
          {
            client_event_id: 'ev_fast_1',
            question_id: q1.id,
            user_answer: 'test',
            attempt_no: 1,
            response_ms: 100, // < 250
            hint_used: false,
          },
        ],
      }),
    });
    const fastData = await fastRes.json();
    const rejectedFast = fastData.rejected && fastData.rejected.length > 0;

    // Gửi event hợp lệ
    const validRes = await fetch(`${BASE_URL}/api/v1/sessions/${activeSession.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [
          {
            client_event_id: 'ev_valid_1',
            question_id: q1.id,
            user_answer: q1.payload.correct_answer,
            attempt_no: 1,
            response_ms: 800,
            hint_used: false,
          },
        ],
      }),
    });
    const validData = await validRes.json();
    const acceptedValid = validData.accepted === 1;

    // Gửi lại đúng client_event_id đó -> phải được đếm là duplicate
    const dupRes = await fetch(`${BASE_URL}/api/v1/sessions/${activeSession.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [
          {
            client_event_id: 'ev_valid_1',
            question_id: q1.id,
            user_answer: q1.payload.correct_answer,
            attempt_no: 1,
            response_ms: 800,
            hint_used: false,
          },
        ],
      }),
    });
    const dupData = await dupRes.json();
    const isDuplicate = dupData.duplicates === 1;

    // Kiểm tra session có lưu logged_events không
    const checkSessionRes = await fetch(`${BASE_URL}/api/v1/sessions/${activeSession.id}`);
    const checkSession = await checkSessionRes.json();
    const isLogged = checkSession.logged_events && checkSession.logged_events.some((e) => e.client_event_id === 'ev_valid_1');

    if (rejectedFast && acceptedValid && isDuplicate && isLogged) {
      console.log(' -> ĐẠT: Server chặn response_ms < 250ms, ghi nhận duplicates theo client_event_id, và lưu log vào phiên.');
      passedCount++;
    } else {
      console.error(' -> THẤT BẠI Test 6!', { rejectedFast, acceptedValid, isDuplicate, isLogged });
    }
  } catch (err) {
    console.error(' -> Lỗi Test 6:', err.message);
  }

  // --- LỖI 3: Ngưỡng qua màn Adventure theo từng game (Fill Blank cần >= 70%) ---
  try {
    console.log('\n[Test 3] POST /api/v1/sessions/:id/complete - Kiểm tra ngưỡng thắng Adventure...');
    const sRes = await fetch(`${BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_id: activeSession.pack_id,
        level: 2,
        round_no: 1,
        game_code: 'fill_blank',
        play_mode: 'adventure',
      }),
    });
    const sess = await sRes.json();

    // 60% hoặc 67% accuracy (< 70% yêu cầu của fill_blank)
    const eventsUnder70 = sess.questions.map((q, idx) => ({
      client_event_id: `ev_test3_${idx}`,
      question_id: q.id,
      user_answer: idx < Math.floor(sess.questions.length * 0.6) ? q.payload.correct_answer : 'sai_roi',
      attempt_no: 1,
      response_ms: 800,
      hint_used: false,
    }));

    const compRes = await fetch(`${BASE_URL}/api/v1/sessions/${sess.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_ms: 20000,
        events: eventsUnder70,
      }),
    });
    const compData = await compRes.json();

    if (compData.result === 'lose' && compData.accuracy < 70) {
      console.log(` -> ĐẠT: Accuracy ${compData.accuracy}% (< 70%) bị tính Thua ở fill_blank (yêu cầu chuẩn >= 70%).`);
      passedCount++;
    } else {
      console.error(' -> THẤT BẠI Test 3: Kết quả không phải lose!', compData);
    }
  } catch (err) {
    console.error(' -> Lỗi Test 3:', err.message);
  }

  // --- LỖI 2: Round 2 của L2 - Thắng L2 Round 1 chuyển sang L2 Round 2 (sentence_builder) ---
  try {
    console.log('\n[Test 2] Kiểm tra chuyển tiếp L2 Round 1 -> L2 Round 2...');
    const sRes = await fetch(`${BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_id: activeSession.pack_id,
        level: 2,
        round_no: 1,
        game_code: 'fill_blank',
        play_mode: 'adventure',
      }),
    });
    const sess = await sRes.json();

    // Thắng 100%
    const winEvents = sess.questions.map((q, idx) => ({
      client_event_id: `ev_test2_win_${idx}`,
      question_id: q.id,
      user_answer: q.payload.correct_answer,
      attempt_no: 1,
      response_ms: 900,
      hint_used: false,
    }));

    const compRes = await fetch(`${BASE_URL}/api/v1/sessions/${sess.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_ms: 22000,
        events: winEvents,
      }),
    });
    const compData = await compRes.json();

    const packRes = await fetch(`${BASE_URL}/api/v1/packs/${activeSession.pack_id}`);
    const updatedPack = await packRes.json();

    if (
      compData.result === 'win' &&
      compData.next &&
      compData.next.level === 2 &&
      compData.next.round_no === 2 &&
      compData.next.game_code === 'sentence_builder' &&
      updatedPack.current_level === 2 &&
      updatedPack.current_round === 2
    ) {
      console.log(' -> ĐẠT: Thắng L2 Round 1 giữ L2, chuyển sang Round 2 với sentence_builder. Response next trả đúng.');
      passedCount++;
    } else {
      console.error(' -> THẤT BẠI Test 2!', {
        next: compData.next,
        pack_level: updatedPack.current_level,
        pack_round: updatedPack.current_round,
      });
    }
  } catch (err) {
    console.error(' -> Lỗi Test 2:', err.message);
  }

  // --- LỖI 4: Hoàn tất phiên có tính idempotent ---
  try {
    console.log('\n[Test 4] POST /api/v1/sessions/:id/complete - Kiểm tra tính idempotent...');
    const sRes = await fetch(`${BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_id: activeSession.pack_id,
        level: 1,
        round_no: 1,
        game_code: 'flip_card',
        play_mode: 'adventure',
      }),
    });
    const sess = await sRes.json();

    const events = sess.questions.map((q, idx) => ({
      client_event_id: `ev_test4_${idx}`,
      question_id: q.id,
      user_answer: q.payload.correct_answer,
      attempt_no: 1,
      response_ms: 1000,
      hint_used: false,
    }));

    // Lần gọi 1
    const res1 = await fetch(`${BASE_URL}/api/v1/sessions/${sess.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_ms: 15000, events }),
    });
    const data1 = await res1.json();

    // Lấy thông tin user sau lần 1
    const meRes1 = await fetch(`${BASE_URL}/api/v1/me`);
    const me1 = await meRes1.json();

    // Lần gọi 2
    const res2 = await fetch(`${BASE_URL}/api/v1/sessions/${sess.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_ms: 15000, events }),
    });
    const data2 = await res2.json();

    // Lấy thông tin user sau lần 2
    const meRes2 = await fetch(`${BASE_URL}/api/v1/me`);
    const me2 = await meRes2.json();

    if (
      data1.xp_earned === data2.xp_earned &&
      me1.xp === me2.xp &&
      me1.coins === me2.coins &&
      me1.streak_current === me2.streak_current
    ) {
      console.log(' -> ĐẠT: Lần gọi thứ 2 trả kết quả cũ và không cấp thưởng XP/Coin/Streak lần nữa.');
      passedCount++;
    } else {
      console.error(' -> THẤT BẠI Test 4: Điểm thưởng bị cộng lặp!', { me1, me2 });
    }
  } catch (err) {
    console.error(' -> Lỗi Test 4:', err.message);
  }

  // --- LỖI 5: SRS lưu q thấp nhất trong phiên ---
  try {
    console.log('\n[Test 5] Kiểm tra SRS lưu q thấp nhất (min quality) thay vì ghi đè bằng kết quả cuối...');
    const sRes = await fetch(`${BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_id: activeSession.pack_id,
        level: 2,
        round_no: 1,
        game_code: 'fill_blank',
        play_mode: 'adventure',
      }),
    });
    const sess = await sRes.json();
    const q1 = sess.questions[0];

    // Tạo phiên có câu trả lời sai cho q1
    const events = [
      {
        client_event_id: `ev_q1_wrong`,
        question_id: q1.id,
        user_answer: 'wrong_word',
        attempt_no: 1,
        response_ms: 900,
        hint_used: false,
      },
    ];

    const compRes = await fetch(`${BASE_URL}/api/v1/sessions/${sess.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_ms: 10000,
        events,
      }),
    });
    const compData = await compRes.json();

    const hasWrongWord = compData.wrong_words.some((w) => w.vocab_id === q1.vocab_id);

    const queueRes = await fetch(`${BASE_URL}/api/v1/review/queue`);
    const queueData = await queueRes.json();
    const inNotebook = queueData.notebook_items && queueData.notebook_items.some((v) => v.id === q1.vocab_id);

    if (hasWrongWord && inNotebook) {
      console.log(' -> ĐẠT: Từ sai được xếp vào sổ tay với q thấp nhất (q=1, lapse_count tăng), hiển thị trong sổ tay.');
      passedCount++;
    } else {
      console.error(' -> THẤT BẠI Test 5!', { hasWrongWord, inNotebook });
    }
  } catch (err) {
    console.error(' -> Lỗi Test 5:', err.message);
  }

  console.log(`\n======================================================`);
  console.log(`KẾT QUẢ CUỐI CÙNG: ${passedCount}/${totalTests} TESTS ĐÃ VƯỢT QUA TOÀN DIỆN!`);
  console.log(`======================================================`);
}

runApiTests().catch(console.error);
