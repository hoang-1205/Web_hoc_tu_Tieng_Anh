const BASE_URL = 'http://localhost:3000';

async function runLan2Tests() {
  console.log('=== BẮT ĐẦU KIỂM TRA 3 LỖI MỚI (LỖI 8, 9, 10 - LẦN SỬA 2) ===\n');
  let passedCount = 0;
  const totalTests = 3;

  const pRes = await fetch(`${BASE_URL}/api/v1/packs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_type: 'topic', topic_ids: [1, 2] }),
  });
  const pack = await pRes.json();

  // --- TEST LỖI 8: Flip Card ghi nhận đúng question_id theo từng cặp, accuracy tính đúng ---
  try {
    console.log('[Test 8] Flip Card: Gửi event theo từng question_id và kiểm tra qua màn Adventure...');
    const sRes = await fetch(`${BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_id: pack.id,
        level: 1,
        round_no: 1,
        game_code: 'flip_card',
        play_mode: 'adventure',
      }),
    });
    const sess = await sRes.json();
    const totalQ = sess.questions.length;

    // Giả lập đa số câu đúng ngay lần đầu (attempt_no = 1), 2 câu lật sai 1 lần rồi đúng ở attempt_no = 2
    const firstTryTargetCount = Math.max(1, totalQ - 2);
    const flipEvents = [];
    sess.questions.forEach((q, idx) => {
      if (idx < firstTryTargetCount) {
        // Đúng ngay lần đầu
        flipEvents.push({
          client_event_id: `ev_flip_match_${q.id}`,
          question_id: q.id,
          user_answer: q.payload.correct_answer,
          attempt_no: 1,
          response_ms: 1200,
          hint_used: false,
        });
      } else {
        // Lật sai 1 lần trước
        flipEvents.push({
          client_event_id: `ev_flip_mis_${q.id}_1`,
          question_id: q.id,
          user_answer: 'mismatch',
          attempt_no: 1,
          response_ms: 1000,
          hint_used: false,
        });
        // Sau đó ghép đúng ở attempt_no = 2
        flipEvents.push({
          client_event_id: `ev_flip_match_${q.id}_2`,
          question_id: q.id,
          user_answer: q.payload.correct_answer,
          attempt_no: 2,
          response_ms: 1200,
          hint_used: false,
        });
      }
    });

    const compRes = await fetch(`${BASE_URL}/api/v1/sessions/${sess.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_ms: 25000,
        events: flipEvents,
      }),
    });
    const compData = await compRes.json();
    const expectedAccuracy = Math.round((firstTryTargetCount / totalQ) * 100);

    // Accuracy đạt >= 60% -> Vượt qua màn L1 Adventure (win) và chuyển sang L2!
    if (
      compData.result === 'win' &&
      compData.accuracy === expectedAccuracy &&
      compData.accuracy >= 60 &&
      compData.next &&
      compData.next.level === 2
    ) {
      console.log(` -> ĐẠT: Flip Card ghi nhận đủ ${totalQ} câu hỏi độc lập, accuracy đạt ${compData.accuracy}%, chiến thắng và chuyển lên L2 thành công.`);
      passedCount++;
    } else {
      console.error(' -> THẤT BẠI Test 8!', {
        result: compData.result,
        accuracy: compData.accuracy,
        expectedAccuracy,
        next: compData.next,
      });
    }
  } catch (err) {
    console.error(' -> Lỗi Test 8:', err.message);
  }

  // --- TEST LỖI 9: Learning không được hoàn tất nếu còn câu chưa trả lời ---
  try {
    console.log('\n[Test 9] Learning: Kiểm tra không hoàn tất nếu gửi nhiều event cho cùng 1 câu mà bỏ qua các câu khác...');
    const sRes = await fetch(`${BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_id: pack.id,
        level: 1,
        round_no: 1,
        game_code: 'flip_card',
        play_mode: 'learning',
      }),
    });
    const sess = await sRes.json();

    // Gửi 15 event nhưng TẤT CẢ đều cho câu đầu tiên sess.questions[0]
    // Các câu còn lại chưa trả lời!
    const fakeSpamEvents = [];
    for (let i = 1; i <= 15; i++) {
      fakeSpamEvents.push({
        client_event_id: `ev_spam_${i}`,
        question_id: sess.questions[0].id,
        user_answer: sess.questions[0].payload.correct_answer,
        attempt_no: i,
        response_ms: 800,
        hint_used: false,
      });
    }

    const compRes = await fetch(`${BASE_URL}/api/v1/sessions/${sess.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_ms: 15000,
        events: fakeSpamEvents,
      }),
    });
    const compData = await compRes.json();

    // Không được coi là win vì chưa có kết quả cho đủ từng question_id!
    const isRejectedOrNotWin = compData.result !== 'win';

    // Bây giờ gửi đầy đủ tất cả các câu hỏi
    const sResFull = await fetch(`${BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_id: pack.id,
        level: 1,
        round_no: 1,
        game_code: 'flip_card',
        play_mode: 'learning',
      }),
    });
    const sessFull = await sResFull.json();
    const fullEvents = sessFull.questions.map((q, idx) => ({
      client_event_id: `ev_full_${idx}`,
      question_id: q.id,
      user_answer: q.payload.correct_answer,
      attempt_no: 1,
      response_ms: 900,
      hint_used: false,
    }));

    const compResFull = await fetch(`${BASE_URL}/api/v1/sessions/${sessFull.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_ms: 18000,
        events: fullEvents,
      }),
    });
    const compDataFull = await compResFull.json();

    if (isRejectedOrNotWin && compDataFull.result === 'win') {
      console.log(' -> ĐẠT: Gửi nhiều event cho 1 câu không qua màn; chỉ hoàn tất khi đã có đủ kết quả cho từng question_id trong phiên.');
      passedCount++;
    } else {
      console.error(' -> THẤT BẠI Test 9!', {
        spamResult: compData.result,
        fullResult: compDataFull.result,
      });
    }
  } catch (err) {
    console.error(' -> Lỗi Test 9:', err.message);
  }

  // --- TEST LỖI 10: Thử lại câu đúng được tính q = 3 thay vì bị bỏ qua / ghi q = 1 ---
  try {
    console.log('\n[Test 10] Retry: Kiểm tra câu trả lời sai lần 1 rồi đúng lần 2 nhận q = 3 (không bị lapse SRS)...');
    const sRes = await fetch(`${BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_id: pack.id,
        level: 2,
        round_no: 1,
        game_code: 'fill_blank',
        play_mode: 'adventure',
      }),
    });
    const sess = await sRes.json();
    const targetQ = sess.questions[0];
    const totalQ = sess.questions.length;

    // Tạo events:
    // - Câu 0: lần 1 sai, lần 2 đúng!
    // - Các câu còn lại: đúng ngay lần 1
    const testEvents = [
      {
        client_event_id: `ev_q0_att1_wrong`,
        question_id: targetQ.id,
        user_answer: 'tra_loi_sai',
        attempt_no: 1,
        response_ms: 1200,
        hint_used: false,
      },
      {
        client_event_id: `ev_q0_att2_correct`,
        question_id: targetQ.id,
        user_answer: targetQ.payload.correct_answer,
        attempt_no: 2,
        response_ms: 1200,
        hint_used: false,
      },
    ];

    sess.questions.slice(1).forEach((q, idx) => {
      testEvents.push({
        client_event_id: `ev_q_${idx + 1}_correct`,
        question_id: q.id,
        user_answer: q.payload.correct_answer,
        attempt_no: 1,
        response_ms: 1000,
        hint_used: false,
      });
    });

    const compRes = await fetch(`${BASE_URL}/api/v1/sessions/${sess.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration_ms: 22000,
        events: testEvents,
      }),
    });
    const compData = await compRes.json();

    // 1. targetQ.vocab_id KHÔNG bị đưa vào wrong_words vì đã giải đúng ở lần 2 (q = 3 >= 3)
    const isNotInWrongWords = !compData.wrong_words.some((w) => w.vocab_id === targetQ.vocab_id);

    // 2. Accuracy tính theo lần thử đầu: (totalQ - 1) / totalQ
    const expectedAccuracy = Math.round(((totalQ - 1) / totalQ) * 100);
    const isAccuracyCorrect = compData.accuracy === expectedAccuracy;

    if (isNotInWrongWords && isAccuracyCorrect && compData.result === 'win') {
      console.log(` -> ĐẠT: Câu thử lại thành công nhận q = 3, accuracy tính theo lần 1 (${compData.accuracy}%), từ không bị đánh dấu sai hay đưa vào sổ tay.`);
      passedCount++;
    } else {
      console.error(' -> THẤT BẠI Test 10!', {
        isNotInWrongWords,
        accuracy: compData.accuracy,
        expectedAccuracy,
        result: compData.result,
        wrong_words: compData.wrong_words,
      });
    }
  } catch (err) {
    console.error(' -> Lỗi Test 10:', err.message);
  }

  console.log(`\n======================================================`);
  console.log(`KẾT QUẢ: ${passedCount}/${totalTests} TESTS LẦN 2 ĐÃ VƯỢT QUA TOÀN DIỆN!`);
  console.log(`======================================================`);
}

runLan2Tests().catch(console.error);
