# VocabQuest — Bản Phân Tích Hệ Thống & Đặc Tả Kỹ Thuật

*Phiên bản 1.0 · 27/10/2026 · Đối tượng đọc: Frontend, Backend, QA, Designer*

**Thuật ngữ & quy ước.** `POS` = Part of Speech (loại từ) · `Pack` = bộ 10 từ cho một lượt học · `L1/L2/L3` = cấp độ game · `SRS` = Spaced Repetition System · `Heart` = máu trong một phiên chơi · `Combo` = chuỗi trả lời đúng liên tiếp · `ExplainSheet` = bảng giải thích hiện ra khi trả lời sai. Tên trường và endpoint dùng `snake_case`; mọi mốc thời gian lưu UTC (`timestamptz`).

## PHẦN 1: Đề xuất Sáng tạo thêm Trò chơi & Tính năng Đột phá

### 1.1 Bốn Mini-game mới (G4–G7)

Ba game gốc được đánh mã G1–G3; game mới đánh số tiếp để thống nhất `game_code` trong code, database và analytics.

| Mã | `game_code` | Tên game | Cấp | Kỹ năng chính | Khai thác |
| --- | --- | --- | --- | --- | --- |
| G1 | `flip_card` | Memory Flip Card | L1 | Nhận diện | Từ ↔ nghĩa / ảnh / IPA |
| G2 | `fill_blank` | Fill in the Blanks | L2 | Ghi nhớ cấu trúc | Chính tả + dạng từ theo POS |
| G3 | `speed_quiz` | Speed Quiz / Sentence Scramble | L3 | Phản xạ | Đồng/trái nghĩa, trật tự câu |
| G4 | `word_basket` | Word Basket | L2 | Nhận biết loại từ | **Loại từ** |
| G5 | `family_morph` | Word Family Morph | L2→L3 | Biến đổi từ | **Họ từ × Loại từ** |
| G6 | `audio_shooter` | Audio Shooter | L3 | Nghe – chính tả | Âm thanh, từ dễ nhầm |
| G7 | `topic_express` | Topic Express | L2/L3 | Phân loại ngữ nghĩa | **Chủ đề** |

**G4 — Word Basket (Rổ loại từ).** Từ vựng rơi từ trên xuống; người chơi kéo (hoặc chạm rổ / phím mũi tên) để đưa từ vào đúng rổ `Danh từ / Động từ / Tính từ / Trạng từ / Cụm động từ`. Tốc độ rơi tăng theo wave. *Giá trị học tập:* buộc não nhận diện POS qua dấu hiệu hình thái (hậu tố `-tion`, `-ly`, `-ous`…) thay vì dịch nghĩa.

**G5 — Word Family Morph (Biến hình họ từ).** Cho từ gốc `decide`; màn hình có 4 ô `Noun / Verb / Adj / Adv`. Người chơi kéo thẻ vào đúng ô (`decision`, `decide`, `decisive`, `decisively`) trong khay chứa cả thẻ gây nhiễu (`decisation`, `decidely`). *Giá trị:* học trọn họ từ — kỹ năng cốt lõi của IELTS Word Formation và TOEIC Part 5.

**G6 — Audio Shooter (Bắn từ theo âm thanh).** Phát audio; 5 bong bóng chứa các từ dễ nhầm chính tả/âm (`ship/sheep`, `affect/effect`) bay ngang màn hình; người chơi bắn trúng bong bóng đúng trước khi hết giờ. Chế độ nâng cao: nghe cả câu, chỗ khuyết là tiếng “beep”. *Giá trị:* gắn âm thanh với mặt chữ, luyện phản xạ nghe.

**G7 — Topic Express (Tàu chủ đề).** Băng chuyền đưa từ vào giữa màn hình; 3 ga hai bên và phía trên là 3 chủ đề (ví dụ Du lịch / Công sở / Công nghệ). Vuốt hoặc phím ←↑→ để điều hướng từ về đúng ga. *Giá trị:* hình thành cụm ngữ nghĩa (semantic cluster) theo chủ đề, giúp nhớ từ theo ngữ cảnh sử dụng.

### 1.2 Ba tính năng thông minh (AI / EdTech) và hai tính năng bổ trợ

**F1 — Lặp lại ngắt quãng (SRS).** Biến thể của SM-2, chạy riêng cho từng từ của từng user trong `UserWordProgress`. Mỗi câu trả lời được quy đổi thành điểm chất lượng `q`:

| Tình huống trả lời | `q` |
| --- | --- |
| Đúng, lần thử đầu, dùng < 50% thời gian cho phép | 5 |
| Đúng, lần thử đầu | 4 |
| Đúng nhưng cần gợi ý hoặc ở lần thử thứ 2 | 3 |
| Sai / hết giờ | 1 |

Quy tắc cập nhật (thực hiện ở server khi hoàn tất phiên):

- Nếu `q < 3` (lapse): `repetition = 0`, `lapse_count += 1`, `next_review_at = now + 10 phút` (ôn lại ngay trong phiên; nếu user rời phiên thì hiện vào hàng đợi hôm sau).
- Nếu `q ≥ 3`: `repetition += 1`; `interval_days = 1` khi `repetition = 1`; `3` khi `repetition = 2`; từ lần 3 trở đi `interval_days = round(interval_days_cũ × ease_factor)`.
- `ease_factor = max(1.3, ease_factor + 0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))`, khởi tạo 2.5.
- Trạng thái `mastered` khi `repetition ≥ 4` **và** `interval_days ≥ 21`.
- Mỗi từ chỉ cập nhật SRS **một lần mỗi phiên**, lấy `q` thấp nhất trong phiên (chặn việc cày interval).

**F2 — AI tạo câu ví dụ theo ngữ cảnh cá nhân hóa.** Backend gọi LLM (ví dụ `claude-haiku-5-5`) sinh 3 câu ví dụ theo `topic`, `cefr_level` và mục tiêu học của user. Pipeline: tạo prompt → LLM trả JSON → **validate** (chứa đúng headword với đúng POS bằng lemmatizer, ≤ 18 từ, độ khó CEFR ≤ level user + 1, qua kiểm duyệt nội dung) → lưu `ExampleSentences` với `source = 'ai'` → dùng trong Fill in the Blanks và thẻ “Ví dụ mới” ở trang Ôn tập. Giới hạn 20 lượt sinh/ngày/user (gói free), cache theo khóa `(vocab_id, cefr_level, topic_id)`. Nếu LLM lỗi hoặc validate thất bại → dùng câu tĩnh `source = 'static'`. Hợp đồng đầu ra bắt buộc của LLM:

```json
{ "items": [ { "sentence": "She made a decisive move.", "translation_vi": "Cô ấy đã có một bước đi quyết đoán.", "target_form": "decisive" } ] }
```

**F3 — Huy hiệu (Badges) & Cửa hàng (Shop).** Coins kiếm từ phiên chơi và nhiệm vụ ngày; chi tiêu cho vật phẩm hỗ trợ và vật phẩm giao diện.

| Vật phẩm | Giá (coins) | Hiệu ứng |
| --- | --- | --- |
| Streak Freeze | 200 | Giữ streak khi bỏ lỡ 1 ngày (tối đa 2 cái trong kho) |
| Heart Refill | 50 | +1 Heart trong phiên đang chơi (tối đa 1 lần/phiên) |
| Hint Token | 30 | Mở gợi ý 1 câu (trừ 30 điểm, `q` tối đa 3) |
| Time Freeze | 40 | +10 giây vào time bank ở L3 |
| Khung avatar / Theme | 300–800 | Chỉ thẩm mỹ |

| Huy hiệu | Điều kiện (`criteria`) |
| --- | --- |
| First Quest | Hoàn thành pack đầu tiên |
| Noun Ninja / Verb Voyager / Adjective Ace / Adverb Ace | 200 câu trả lời đúng với loại từ tương ứng |
| Family Reunion | Hoàn thành 10 họ từ trong G5 không sai lần nào |
| Topic Master | Có ≥ 80% từ của một chủ đề ở trạng thái `mastered` |
| Sharpshooter | Đạt 15/15 ở một ván Audio Shooter |
| On Fire 7 / 30 | Streak 7 / 30 ngày |

**F4 — Nhiệm vụ ngày (Daily Quest).** 3 nhiệm vụ/ngày (ôn 10 từ đến hạn SRS · đạt combo ×2 · hoàn thành 1 pack), thưởng coins và rương ngẫu nhiên; hoàn thành cả 3 mới giữ được mốc streak của ngày.

**F5 — Độ khó thích ứng (Adaptive Difficulty).** Theo dõi `accuracy` 3 phiên gần nhất theo từng `game_code`: nếu cả 3 phiên ≥ 90% thì tăng `difficulty_tier` (rút ngắn timer 10%, thêm 1 distractor); nếu 2 phiên liên tiếp < 60% thì giảm tier và bật gợi ý miễn phí.

## PHẦN 2: Phân tích Luồng Người Dùng (User Flow) & Sơ đồ Trang (Sitemap)

### 2.1 Sitemap

```
VocabQuest
├── /                         Landing Page (public)
├── /login  /register  /forgot-password
├── /onboarding               Placement test + chọn mục tiêu (lần đăng nhập đầu)
├── /app                      (yêu cầu đăng nhập)
│   ├── /dashboard            Dashboard
│   ├── /library              Chọn Chủ đề × Loại từ × Họ từ
│   │   ├── /topics/:slug
│   │   ├── /pos/:code
│   │   └── /families/:id
│   ├── /quest/:packId        Màn hình chờ (Lobby)
│   ├── /play/:sessionId      Màn hình chơi (board theo game_code)
│   ├── /result/:sessionId    Trang kết quả
│   ├── /review               Sổ tay từ sai + hàng đợi SRS
│   │   └── /play             Ôn tập dạng game
│   ├── /leaderboard          Tuần / Tháng / Mọi thời đại / Bạn bè
│   ├── /shop                 Cửa hàng & kho đồ
│   ├── /profile              Hồ sơ, huy hiệu, thống kê
│   └── /settings             Âm thanh, giọng đọc UK/US, mục tiêu ngày, ngôn ngữ
└── /admin                    CMS từ vựng (role admin / editor)
```

| Route | Trang | Thành phần chính |
| --- | --- | --- |
| `/` | Landing | Hero, demo game 30 giây (guest, không lưu), 3 cấp độ, CTA Đăng ký |
| `/onboarding` | Onboarding | Bài test xếp trình độ 10 câu (ra CEFR A1–C1), chọn chủ đề ưu tiên, mục tiêu ngày (5/10/20 từ) |
| `/app/dashboard` | Dashboard | Streak, thanh XP/Level, “Nhiệm vụ hôm nay”, số từ đến hạn ôn (badge), tiến độ theo chủ đề và theo loại từ, top 5 leaderboard |
| `/app/library` | Chọn bộ từ | Lưới Chủ đề, chip lọc Loại từ, công tắc “Học theo họ từ”, nút Tạo Pack |
| `/app/quest/:packId` | Lobby | Xem trước 10 từ (carousel có phát âm), chọn giọng UK/US, nút Bắt đầu, hiển thị chuỗi level L1→L3 |
| `/app/play/:sessionId` | Chơi game | HUD (Heart, điểm, combo, timer), board của game, nút tạm dừng |
| `/app/result/:sessionId` | Kết quả | Sao, điểm, XP, coins, từ đã thuộc, từ sai, nút Ôn ngay / Pack tiếp |
| `/app/review` | Ôn tập | Tab “Sổ tay từ sai” và “Đến hạn SRS”, lọc theo chủ đề/loại từ, nút Ôn dạng game |
| `/app/profile` | Hồ sơ | Avatar, level, bản đồ nhiệt streak, huy hiệu, thống kê theo POS |

### 2.2 Luồng người dùng chính

```
[Landing] --Học thử--> [Demo Pack (guest)] --> [CTA Đăng ký]
    |
[Login/Register] --lần đầu--> [Onboarding]
    |                              |
    +--------------+---------------+
                   v
             [Dashboard]
      +-------------+--------------+
      v             v              v
 [Library]    [Review SRS]   [Daily Quest]
      |             |              |
      v             +------+-------+
 [Pack Builder] <----------+
      v
 [Lobby: xem trước 10 từ]
      v
 [L1 Flip Card] --thất bại--> thử lại (xáo thẻ mới)
      | pass
      v
 [L2 Round A: Fill Blank] --> [L2 Round B: Basket | Morph | Topic Express]
      | pass cả 2 round
      v
 [L3 Speed Quiz | Audio Shooter]
      | pass
      v
 [Result] --POST /sessions/:id/complete--> XP, SRS, streak, leaderboard
      v
 [Ôn từ sai] / [Pack tiếp theo] / [Dashboard]
```

| Bước | Hành động của user | Xử lý hệ thống | Dữ liệu ghi |
| --- | --- | --- | --- |
| 1 | Đăng nhập (email/mật khẩu hoặc Google) | `POST /auth/login` → access token + refresh cookie; `GET /me`; nếu `onboarded = false` chuyển `/onboarding` | `Users.last_login_at` |
| 2 | Chọn Chủ đề / Loại từ / Họ từ rồi bấm **Tạo Pack** | `POST /packs` chạy thuật toán Pack Builder (xem dưới) | `StudyPacks`, `PackWords` |
| 3 | Xem Lobby, nghe thử từng từ | Prefetch audio và ảnh của 10 từ (Howler preload) | — |
| 4 | Chơi L1 → L2 → L3 | Client giữ state bằng state machine; mỗi câu sinh `AnswerEvent` đẩy vào hàng đợi cục bộ (IndexedDB), gửi lô qua `POST /sessions/:id/events` mỗi 5 câu hoặc khi kết thúc round | `GameLogs` |
| 5 | Kết thúc phiên | `POST /sessions/:id/complete`: server tính lại điểm từ `GameLogs`, cập nhật SRS, XP, coins, streak, bảng xếp hạng, huy hiệu | `GameSessions`, `UserWordProgress`, `UserXpDaily`, `CoinTransactions` |
| 6 | Xem kết quả | Hiển thị từ sai, đã tự gom vào Sổ tay (`in_notebook = true`) | — |
| 7 | Ôn tập | `GET /review/queue` lấy từ `next_review_at ≤ now` hoặc `in_notebook = true` | — |

**Thuật toán Pack Builder.** (1) Lấy tối đa 4 từ đến hạn SRS thuộc bộ lọc, ưu tiên `lapse_count` cao; (2) phần còn lại là từ mới (`status = 'new'`) có `cefr_level ≤ cefr_level của user + 1`, sắp theo `frequency_rank` tăng dần; (3) nếu lọc theo Họ từ thì lấy trọn họ từ (tối đa 10 từ); (4) nếu lọc theo Chủ đề thì bảo đảm pack có ≥ 2 loại từ khác nhau; (5) tổng luôn là 10 từ, thiếu thì bổ sung từ `learning` cùng bộ lọc.

**Cổng qua cấp (Gate).**

| Cấp | Điều kiện qua | Nếu thất bại | Lặp lại |
| --- | --- | --- | --- |
| L1 | Thắng (ghép hết cặp) và `accuracy ≥ 60%` | Ván mới, thẻ được xáo lại | Không giới hạn |
| L2 | **Mỗi** round: `accuracy ≥ 70%` và còn ≥ 1 Heart | Hết Heart → “Ôn nhanh” 30 giây (flashcard các từ vừa sai) rồi chơi lại round | Không giới hạn |
| L3 | Thắng và `accuracy ≥ 70%` | Như L2 | Không giới hạn |

Pack hoàn thành khi qua L3. Chơi lặp lại một level đã qua nhận XP ×0.5 (chống cày). Trạng thái chơi dở được autosave vào IndexedDB sau mỗi câu; mỗi sự kiện có `client_event_id` (UUID) để server xử lý idempotent khi gửi lại sau mất mạng.

## PHẦN 3: Đặc tả Cơ chế Trò chơi (Game Mechanics Breakdown)

Mọi game chạy trên một `GameEngine` dùng chung với state machine `idle → countdown(3s) → playing ⇄ paused → finished(win | lose)`. Mỗi câu trả lời sinh một `AnswerEvent { client_event_id, vocab_id, game_code, question_type, is_correct, response_ms, attempt_no, hint_used, user_answer }`. Điểm hiển thị ở client chỉ để phản hồi tức thì; **điểm chính thức do server tính lại từ `GameLogs`**.

### 3.1 Quy tắc dùng chung

| Thành phần | Quy tắc |
| --- | --- |
| Heart | 5 Heart/phiên cho G2, G4, G5, G7; 3 Heart cho G3, G6; G1 không dùng Heart. Sai −1 Heart; về 0 = Lose. |
| Combo | `combo += 1` khi đúng; `combo = 0` khi sai hoặc hết giờ. `mult = min(3.0, 1 + 0.5 × floor(combo / 3))` → combo 0–2: ×1 · 3–5: ×1.5 · 6–8: ×2 · 9–11: ×2.5 · ≥ 12: ×3. |
| Điểm một câu | `score_q = round(base × speed_factor × mult)`; `base` và `speed_factor` định nghĩa riêng cho từng game. |
| Accuracy | `accuracy = số câu đúng ở lần thử đầu / tổng số câu`. Câu hỏi lại ở cuối round (“cơ hội thứ hai”) không tính vào mẫu số. |
| Sao | Phải thắng. `accuracy ≥ 90%` = 3★ · `≥ 75%` = 2★ · còn lại (đạt ngưỡng qua màn) = 1★. |
| XP & Coins | `xp = round(Σscore_q / 20) + 25 × stars`; `coins = 5 × stars + floor(max_combo / 3)`; chơi lại level đã qua nhân 0.5. XP cần để lên level `L+1` = `round(100 × L^1.5)`. |
| Gợi ý (Hint) | Tốn 1 Hint Token (hết token thì −30 điểm); `q` của câu đó tối đa 3. |
| Tạm dừng | Dừng timer; tổng thời gian tạm dừng tối đa 30 giây/phiên, quá sẽ tự thoát phiên. |
| Chống gian lận | Server loại event có `response_ms < 250`; `duration_ms` phải ≥ `số câu × 800`; điểm client gửi lên bị bỏ qua. |

### 3.2 Quy trình chuẩn khi trả lời sai

1. **Client:** rung thẻ (shake 300 ms) + âm `sfx_wrong` + trừ Heart + reset combo.
2. **ExplainSheet:** hiện đáp án đúng, chip POS (đúng màu loại từ) và quy tắc lấy từ `GrammarTips` / `AffixRules` khớp `slot_pattern` của câu. Tự đóng sau 3 giây hoặc khi chạm.
3. **Hàng đợi:** đẩy `AnswerEvent(is_correct = false)` vào hàng đợi cục bộ.
4. **Cơ hội thứ hai:** cuối round, câu sai được hỏi lại một lần, không trừ Heart.
5. **Server khi nhận event:** ghi `GameLogs`; `UserWordProgress.wrong_count += 1`, `lapse_count += 1`, `q = 1`, `in_notebook = true`, `notebook_added_at = now()`. Từ rời Sổ tay khi được trả lời đúng ở 2 lần ôn SRS liên tiếp.

### 3.3 Đặc tả từng game

#### G1 — Memory Flip Card · Cấp L1

| Hạng mục | Đặc tả |
| --- | --- |
| Dữ liệu đầu vào | 10 từ của pack, mỗi từ lấy `Vocabularies(id, headword, pos_id, ipa_uk, audio_url_uk, image_url, meaning_vi)`. `mode ∈ {word_meaning, word_image, word_ipa}`: lần đầu luôn `word_meaning`, các lần sau xoay vòng và bỏ `word_image` nếu từ thiếu `image_url`. Sinh 20 thẻ (10 thẻ từ + 10 thẻ đối ứng), lưới 4×5 (mobile) / 5×4 (desktop), xáo bằng Fisher–Yates, `seed` lưu trong `GameSessions`. |
| Luật chơi & thao tác | Chạm để lật, tối đa 2 thẻ mở cùng lúc. Khớp → khoá thẻ và phát audio của từ (TTS dự phòng nếu thiếu file). Không khớp → giữ mở 800 ms rồi úp lại. Nút “Gợi ý” nháy sáng 1 cặp đúng trong 1 giây. |
| Điểm / Timer / Combo | Ghép đúng: `100 × mult`. Ghép sai: `combo = 0`, `mismatch += 1`, không trừ điểm. Thưởng thời gian khi thắng: `max(0, 120 − t_giây) × 2`. Thưởng hoàn hảo (0 lần sai): +200. Timer đếm lên, giới hạn cứng 240 giây. |
| Thắng / Thua / Qua màn | Thắng: ghép hết 10 cặp trong 240 giây. Thua: quá 240 giây. Qua L2: thắng và `accuracy = 10 / (10 + mismatch) ≥ 60%` (tối đa 6 lần ghép sai). |
| Xử lý khi sai | Hai thẻ rung đỏ; trong 800 ms hiện chú thích nghĩa của cả hai thẻ kèm chip POS. Lỗi tính cho từ của **thẻ lật đầu tiên**. Ngoại lệ so với mục 3.2: không dùng Heart; từ sai 1 lần → `q = 3`; sai ≥ 2 lần trong phiên → `q = 1` và vào Sổ tay. |

#### G2 — Fill in the Blanks · Cấp L2 (Round A)

| Hạng mục | Đặc tả |
| --- | --- |
| Dữ liệu đầu vào | **2A `letter_blank`:** `ExampleSentences(sentence_template, blank_text)` + `Vocabularies(headword, meaning_vi, audio_url_*)`. Che `ceil(len × 0.4)` chữ cái (không che chữ đầu; từ ≤ 3 chữ che 1). Bàn phím chữ gồm các chữ bị che + 3 chữ nhiễu. **2B `pos_form`:** câu có `{{blank}}`; đáp án là từ của pack; 3 phương án nhiễu là các thành viên khác cùng `family_id` (khác POS), thiếu thì lấy từ `VocabRelations(confusable)`. Từ thuộc họ từ có ≥ 3 POS → dùng 2B, còn lại dùng 2A. |
| Luật chơi & thao tác | Round gồm 10 câu, mỗi từ một câu. 2A: hiện câu có chỗ khuyết, nghĩa tiếng Việt làm gợi ý; chạm ô chữ cái (hoặc gõ phím) để điền; được thử 2 lần. 2B: chọn 1 trong 4 dạng từ điền vào chỗ trống. |
| Điểm / Timer / Combo | `base = 100`; `speed_factor = 1 + 0.5 × (time_left / time_limit)`; timer 25 giây (2A) / 15 giây (2B). 2A đúng ở lần thử 2 nhân 0.5. Dùng gợi ý −30 (2A mở 1 chữ; 2B loại 2 đáp án sai). Hết giờ tính là sai. |
| Thắng / Thua / Qua màn | Thắng: trả lời đủ 10 câu, còn ≥ 1 Heart và `accuracy ≥ 70%`. Thua: Heart = 0. |
| Xử lý khi sai | −1 Heart. 2A: hiện cách viết đúng chia theo âm tiết + IPA, tự phát audio. 2B: hiện mẹo ngữ pháp, ví dụ “Chỗ trống đứng sau mạo từ `a` và trước danh từ `move` → cần **tính từ**: `decisive`”, đồng thời tô sáng từ khoá ngữ cảnh. Câu sai hỏi lại cuối round; `q = 1`. |

#### G3 — Speed Quiz / Sentence Scramble · Cấp L3

| Hạng mục | Đặc tả |
| --- | --- |
| Dữ liệu đầu vào | **3A:** từ có `VocabRelations(relation_type ∈ {synonym, antonym})`; 1 đáp án đúng + 3 nhiễu **cùng POS**, ưu tiên cùng chủ đề. **3B:** `ExampleSentences.sentence_text` tách thành 5–9 chunk (từ đơn hoặc cụm 2–3 từ, lưu trong cột `chunks` JSONB). **3C (dự phòng khi từ không có quan hệ nghĩa):** chọn nghĩa tiếng Việt. Một round = 15 câu: 10 câu 3A/3C + 5 câu 3B. |
| Luật chơi & thao tác | 3A: hiện từ + chỉ thị ĐỒNG NGHĨA / TRÁI NGHĨA, chọn 1 trong 4 trong 8 giây. 3B: kéo–thả chunk thành câu hoàn chỉnh trong 25 giây rồi bấm “Kiểm tra”. Time bank toàn round: bắt đầu 60 giây, đúng +2 giây, sai −5 giây. |
| Điểm / Timer / Combo | `base`: 150 (3A/3C), 250 (3B). `speed_factor = 1 + time_left_q / limit_q` (từ 1.0 đến 2.0). Nhân `mult`. Hoàn hảo 15/15: +300. |
| Thắng / Thua / Qua màn | Thắng: xong 15 câu trước khi time bank về 0, còn ≥ 1 Heart (có 3 Heart) và `accuracy ≥ 70%`. Thua: time bank = 0 hoặc Heart = 0. |
| Xử lý khi sai | −1 Heart, −5 giây time bank. 3A: ExplainSheet “`big` ≈ `huge` — cả hai là tính từ; đồng/trái nghĩa phải cùng loại từ” kèm 2 câu ví dụ. 3B: hiện thứ tự đúng, tô màu từng chunk theo POS, kèm quy tắc trật tự (ví dụ trạng từ tần suất đứng trước động từ thường). `q = 1`, vào Sổ tay. |

#### G4 — Word Basket · Cấp L2 (Round B khi pack lọc theo Loại từ)

| Hạng mục | Đặc tả |
| --- | --- |
| Dữ liệu đầu vào | 3–5 rổ lấy từ các POS có trong pack (ít hơn 3 POS thì thêm POS khác cho đủ 3). 24 từ chia 3 wave × 8 từ: 10 từ của pack + tối đa 14 từ ôn lại (`status ∈ {learning, reviewing}`, cùng bộ lọc). Mỗi từ lấy `Vocabularies(headword, pos_id)`. Từ đa loại như `record`, `present` chỉ xuất hiện kèm một `ExampleSentences` ngắn hiện nhỏ dưới từ làm gợi ý ngữ cảnh. |
| Luật chơi & thao tác | Từ rơi từ trên xuống; khoảng cách spawn 2.5 giây (wave 1) giảm còn 1.2 giây (wave 3); tốc độ `v = 90 × (1 + 0.15 × (wave − 1))` đơn vị/giây trên canvas thiết kế 1080×1920. Kéo từ thả vào rổ, hoặc chạm rổ khi từ thấp nhất đang được khoá mục tiêu; bàn phím: phím `1–5` chọn rổ. |
| Điểm / Timer / Combo | Đúng = `100 × mult`; “bắt sớm” (từ còn ở nửa trên màn hình) +25; sạch một wave (không sai, không rơi) +150. Không có timer, áp lực đến từ tốc độ rơi; không dùng `speed_factor`. |
| Thắng / Thua / Qua màn | Thắng: qua 3 wave, còn Heart và `accuracy ≥ 70%`. Thua: Heart = 0. Từ chạm đáy màn hình được tính là sai. |
| Xử lý khi sai | −1 Heart; rổ chớp đỏ; game đóng băng 2 giây để hiện chú thích POS gắn với hậu tố, ví dụ “`quickly` tận cùng bằng `-ly` → **trạng từ**, bổ nghĩa cho động từ”. Từ sai xuất hiện lại một lần ở wave kế tiếp; `q = 1`. |

#### G5 — Word Family Morph · Cấp L2 (Round B khi pack lọc theo Họ từ) / L3 độ khó cao

| Hạng mục | Đặc tả |
| --- | --- |
| Dữ liệu đầu vào | `WordFamilies(id, root_word, distractor_forms)` và các thành viên `Vocabularies(family_id, pos_id, headword, affix)`; họ từ phải có ≥ 3 POS. Thẻ nhiễu gồm (a) thành viên của họ khác trong cùng wave, (b) từ giả tạo bằng hậu tố sai theo `AffixRules` (`decide + -ation` → `decisation`) lưu trong `distractor_forms`. Mỗi họ: 4 thẻ đúng + 4 thẻ nhiễu = 8 thẻ trong khay; một pack ≈ 3 họ. |
| Luật chơi & thao tác | Từ gốc ở giữa, 4 ô `Noun / Verb / Adj / Adv` (ô không có thành viên bị khoá, màu xám). Kéo thẻ vào ô; kiểm tra ngay khi thả: đúng → thẻ snap vào ô và phát audio; sai → thẻ bật về khay. Timer 45 giây/họ ở L2, 30 giây/họ ở L3 (khi `difficulty_tier ≥ 2`). |
| Điểm / Timer / Combo | Mỗi ô đúng `150 × mult`; hoàn thành họ không sai +200; thưởng thời gian `floor(time_left) × 3`. |
| Thắng / Thua / Qua màn | Thắng: xong tất cả họ với `accuracy ≥ 70%` (ô đúng ngay lần thả đầu / tổng số ô) và Heart > 0. Hết giờ một họ: ô còn trống tính sai nhưng không mất Heart. Thua: Heart = 0. |
| Xử lý khi sai | −1 Heart; thẻ bật về khay; ExplainSheet hiện quy tắc hậu tố từ `AffixRules`: “`-ive` tạo **tính từ**: decide → decisive”. Nếu là từ giả: “Từ này không tồn tại”. Lỗi ghi cho `vocab_id` của ô đang nhắm; `q = 1`; họ từ đó được ưu tiên ở pack sau. |

#### G6 — Audio Shooter · Cấp L3

| Hạng mục | Đặc tả |
| --- | --- |
| Dữ liệu đầu vào | `Vocabularies(headword, audio_url_us, audio_url_uk, ipa_us)` (chỉ dùng từ có audio). 4 bong bóng nhiễu lấy từ `VocabRelations(relation_type = 'confusable')` (gần âm/gần chính tả); thiếu thì tìm từ cùng POS có khoảng cách Levenshtein ≤ 2 (job đêm tính sẵn). **Mode B (câu):** `ExampleSentences.audio_url` có tiếng “beep” tại chỗ khuyết, đáp án là từ điền vào. |
| Luật chơi & thao tác | Audio tự phát, nghe lại miễn phí 2 lần. 5 bong bóng trôi ngang. Chạm/nhấp để bắn; mỗi câu có 2 viên đạn. Giới hạn 8 giây (mode A) / 10 giây (mode B). Một round 15 câu. |
| Điểm / Timer / Combo | `base = 120`; trúng ở viên 1 ×1.0, viên 2 ×0.6; `speed_factor = 1 + 0.5 × time_left / time_limit`; nghe lại từ lần thứ 3 trừ 20 điểm/lần; nhân `mult`. |
| Thắng / Thua / Qua màn | Thắng: `accuracy ≥ 66%` (≥ 10/15) và Heart > 0 (có 3 Heart). Thua: Heart = 0. Hết giờ tính là sai. |
| Xử lý khi sai | −1 Heart, −1 viên đạn; bóng nổ màu xám. ExplainSheet đặt cạnh nhau từ chọn nhầm và từ đúng cùng IPA, tự phát cả hai audio (ví dụ `ship /ʃɪp/` và `sheep /ʃiːp/`). `q = 1` cho từ đúng; từ nhiễu không bị ảnh hưởng. |

#### G7 — Topic Express · Cấp L2 (Round B khi pack lọc theo Chủ đề) / L3

| Hạng mục | Đặc tả |
| --- | --- |
| Dữ liệu đầu vào | 3 chủ đề lấy từ chủ đề của pack (pack chỉ có 1 chủ đề thì thêm 2 chủ đề cùng `parent_id`). 20 từ có `VocabTopics.is_primary = true` thuộc 3 chủ đề đó (10 từ pack + từ ôn lại). `ExampleSentences` ngắn dùng làm chú thích sau khi trả lời. |
| Luật chơi & thao tác | Từ chạy trên băng chuyền tới cổng quyết định; 3 ga bố trí trái / trên / phải. Vuốt hoặc phím `← ↑ →` để chuyển hướng. Thời gian quyết định mỗi từ 5 giây, giảm 0.25 giây sau mỗi 4 từ (tối thiểu 3 giây). |
| Điểm / Timer / Combo | `base = 100`; `speed_factor = 1 + 0.5 × time_left / time_limit`; nhân `mult`. “Express Boost”: cứ 5 từ đúng liên tiếp thì điểm nhân đôi trong 5 giây (hiện hiệu ứng tàu cao tốc). |
| Thắng / Thua / Qua màn | Thắng: xử lý đủ 20 từ, `accuracy ≥ 75%`, Heart > 0 (có 5 Heart). Thua: Heart = 0. |
| Xử lý khi sai | −1 Heart; từ bị đẩy vào “toa phạt”. ExplainSheet: “`itinerary` thuộc **Du lịch**: *We planned the itinerary for the trip.*”, ga đúng sáng lên theo màu chủ đề. Toa phạt quay lại ở cuối round; `q = 1`. |

### 3.4 Ma trận xoay game theo loại pack

| `source_type` của pack | L1 | L2 Round A | L2 Round B | L3 |
| --- | --- | --- | --- | --- |
| `topic` | G1 | G2 | G7 | G3 (mặc định); G6 nếu 10 từ đều có audio, xen kẽ mỗi lần chơi |
| `pos` | G1 | G2 | G4 | G3 / G6 |
| `family` | G1 | G2 | G5 | G3 / G6; G5 bản 30 giây khi `difficulty_tier ≥ 2` |
| `review` (ôn từ sai/SRS) | Bỏ qua | G2 | G4 hoặc G7 tuỳ bộ lọc | G3 |

## PHẦN 4: Thiết kế Cơ sở Dữ liệu (Database Schema / ERD)

Cơ sở dữ liệu: PostgreSQL 16. Khoá chính dùng UUID v7 cho dữ liệu phát sinh từ người dùng (`Users`, `StudyPacks`, `GameSessions`) và `smallint` / `integer` / `bigint` cho bảng danh mục và nội dung. Mọi bảng đều có `created_at`, `updated_at` (`timestamptz`, mặc định `now()`) — không lặp lại ở từng bảng dưới đây.

### 4.1 ERD rút gọn

```
Users 1──N StudyPacks 1──N PackWords N──1 Vocabularies
Users 1──N GameSessions N──1 StudyPacks
GameSessions 1──N GameLogs N──1 Vocabularies
Users N──N Vocabularies            (qua UserWordProgress)
Topics 1──N Topics                 (parent_id: chủ đề con)
Topics N──N Vocabularies           (qua VocabTopics)
PartsOfSpeech 1──N Vocabularies
WordFamilies 1──N Vocabularies
Vocabularies N──N Vocabularies     (qua VocabRelations: synonym | antonym | confusable)
Vocabularies 1──N ExampleSentences
PartsOfSpeech 1──N GrammarTips ;  PartsOfSpeech 1──N AffixRules (result_pos_id)
Users 1──N UserXpDaily ;  Users 1──N CoinTransactions ;  Users 1──N DailyQuests
Users N──N Badges (UserBadges) ;  Users N──N ShopItems (UserInventory)
```

### 4.2 Nhóm người dùng

**`Users`**

| Field | Kiểu | Khoá | Mô tả |
| --- | --- | --- | --- |
| `id` | uuid | PK | UUID v7 |
| `email` | varchar(255) | UNIQUE | Email đăng nhập |
| `password_hash` | text |  | Argon2id; `null` nếu đăng nhập Google |
| `auth_provider` | enum(`local`,`google`) |  | Nguồn đăng nhập |
| `display_name` | varchar(50) |  | Tên hiển thị |
| `avatar_url` | text |  | Ảnh đại diện |
| `role` | enum(`learner`,`editor`,`admin`) |  | Mặc định `learner` |
| `cefr_level` | enum(`A1`,`A2`,`B1`,`B2`,`C1`) |  | Mặc định `A1`; cập nhật sau placement test |
| `xp` | integer |  | Tổng XP, mặc định 0 |
| `level` | smallint |  | Mặc định 1 |
| `coins` | integer |  | Số dư, `CHECK (coins >= 0)` |
| `streak_current` | integer |  | Chuỗi ngày hiện tại |
| `streak_longest` | integer |  | Chuỗi dài nhất |
| `streak_freezes` | smallint |  | `CHECK (0..2)` |
| `last_active_date` | date |  | Ngày hoạt động gần nhất theo `timezone` của user |
| `timezone` | varchar(40) |  | Mặc định `Asia/Ho_Chi_Minh` |
| `daily_goal_words` | smallint |  | 5 / 10 / 20 |
| `difficulty_tiers` | jsonb |  | `{ game_code: tier }` cho Adaptive Difficulty |
| `onboarded` | boolean |  | Đã qua onboarding chưa |
| `last_login_at` | timestamptz |  |  |
| `deleted_at` | timestamptz |  | Xoá mềm |

*Quy tắc Streak:* một ngày được tính khi user hoàn thành ≥ 1 pack hoặc ôn đủ `daily_goal_words` từ. Cron 00:05 theo múi giờ từng user: nếu `last_active_date < hôm_nay − 1` mà còn Streak Freeze thì trừ 1 Freeze và giữ streak; không thì `streak_current = 0`.

**`UserXpDaily`** — PK `(user_id, xp_date)`; cột `user_id` (uuid, FK → `Users.id`), `xp_date` (date), `xp` (integer). Là nguồn tính Leaderboard tuần/tháng; kết quả cache trong Redis ZSET.

### 4.3 Nhóm nội dung từ vựng

**`Topics`**

| Field | Kiểu | Khoá | Mô tả |
| --- | --- | --- | --- |
| `id` | smallint | PK |  |
| `slug` | varchar(50) | UNIQUE | `giao-tiep`, `cong-so`, `du-lich`, `cong-nghe`, `ielts`, `toeic` |
| `name_vi` / `name_en` | varchar(80) |  | Tên hiển thị |
| `parent_id` | smallint | FK → `Topics.id` | Chủ đề cha (nullable) |
| `icon_url` | text |  |  |
| `color_hex` | char(7) |  |  |
| `sort_order` | smallint |  |  |
| `is_active` | boolean |  |  |

**`PartsOfSpeech`**

| Field | Kiểu | Khoá | Mô tả |
| --- | --- | --- | --- |
| `id` | smallint | PK |  |
| `code` | varchar(20) | UNIQUE | `noun`, `verb`, `adj`, `adv`, `phrasal_verb` |
| `name_vi` / `name_en` | varchar(40) |  |  |
| `color_hex` | char(7) |  | Màu cố định theo POS (xem Phần 5) |
| `grammar_summary` | text |  | Tóm tắt vai trò ngữ pháp của loại từ |

**`WordFamilies`**

| Field | Kiểu | Khoá | Mô tả |
| --- | --- | --- | --- |
| `id` | integer | PK |  |
| `root_word` | varchar(80) |  | Từ gốc, ví dụ `decide` |
| `cefr_level` | enum |  | Độ khó của cả họ |
| `distractor_forms` | jsonb |  | Mảng từ giả dùng làm thẻ nhiễu ở G5 |
| `is_active` | boolean |  |  |

**`Vocabularies`** — mỗi dòng là một cặp (từ, loại từ), nên `record` (danh từ) và `record` (động từ) là hai dòng khác nhau.

| Field | Kiểu | Khoá | Mô tả |
| --- | --- | --- | --- |
| `id` | bigint | PK |  |
| `headword` | varchar(80) | UNIQUE cùng `pos_id` | Từ hoặc cụm động từ (`give up`) |
| `pos_id` | smallint | FK → `PartsOfSpeech.id` |  |
| `family_id` | integer | FK → `WordFamilies.id` | Nullable |
| `affix` | varchar(20) |  | Hậu tố/tiền tố tạo nên từ (`-tion`), nullable |
| `ipa_uk` / `ipa_us` | varchar(80) |  | Phiên âm |
| `audio_url_uk` / `audio_url_us` | text |  | File âm thanh trên CDN |
| `image_url` | text |  | Ảnh minh hoạ, nullable |
| `meaning_vi` | text |  | Nghĩa tiếng Việt, NOT NULL |
| `definition_en` | text |  | Định nghĩa tiếng Anh |
| `cefr_level` | enum |  |  |
| `frequency_rank` | integer |  | Thứ hạng tần suất (nhỏ = phổ biến) |
| `is_published` | boolean |  | Chỉ từ đã duyệt mới vào pack |

Chỉ mục: `(family_id)`, `(pos_id, cefr_level)`, GIN trigram trên `headword`.

**`VocabTopics`** — PK `(vocab_id, topic_id)`; `vocab_id` (FK → `Vocabularies.id`), `topic_id` (FK → `Topics.id`), `is_primary` (boolean). Ràng buộc: mỗi từ có đúng một dòng `is_primary = true` (partial unique index).

**`VocabRelations`** — PK `(vocab_id, related_vocab_id, relation_type)`; `relation_type` enum(`synonym`, `antonym`, `confusable`); `CHECK (vocab_id <> related_vocab_id)`. Đồng/trái nghĩa lưu hai chiều.

**`ExampleSentences`**

| Field | Kiểu | Khoá | Mô tả |
| --- | --- | --- | --- |
| `id` | bigint | PK |  |
| `vocab_id` | bigint | FK → `Vocabularies.id` |  |
| `sentence_text` | text |  | Câu đầy đủ |
| `sentence_template` | text |  | Câu có đánh dấu vị trí khuyết: `She made a {{blank}} move.` |
| `blank_text` | varchar(80) |  | Dạng từ thực tế điền vào chỗ khuyết (có thể là `decided` thay vì `decide`) |
| `slot_pattern` | varchar(40) |  | Khớp `GrammarTips.slot_pattern`, ví dụ `ADJ_BEFORE_NOUN` |
| `translation_vi` | text |  |  |
| `chunks` | jsonb |  | Mảng chunk cho G3-3B |
| `audio_url` | text |  | Dùng cho Audio Shooter mode B |
| `source` | enum(`static`,`ai`) |  |  |
| `cefr_level` | enum |  |  |
| `topic_id` | smallint | FK → `Topics.id` | Nullable |
| `created_for_user_id` | uuid | FK → `Users.id` | Nullable; có giá trị khi câu AI cá nhân hoá |
| `is_approved` | boolean |  | Câu AI chỉ dùng khi đã qua validate |

**`GrammarTips`** — `id` (PK), `pos_id` (FK), `slot_pattern` varchar(40) (`ADJ_BEFORE_NOUN`, `ADV_BEFORE_VERB`, `NOUN_AFTER_ARTICLE`, `VERB_AFTER_TO`…), `explanation_vi` (text), `example_en` (text); UNIQUE `(pos_id, slot_pattern)`.

**`AffixRules`** — `id` (PK), `affix` varchar(20), `affix_type` enum(`prefix`,`suffix`), `result_pos_id` (FK → `PartsOfSpeech.id`), `source_pos_id` (FK, nullable), `explanation_vi`, `example_en`; UNIQUE `(affix, affix_type, result_pos_id)`.

### 4.4 Nhóm phiên chơi

**`StudyPacks`** — `id` uuid PK; `user_id` FK → `Users.id`; `source_type` enum(`topic`,`pos`,`family`,`review`); `topic_ids` smallint\[\]; `pos_ids` smallint\[\]; `family_id` integer (FK, nullable); `status` enum(`in_progress`,`completed`,`abandoned`); `current_level` smallint (1–3); `completed_at` timestamptz.

**`PackWords`** — PK `(pack_id, vocab_id)`; `pack_id` FK → `StudyPacks.id`; `vocab_id` FK → `Vocabularies.id`; `position` smallint.

**`GameSessions`**

| Field | Kiểu | Khoá | Mô tả |
| --- | --- | --- | --- |
| `id` | uuid | PK |  |
| `user_id` | uuid | FK → `Users.id` |  |
| `pack_id` | uuid | FK → `StudyPacks.id` |  |
| `game_code` | enum(`flip_card`,`fill_blank`,`speed_quiz`,`word_basket`,`family_morph`,`audio_shooter`,`topic_express`) |  |  |
| `level` | smallint |  | 1–3 |
| `round_no` | smallint |  | Round trong level |
| `mode` | varchar(30) |  | `word_meaning`, `letter_blank`, … |
| `seed` | bigint |  | Tái lập thứ tự xáo trộn |
| `started_at` / `finished_at` | timestamptz |  |  |
| `duration_ms` | integer |  | Thời gian hoàn thành |
| `score` | integer |  | Điểm do server tính lại |
| `max_combo` | smallint |  |  |
| `accuracy` | numeric(5,2) |  | Phần trăm |
| `hearts_left` | smallint |  |  |
| `stars` | smallint |  | 0–3 |
| `result` | enum(`win`,`lose`,`abandoned`) |  |  |
| `xp_earned` / `coins_earned` | integer |  |  |
| `is_repeat` | boolean |  | Chơi lại level đã qua |
| `difficulty_tier` | smallint |  |  |
| `client_version` | varchar(20) |  |  |

Chỉ mục: `(user_id, started_at DESC)`, `(game_code, score DESC)`.

**`GameLogs`** — bảng ghi từng câu trả lời, partition theo tháng trên `created_at`.

| Field | Kiểu | Khoá | Mô tả |
| --- | --- | --- | --- |
| `id` | bigserial | PK |  |
| `session_id` | uuid | FK → `GameSessions.id` |  |
| `user_id` | uuid | FK → `Users.id` | Denormalize để truy vấn nhanh |
| `vocab_id` | bigint | FK → `Vocabularies.id` |  |
| `client_event_id` | uuid | UNIQUE | Khoá idempotency |
| `question_type` | varchar(20) |  | `1`, `2A`, `2B`, `3A`, `3B`, `3C`, `4`, `5`, `6A`, `6B`, `7` |
| `is_correct` | boolean |  |  |
| `attempt_no` | smallint |  | 1 hoặc 2 |
| `response_ms` | integer |  | Thời gian phản hồi |
| `hint_used` | boolean |  |  |
| `user_answer` / `correct_answer` | varchar(120) |  | Phục vụ phân tích lỗi phổ biến |
| `combo_at_time` | smallint |  |  |
| `score_delta` | integer |  |  |

Chỉ mục: `(user_id, vocab_id)`, `(session_id)`.

### 4.5 `UserWordProgress` — trạng thái thuộc từ & SRS

PK `(user_id, vocab_id)`.

| Field | Kiểu | Mô tả |
| --- | --- | --- |
| `user_id` | uuid, FK → `Users.id` |  |
| `vocab_id` | bigint, FK → `Vocabularies.id` |  |
| `status` | enum(`new`,`learning`,`reviewing`,`mastered`) | Mặc định `new` |
| `repetition` | smallint | Số lần nhớ đúng liên tiếp theo SM-2 |
| `ease_factor` | numeric(3,2) | Mặc định 2.50, tối thiểu 1.30 |
| `interval_days` | integer | Khoảng cách đến lần ôn kế tiếp |
| `next_review_at` | timestamptz | Mốc ôn tiếp theo |
| `last_reviewed_at` | timestamptz |  |
| `last_quality` | smallint | `q` gần nhất (1–5) |
| `correct_count` / `wrong_count` / `lapse_count` | integer | Bộ đếm tích luỹ |
| `correct_streak` | smallint | Số lần đúng liên tiếp (dùng để rời Sổ tay) |
| `best_level_passed` | smallint | 0–3 |
| `in_notebook` | boolean | Từ nằm trong Sổ tay từ sai |
| `notebook_added_at` | timestamptz |  |
| `first_seen_at` | timestamptz |  |

Chỉ mục: `(user_id, next_review_at) WHERE status <> 'new'` và `(user_id) WHERE in_notebook`.

Truy vấn hàng đợi ôn tập:

```sql
SELECT v.*
FROM user_word_progress p
JOIN vocabularies v ON v.id = p.vocab_id
WHERE p.user_id = :uid AND (p.next_review_at <= now() OR p.in_notebook)
ORDER BY p.in_notebook DESC, p.next_review_at ASC
LIMIT :n;
```

Thuật toán cập nhật, chạy trong một transaction khi `POST /sessions/:id/complete`:

```
for each vocab_id trong GameLogs của phiên:
    q = min(q của mọi event thuộc vocab_id)          # lấy q thấp nhất
    p = get_or_create(user_id, vocab_id)
    if q < 3:
        p.repetition = 0; p.lapse_count += 1; p.correct_streak = 0
        p.next_review_at = now() + 10 minutes; p.in_notebook = true
    else:
        p.repetition += 1; p.correct_streak += 1
        interval = 1 if p.repetition == 1 else 3 if p.repetition == 2 else round(p.interval_days * p.ease_factor)
        p.interval_days = interval; p.next_review_at = now() + interval days
        if p.correct_streak >= 2: p.in_notebook = false
    p.ease_factor = max(1.3, p.ease_factor + 0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    p.status = 'mastered' if (p.repetition >= 4 and p.interval_days >= 21) else 'reviewing' if p.repetition >= 1 else 'learning'
    p.last_quality = q; p.last_reviewed_at = now()
```

### 4.6 Nhóm gamification

| Bảng | Trường chính (kiểu) | Ghi chú |
| --- | --- | --- |
| `Badges` | `id` smallint PK; `code` varchar UNIQUE; `name_vi`; `description_vi`; `icon_url`; `criteria` jsonb | `criteria` ví dụ `{ "metric": "correct_by_pos", "pos": "noun", "target": 200 }` |
| `UserBadges` | PK `(user_id, badge_id)`; `earned_at` timestamptz | Cấp huy hiệu khi hoàn tất phiên |
| `ShopItems` | `id` smallint PK; `code` UNIQUE; `name_vi`; `item_type` enum(`consumable`,`cosmetic`); `price_coins` integer; `effect` jsonb; `is_active` boolean | Giá và hiệu ứng theo mục 1.2 |
| `UserInventory` | PK `(user_id, item_id)`; `quantity` integer `CHECK (quantity >= 0)`; `equipped` boolean | Mua và dùng vật phẩm |
| `CoinTransactions` | `id` bigserial PK; `user_id` FK; `delta` integer; `reason` enum(`session_reward`,`daily_quest`,`purchase`,`refund`,`admin`); `ref_id` uuid; `balance_after` integer | Sổ cái; `Users.coins` chỉ là số dư cache, luôn cập nhật cùng giao dịch |
| `DailyQuests` | PK `(user_id, quest_date, quest_code)`; `target` smallint; `progress` smallint; `claimed` boolean | 3 dòng/user/ngày |

## PHẦN 5: Thiết kế Giao diện (UI/UX Wireframe)

### 5.1 Hệ thống thiết kế

| Thành phần | Quy định |
| --- | --- |
| Màu thương hiệu | Primary Indigo `#4F46E5`; Success `#10B981`; Error `#EF4444` (chỉ dùng cho phản hồi sai); nền sáng `#F8FAFC`, nền tối `#0F172A`. |
| Màu theo loại từ (cố định toàn hệ thống) | Danh từ `#3B82F6` · Động từ `#EC4899` · Tính từ `#10B981` · Trạng từ `#F59E0B` · Cụm động từ `#8B5CF6`. Luôn đi kèm chip chữ viết tắt `N / V / Adj / Adv / PV` để không phụ thuộc vào màu (hỗ trợ người mù màu). |
| Phông chữ | Tiêu đề `Fredoka` 600; nội dung `Nunito` 400/700; IPA dùng `Noto Sans` (đủ ký tự phiên âm); số điểm bật `tabular-nums`. Chữ từ vựng trên thẻ ≥ 28 px ở mobile. |
| Bố cục | Lưới 8 px; bo góc thẻ 16 px; nút chính cao 56 px; vùng chạm tối thiểu 48×48 px; thiết kế mobile-first, canvas game 1080×1920. |
| Chế độ hiển thị | Light/Dark; tôn trọng `prefers-reduced-motion` (tắt hiệu ứng lớn); công tắc riêng cho âm thanh và rung. |

### 5.2 Dashboard

Desktop chia 3 cột; mobile xếp 1 cột theo thứ tự: Nhiệm vụ → Ôn tập → Tiến độ → Xếp hạng.

```
+---------------------------------------------------------------------------+
| [Logo]  Dashboard  Thư viện  Ôn tập (12)  Xếp hạng  Shop    Coins 340  Streak 7  (Avatar) |
+---------------------------------------------------------------------------+
| Chào bạn!                [ Lv 5  ▓▓▓▓▓▓░░░░  640 / 1118 XP ]              |
|                                                                           |
| +--------------------------+ +----------------+ +------------------------+ |
| | NHIỆM VỤ HÔM NAY         | | ÔN TẬP SRS     | | XẾP HẠNG TUẦN          | |
| | [x] Ôn 10 từ (6/10)      | | 12 từ đến hạn  | | 1. Minh   2,340 XP     | |
| | [ ] Đạt combo x2         | | [ ÔN NGAY > ]  | | 2. Hà     2,105 XP     | |
| | [ ] Hoàn thành 1 pack    | | Sổ tay sai: 8  | | ...                    | |
| | [ TIẾP TỤC HỌC > ]       | +----------------+ | 7. Bạn    1,020 XP     | |
| +--------------------------+                    +------------------------+ |
| TIẾN ĐỘ THEO CHỦ ĐỀ   Du lịch ▓▓▓░ 42%   Công sở ▓░░░ 18%   Công nghệ ▓▓░░ 31% |
| TIẾN ĐỘ THEO LOẠI TỪ  N ▓▓▓▓   V ▓▓▓   Adj ▓▓   Adv ▓   PV ░               |
| CHUỖI NGÀY HỌC        T2 T3 T4 T5 T6 T7 CN   [x][x][x][x][x][ ][ ]          |
+---------------------------------------------------------------------------+
```

Micro-interactions: biểu tượng Streak “bốc lửa” khi tăng ngày; thanh XP đổ đầy 600 ms ease-out; các số đếm (XP, coins) chạy count-up; level up bắn confetti; nút ÔN NGAY nhịp nhẹ (scale 1.0 → 1.04, chu kỳ 2 giây) khi có từ đến hạn.

### 5.3 Màn hình chơi game

HUD dùng chung cho mọi game; vùng board đổi theo `game_code`.

```
+--------------------------------+
| [X]  ▓▓▓▓▓▓▓░░░   00:42   [||] |  thanh tiến độ câu + timer + tạm dừng
| ♥ ♥ ♥ ♥ ♡              1,250 pt |  Heart + điểm
|              COMBO x2          |
+--------------------------------+
|                                |
|        [ BOARD THEO GAME ]     |  chiếm ≥ 60% chiều cao
|                                |
+--------------------------------+
| [ Gợi ý (2) ]       [ Bỏ qua ] |
+--------------------------------+
```

Desktop: board căn giữa, rộng tối đa 960 px, HUD dính phía trên; hai bên hiện danh sách 10 từ của pack ở dạng thu gọn để người chơi tham chiếu.

| Game | Bố cục board |
| --- | --- |
| G1 Flip Card | Lưới thẻ 4×5, thẻ lật 3D; thẻ từ viền theo màu POS |
| G2 Fill Blank | Câu ở giữa với ô khuyết nhấp nháy; dưới là bàn phím chữ (2A) hoặc 4 nút đáp án (2B) |
| G3 Speed Quiz | Từ lớn ở giữa kèm chỉ thị ĐỒNG/TRÁI NGHĨA; 4 nút đáp án; thanh time bank chạy ngang trên cùng. 3B: khay chunk kéo–thả |
| G4 Word Basket | Canvas từ rơi; 3–5 rổ ở đáy, nhãn và màu theo POS |
| G5 Word Family Morph | Từ gốc ở giữa, 4 ô POS xung quanh, khay 8 thẻ bên dưới |
| G6 Audio Shooter | Nền bầu trời, 5 bong bóng trôi ngang, nút loa lớn ở góc, tâm ngắm theo con trỏ |
| G7 Topic Express | Băng chuyền dọc ở giữa, 3 ga chủ đề hiển thị icon + tên ở trái/trên/phải |

| Sự kiện | Hiệu ứng hình ảnh | Âm thanh | Rung |
| --- | --- | --- | --- |
| Lật thẻ | `rotateY 0→180°`, 300 ms | `sfx_flip` | — |
| Trả lời đúng | Ô/thẻ xanh nhấp nháy; chữ điểm (ví dụ `+120`) bay lên 600 ms; hạt sáng | `sfx_correct`, cao độ tăng theo combo (C → G) | 10 ms |
| Lên mốc combo | Viền lửa quanh HUD; chữ `COMBO x2!` phóng to | `sfx_combo_up` | 20 ms |
| Trả lời sai | Rung ngang 300 ms, viền đỏ, Heart vỡ | `sfx_wrong` | 2 nhịp 40 ms |
| Còn ≤ 5 giây | Thanh timer chuyển đỏ, nhấp nháy 1 Hz | Tick mỗi giây | — |
| Hết Heart | Màn hình mờ dần sang xám, hiện modal Thử lại / Ôn nhanh | `sfx_gameover` | 80 ms |
| Chiến thắng | Confetti 2 giây; từng sao hiện lần lượt (cách nhau 300 ms) | `sfx_win`, mỗi sao một `sfx_star` | 30 ms |
| Phát âm từ | Sóng âm chạy quanh nút loa trong lúc audio phát | Audio của từ | — |

Ghi chú triển khai: Framer Motion `spring` với `stiffness 300`, `damping 20`; mọi hiệu ứng chuyển động lớn tắt khi bật `prefers-reduced-motion`; âm thanh preload bằng Howler.js ở màn Lobby.

### 5.4 Các màn hình còn lại

| Màn hình | Bố cục | Điểm nhấn UX |
| --- | --- | --- |
| Landing | Hero + demo game 30 giây, 3 thẻ giới thiệu 3 cấp độ, CTA cố định ở đáy trên mobile | Chơi thử không cần đăng ký để giảm ma sát |
| Library | Lưới Chủ đề (thẻ lớn, icon, vòng tiến độ); hàng chip POS (đúng màu) dưới ô tìm kiếm; công tắc “Học theo họ từ”; nút nổi “Tạo Pack (10 từ)” | Chip POS chọn nhiều; hiện số từ khả dụng theo bộ lọc |
| Lobby | Carousel 10 thẻ từ (từ, IPA, nghĩa, chip POS, nút loa); thanh 3 chặng L1 → L2 → L3 (khoá/mở); nút Bắt đầu | Cho nghe và xem trước 30 giây trước khi chơi |
| Result | 3 sao hiện tuần tự; bảng điểm (score, accuracy, max combo, XP, coins); danh sách “Từ cần ôn” kèm nút nghe | Nêu rõ các từ đã tự vào Sổ tay; hai CTA Ôn ngay / Pack tiếp theo |
| Review | Hai tab “Sổ tay từ sai” và “Đến hạn SRS”; thẻ từ có huy hiệu `lapse_count`; bộ lọc Chủ đề / Loại từ | Nút “Ôn dạng game” (chọn G2 / G3 / G6); nút “Đã thuộc” để gỡ từ khỏi Sổ tay thủ công |
| Profile | Avatar + khung, bản đồ nhiệt streak 12 tuần, lưới huy hiệu (đã/chưa đạt), biểu đồ radar accuracy theo 5 loại từ | Radar cho thấy loại từ yếu nhất để gợi ý pack tiếp theo |

## PHẦN 6: Kiến trúc Kỹ thuật (Tech Stack) & Danh sách API

### 6.1 Tech Stack đề xuất

| Tầng | Lựa chọn | Lý do |
| --- | --- | --- |
| Frontend framework | Next.js 15 (App Router) + React 19 + TypeScript | SSR cho Landing (SEO), CSR cho khu vực game; một codebase cho web và PWA |
| UI | Tailwind CSS 4 + shadcn/ui (Radix) | Dựng nhanh, có sẵn accessibility |
| Animation UI | Framer Motion | Flip card, ExplainSheet, HUD, hiệu ứng điểm |
| Game canvas | Phaser 3, nạp lười (dynamic import) cho G4, G6, G7 | Physics arcade, xử lý input chạm; chỉ tải khi vào game cần canvas |
| Game dạng DOM | G1, G2, G3, G5 dựng bằng DOM + Framer Motion + dnd-kit | Nhẹ hơn canvas, dễ kiểm thử a11y và E2E |
| State | XState (state machine của `GameEngine`), Zustand (UI state), TanStack Query (server state) | State machine khớp trực tiếp với luồng `idle → playing → finished` ở Phần 3 |
| Âm thanh | Howler.js; dự phòng Web Speech API (TTS) | Preload nhiều file, phát chồng; TTS khi thiếu audio |
| Offline | PWA (Workbox) + IndexedDB qua Dexie | Autosave phiên, hàng đợi `AnswerEvent` khi mất mạng |
| Backend | NestJS (Node.js 22, TypeScript), REST + OpenAPI (Swagger) | Module hoá rõ ràng, dùng chung type với frontend qua package `shared` |
| ORM | Prisma (migration, type-safe); SQL thuần cho Pack Builder và job SRS | Truy vấn lọc đa chiều và cập nhật hàng loạt cần kiểm soát SQL |
| Cơ sở dữ liệu | PostgreSQL 16 | Quan hệ chặt, JSONB, partition cho `GameLogs`, GIN trigram |
| Cache & hàng đợi | Redis 7 (ZSET cho Leaderboard, rate limit, cache nội dung) + BullMQ | Leaderboard theo thời gian thực; job nền cho SRS, streak, AI, tính từ dễ nhầm |
| Lưu trữ & CDN | Cloudflare R2 + CDN (mp3/ogg, webp/avif) | Chi phí thấp, tải nhanh audio và ảnh |
| Xác thực | JWT access 15 phút + refresh token httpOnly cookie 30 ngày (xoay vòng); Google OAuth 2.0 | Cân bằng bảo mật và trải nghiệm |
| AI | LLM API qua `AiSentenceService` (validate + cache + hạn mức) | Cách ly nhà cung cấp, kiểm soát chi phí |
| Quan sát & phân tích | Sentry, Prometheus/Grafana, PostHog | Lỗi, hiệu năng, funnel người dùng |
| CI/CD & hạ tầng | GitHub Actions, Docker; Frontend trên Vercel, Backend trên Fly.io hoặc AWS ECS | Triển khai nhanh, dễ mở rộng |
| Kiểm thử | Vitest + Testing Library, Playwright (E2E), Jest + Supertest (API), k6 (tải) | Phủ đủ unit, tích hợp, E2E, tải |

```
[Browser / PWA]
  Next.js UI + GameEngine (XState) + Dexie (IndexedDB queue)
        |  HTTPS (REST /api/v1, JWT)
        v
[API Gateway / NestJS]
  Auth | Content | Pack | Session | Review(SRS) | Social | Shop | AI | Admin
     |            |              |                   |
     v            v              v                   v
[PostgreSQL]   [Redis]     [BullMQ workers]     [LLM API]
                (ZSET,      SRS, streak cron,
                 cache)     confusable job
     ^
     |-- [R2 + CDN]: audio, hình ảnh
```

### 6.2 Quy ước API

| Hạng mục | Quy ước |
| --- | --- |
| Base URL | `/api/v1`, JSON UTF-8 |
| Xác thực | Header `Authorization: Bearer <access_token>` (trừ nhóm Auth) |
| Thời gian | ISO 8601, UTC |
| Phân trang | `?page=1&limit=20`; response có `total` |
| Lỗi chuẩn | `{ "error": { "code": "PACK_NOT_FOUND", "message": "...", "details": {} } }` kèm HTTP status tương ứng (400, 401, 403, 404, 409, 422, 429) |
| Idempotency | `POST` ghi dữ liệu nhận `Idempotency-Key` hoặc `client_event_id`; gửi lại cùng khoá trả về kết quả cũ |
| Giới hạn tốc độ | 100 request/phút/user; `POST /ai/sentences` tối đa 20 lượt/ngày/user |
| Nguyên tắc | Server là nguồn chân lý cho điểm, XP, coins, SRS; client chỉ gửi sự kiện thô |

### 6.3 Danh sách endpoint

**Nhóm Auth & Hồ sơ**

| Method | Endpoint | Request body | Response mẫu |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ "email", "password", "display_name" }` | `201 { "user": { "id", "email" }, "access_token" }` |
| POST | `/auth/login` | `{ "email", "password" }` | `200 { "access_token", "user" }` |
| POST | `/auth/google` | `{ "id_token" }` | `200 { "access_token", "user" }` |
| POST | `/auth/refresh` | (cookie refresh) | `200 { "access_token" }` |
| POST | `/auth/logout` | — | `204` |
| GET | `/me` | — | `{ "id", "display_name", "level", "xp", "coins", "streak_current", "cefr_level", "onboarded" }` |
| PUT | `/me` | `{ "display_name"?, "daily_goal_words"?, "timezone"? }` | `200` user đã cập nhật |
| POST | `/onboarding/placement` | `{ "answers": [ { "question_id", "answer" } ] }` | `{ "cefr_level": "B1", "score": 7 }` |

**Nhóm Nội dung**

| Method | Endpoint | Request / Query | Response mẫu |
| --- | --- | --- | --- |
| GET | `/topics` | — | `{ "items": [ { "id", "slug", "name_vi", "word_count", "progress_pct" } ] }` |
| GET | `/parts-of-speech` | — | `{ "items": [ { "id", "code", "name_vi", "color_hex" } ] }` |
| GET | `/vocabularies` | `?topic=&pos=&family_id=&q=&page=&limit=` | `{ "items": [ ... ], "total": 312 }` |
| GET | `/vocabularies/:id` | — | Chi tiết từ kèm `sentences`, `synonyms`, `antonyms`, `family` |
| GET | `/families/:id` | — | `{ "id", "root_word", "members": [ { "vocab_id", "headword", "pos" } ] }` |

**Nhóm Pack & Phiên chơi**

| Method | Endpoint | Request body | Response mẫu |
| --- | --- | --- | --- |
| POST | `/packs` | `{ "source_type", "topic_ids"?, "pos_ids"?, "family_id"? }` | `201 { "pack_id", "words": [ ... ], "levels": [ ... ] }` |
| GET | `/packs/:id` | — | `{ "pack_id", "status", "current_level", "words": [ ... ] }` |
| POST | `/sessions` | `{ "pack_id", "level", "game_code", "round_no" }` | `201 { "session_id", "seed", "config": { "hearts", "time_limit_ms" }, "questions": [ ... ] }` |
| POST | `/sessions/:id/events` | `{ "events": [ AnswerEvent ] }` | `202 { "accepted": 5, "duplicates": 0 }` |
| POST | `/sessions/:id/complete` | `{ "finished_at", "duration_ms", "result_client" }` | `200` kết quả đầy đủ (xem mẫu bên dưới) |
| POST | `/sessions/:id/abandon` | — | `204` |

**Nhóm Ôn tập & Tiến độ**

| Method | Endpoint | Request / Query | Response mẫu |
| --- | --- | --- | --- |
| GET | `/review/queue` | `?limit=20&topic=&pos=` | `{ "due_count": 12, "notebook_count": 8, "items": [ ... ] }` |
| POST | `/review/answers` | `{ "answers": [ { "vocab_id", "quality", "client_event_id" } ] }` | `200 { "updated": 10 }` |
| DELETE | `/review/notebook/:vocabId` | — | `204` (đánh dấu đã thuộc, gỡ khỏi Sổ tay) |
| GET | `/progress/summary` | — | `{ "mastered_count", "by_topic": [ ... ], "by_pos": [ ... ] }` |

**Nhóm Xã hội & Gamification**

| Method | Endpoint | Request / Query | Response mẫu |
| --- | --- | --- | --- |
| GET | `/leaderboard` | `?scope=` (`weekly`, `monthly` hoặc `all`), `&limit=50` | `{ "items": [ { "rank", "user", "xp" } ], "me": { "rank", "xp" } }` |
| GET | `/badges` | — | `{ "items": [ { "code", "name_vi", "earned_at": null } ] }` |
| GET | `/shop/items` | — | `{ "items": [ { "code", "name_vi", "price_coins" } ] }` |
| POST | `/shop/purchase` | `{ "item_code", "quantity" }` | `{ "coins_left", "inventory": [ ... ] }` |
| POST | `/inventory/use` | `{ "item_code", "session_id"? }` | `{ "effect": { ... } }` |
| GET | `/quests/today` | — | `{ "items": [ { "code", "target", "progress", "claimed" } ] }` |
| POST | `/quests/:code/claim` | — | `{ "coins_added": 20 }` |

**Nhóm AI & Quản trị**

| Method | Endpoint | Request body | Response mẫu |
| --- | --- | --- | --- |
| POST | `/ai/sentences` | `{ "vocab_id", "topic_id"?, "count"? }` | `{ "items": [ { "id", "sentence", "translation_vi" } ] }`; `429` khi vượt hạn mức |
| POST | `/admin/vocabularies` | Đối tượng `Vocabularies` (quyền `editor`/`admin`) | `201 { "id" }` |
| PUT | `/admin/vocabularies/:id` | Các trường cần sửa | `200` bản ghi mới |
| POST | `/admin/vocabularies/import` | File CSV (multipart) | `{ "created": 120, "errors": [ ... ] }` |
| POST | `/admin/uploads/presign` | `{ "filename", "content_type" }` | `{ "upload_url", "public_url" }` |

### 6.4 Mẫu request / response chi tiết

**`POST /packs` — response**

```json
{
  "pack_id": "0192f3a0-7c1e-7a55-9d4b-2f6a1c0e8b11",
  "source_type": "topic",
  "words": [
    { "vocab_id": 1204, "headword": "itinerary", "pos": "noun", "ipa_uk": "/aɪˈtɪn.ər.ər.i/", "meaning_vi": "lịch trình", "audio_url": "https://cdn.vocabquest.app/a/itinerary_uk.mp3", "is_review": false }
  ],
  "levels": [
    { "level": 1, "rounds": [ { "round_no": 1, "game_code": "flip_card" } ] },
    { "level": 2, "rounds": [ { "round_no": 1, "game_code": "fill_blank" }, { "round_no": 2, "game_code": "topic_express" } ] },
    { "level": 3, "rounds": [ { "round_no": 1, "game_code": "speed_quiz" } ] }
  ]
}
```

**`POST /sessions/:id/events` — request**

```json
{
  "events": [
    {
      "client_event_id": "7b1d2c9e-4f3a-4a8e-9a55-0c6e2d1f7a10",
      "vocab_id": 1204,
      "question_type": "2B",
      "is_correct": false,
      "attempt_no": 1,
      "response_ms": 6420,
      "hint_used": false,
      "user_answer": "decision",
      "correct_answer": "decisive",
      "combo_at_time": 2
    }
  ]
}
```

**`POST /sessions/:id/complete` — response**

```json
{
  "session_id": "0192f3b1-0a4d-7e21-b0c7-5d8f9a1e2c33",
  "result": "win",
  "score": 1840,
  "accuracy": 80.0,
  "stars": 2,
  "xp_earned": 142,
  "coins_earned": 11,
  "level_up": false,
  "streak": { "current": 8, "extended_today": true },
  "wrong_words": [
    { "vocab_id": 1204, "headword": "itinerary", "next_review_at": "2026-10-28T09:10:00Z" }
  ],
  "new_badges": [ "first_quest" ],
  "next": { "level": 3, "game_code": "speed_quiz" }
}
```

### 6.5 Yêu cầu phi chức năng

| Hạng mục | Mục tiêu |
| --- | --- |
| Hiệu năng API | p95 < 200 ms cho `GET`; `POST /sessions/:id/events` xử lý theo lô, p95 < 300 ms |
| Hiệu năng client | Màn game tải < 2 giây trên 4G; game Phaser ≥ 55 FPS trên Android tầm trung |
| Bảo mật | Mật khẩu Argon2id; CORS giới hạn domain; validate mọi input bằng schema; không tin điểm client; rà soát OWASP Top 10 trước khi ra mắt |
| Khả dụng | Phiên chơi dở không mất khi rớt mạng (IndexedDB + gửi lại idempotent); backup DB hằng ngày |
| Khả năng tiếp cận | WCAG 2.1 AA: tương phản, điều khiển bàn phím cho mọi game, chip chữ đi kèm màu POS |

## PHẦN 7: Lộ trình Phát triển (Development Roadmap — MVP)

*Giả định đội ngũ: 2 Frontend, 2 Backend, 1 Designer, 1 QA, 1 Content (bán thời gian); mỗi phase 4 tuần. **MVP = hết Phase 2 (tuần 8).***

| Phase | Thời gian | Mục tiêu |
| --- | --- | --- |
| 1 | Tuần 1–4 | Nền tảng, nội dung đầu tiên và game đầu tiên chạy được end-to-end |
| 2 | Tuần 5–8 | Vòng lặp học cốt lõi: 3 cấp độ, SRS, Sổ tay, Dashboard — **MVP** |
| 3 | Tuần 9–12 | Mở rộng 4 game mới, Leaderboard, Huy hiệu, Shop |
| 4 | Tuần 13–16 | AI câu ví dụ, tối ưu, nội dung quy mô lớn, ra mắt |

### Phase 1 — Nền tảng & Game đầu tiên (Tuần 1–4)

**Công việc**

- Khởi tạo monorepo (`web`, `api`, `shared`), CI/CD, môi trường dev/staging.
- Migration các bảng: `Users`, `Topics`, `PartsOfSpeech`, `WordFamilies`, `Vocabularies`, `VocabTopics`, `ExampleSentences`, `StudyPacks`, `PackWords`, `GameSessions`, `GameLogs`.
- Auth (email + Google), JWT + refresh, `GET/PUT /me`; trang Landing, Login, Register.
- CMS cơ bản và import CSV; nạp 600 từ đầu tiên (≥ 3 chủ đề, đủ 5 loại từ, ≥ 20 họ từ) kèm IPA và audio.
- Library, Pack Builder v1 (chỉ từ mới), Lobby.
- `GameEngine` + HUD dùng chung + G1 Flip Card; trang Result v1.

**Kiểm thử & tiêu chí hoàn thành:** user mới đăng ký → tạo pack → chơi G1 → `GameSession` được lưu; unit test logic điểm/combo ≥ 80% coverage; E2E Playwright cho luồng trên; Lighthouse mobile ≥ 80.

### Phase 2 — Vòng lặp học cốt lõi, MVP (Tuần 5–8)

**Công việc**

- G2 (2A, 2B) và G3 (3A, 3B, 3C); Hearts, Combo, Sao, XP; `GrammarTips`, `AffixRules`, `VocabRelations`; ExplainSheet.
- `UserWordProgress` + SRS (mục 1.2 và 4.5); `POST /sessions/:id/complete` chạy transaction; Sổ tay từ sai; `GET /review/queue`; Pack Builder v2 (có từ đến hạn).
- Dashboard, Streak + cron, XP/Level; Onboarding + placement test.
- PWA, autosave IndexedDB, sự kiện idempotent.

**Kiểm thử & tiêu chí hoàn thành:** closed beta 30–50 user; D1 retention ≥ 35%; thuật toán SRS có ≥ 20 test case dạng bảng (`q` → `interval`, `ease_factor`); test offline không mất dữ liệu phiên; API p95 < 300 ms.

### Phase 3 — Mở rộng game & xã hội (Tuần 9–12)

**Công việc**

- G4, G5, G6, G7 (Phaser nạp lười cho G4/G6/G7); ma trận xoay game theo `source_type`; Adaptive Difficulty.
- Leaderboard (Redis ZSET) + `UserXpDaily`; Badges; Shop + Inventory + `CoinTransactions`; Daily Quest.
- Hoàn thiện micro-interactions, âm thanh, dark mode, a11y.

**Kiểm thử & tiêu chí hoàn thành:** test luật chơi dạng bảng cho từng game (đầu vào → điểm, Heart, kết quả); game canvas ≥ 55 FPS trên Android tầm trung; test đồng thời cho mua hàng (không âm coins, không trùng giao dịch); playtest với 10 người dùng.

### Phase 4 — AI, tối ưu & ra mắt (Tuần 13–16)

**Công việc**

- AI Contextual Sentences: pipeline validate, cache, hạn mức; job tạo audio cho câu AI.
- PostHog: funnel Library → Pack → L3, báo cáo lỗi phổ biến từ `GameLogs`.
- Load test k6 (1.000 user đồng thời), tối ưu index và cache, chống gian lận (`response_ms`, `duration_ms`).
- Mở rộng nội dung ≥ 3.000 từ (IELTS/TOEIC); rà soát OWASP, backup, giám sát; public beta rồi ra mắt.

**Kiểm thử & tiêu chí hoàn thành:** API p95 < 200 ms ở 1.000 CCU; tỷ lệ câu AI bị loại khi validate < 15%; D7 retention ≥ 20%; không còn lỗi mức nghiêm trọng đang mở.

### Rủi ro chính & biện pháp

| Rủi ro | Biện pháp |
| --- | --- |
| Chuẩn bị nội dung (IPA, audio, ảnh, họ từ) tốn công và dễ sai | Bắt đầu từ Phase 1 với quy trình CMS + import CSV; dùng TTS làm audio dự phòng; có bước duyệt `is_published` |
| Lệch điểm giữa client và server | Server tính lại điểm từ `GameLogs`; client chỉ hiển thị tạm |
| Hiệu năng game canvas trên máy yếu | Nạp lười Phaser; có chế độ giảm hiệu ứng; G4/G7 có phương án DOM dự phòng |
| Chi phí AI tăng nhanh | Cache theo `(vocab_id, cefr_level, topic_id)`, hạn mức theo user, dùng câu tĩnh làm dự phòng |
| Người học bỏ giữa chừng vì quá nhiều Heart bị trừ | Adaptive Difficulty, “Ôn nhanh” 30 giây, theo dõi tỷ lệ bỏ phiên theo `game_code` để chỉnh ngưỡng |
