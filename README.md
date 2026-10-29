# VocabQuest — Nền Tảng Học Từ Vựng Tiếng Anh Game Hóa Thông Minh (v2.0)

Hệ thống web fullstack hoàn chỉnh được xây dựng dựa trên **Bản Phân Tích Hệ Thống & Đặc Tả Kỹ Thuật VocabQuest v2.0 (28/10/2026)**.

---

## 🌟 Tính Năng Nổi Bật & Kiến Trúc Triển Khai

### 1. Danh Mục 8 Mini-Game Tương Tác (G1–G8)
- **G1 — Memory Flip Card (L1 Nhận diện):** Lật thẻ 3D ghép 10 cặp từ vựng ↔ nghĩa tiếng Việt ↔ IPA. Phát âm chuẩn và viền màu theo loại từ (POS).
- **G2 — Fill in the Blanks (L2 Round A):**
  - **2A (`letter_blank`):** Ẩn 40% chữ cái, bàn phím chữ cái tương tác, hỗ trợ 2 lần thử.
  - **2B (`pos_form`):** Điền dạng từ theo ngữ cảnh ngữ pháp (Word Formation), phân biệt họ từ (Word Families).
- **G8 — Sentence Builder (L2 Round B mặc định):** Kéo-thả/chạm các mảnh cụm từ (chunks) để tạo câu hoàn chỉnh, kiểm tra quy tắc trật tự từ (`word_order_rule`).
- **G3 — Speed Quiz (L3 Phản xạ):** Áp lực Time Bank 60 giây (+2s đúng, -5s sai), trắc nghiệm từ đồng nghĩa/trái nghĩa chuẩn loại từ (POS).
- **G4 — Word Basket (L2 Rổ loại từ):** Từ vựng rơi từ trên xuống, phân loại vào 5 rổ POS (phím tắt 1–5 hoặc chạm rổ).
- **G5 — Word Family Morph (L2/L3 Biến hình họ từ):** Từ gốc ở trung tâm, 4 ô `Noun / Verb / Adj / Adv`, khay thẻ bài trừ từ giả dạng `decisation`.
- **G6 — Audio Shooter (L3 Bắn từ âm thanh):** Nghe phát âm và bắn bong bóng chứa các cặp từ dễ gây nhầm lẫn (`ship/sheep`, `affect/effect`).
- **G7 — Topic Express (L2/L3 Tàu chủ đề):** Băng chuyền đưa từ vào cổng quyết định, điều hướng từ về 3 ga chủ đề (Du lịch, Công sở, Công nghệ).

---

### 2. Thuật Toán Lặp Lại Ngắt Quãng (SM-2 SRS) & Đo Thành Thạo (mastered_v2)
- **Hệ số chất lượng `q` chuẩn hóa phía server:**
  - `q = 5`: Trả lời đúng lần 1, không gợi ý, ở câu tự tạo đáp án (Sentence Builder, gõ từ).
  - `q = 4`: Trả lời đúng lần 1, không gợi ý, ở câu trắc nghiệm.
  - `q = 3`: Cần gợi ý hoặc đúng ở lần thử thứ 2 trở đi.
  - `q = 1`: Trả lời sai hoặc hết giờ (tự động vào Sổ tay từ sai).
- **Quy tắc rời Sổ tay:** Chỉ rời sổ tay khi người học trả lời đúng ở 2 lần ôn SRS liên tiếp.
- **Quy tắc `mastered_v2` (Section 8.4):** Một từ chỉ đạt `mastered` khi đồng thời:
  1. `repetition ≥ 4` và `interval_days ≥ 21`.
  2. Có ít nhất 1 câu đúng lần đầu ở kỹ năng nhớ nghĩa (`meaning_recall` / `recognition`).
  3. Có ít nhất 1 câu đúng lần đầu ở kỹ năng sử dụng (`pos_form` / `context_fill` / `sentence_use` / `spelling`).

---

### 3. Hệ Thống 5 Loại Từ Cố Định (POS Color & Icon System)
Bảo đảm tính tiếp cận cho người mù màu (WCAG 2.1 AA) với màu sắc và biểu tượng riêng biệt:
- **Danh từ (`noun`):** Xanh dương `#3B82F6` · Icon Khối lập phương (`cube`) · Viết tắt: `N`
- **Động từ (`verb`):** Hồng `#EC4899` · Icon Tia sét (`lightning`) · Viết tắt: `V`
- **Tính từ (`adj`):** Xanh ngọc lục bảo `#10B981` · Icon Ngôi sao (`star`) · Viết tắt: `Adj`
- **Trạng từ (`adv`):** Hổ phách `#F59E0B` · Icon Cánh gió (`wind`) · Viết tắt: `Adv`
- **Cụm động từ (`phrasal_verb`):** Tím `#8B5CF6` · Icon Mắt xích (`link`) · Viết tắt: `PV`

---

### 4. Hai Chế Độ Chơi (Learning vs Adventure)
- **Học Tự Do (Learning Mode):** Không áp lực thời gian, vô hạn Máu (Heart), nghe lại audio không giới hạn, nút "Giải thích" sau mọi câu hỏi.
- **Thử Thách (Adventure Mode):** Áp lực Timer / Time Bank, Máu (3–5 Hearts), hệ số combo x1 → x3 (tối đa x4), cấp sao (1–3★), tính điểm và xếp hạng.

---

### 5. Sơ Đồ Định Tuyến (Sitemap) Hoàn Chỉnh
- `/`: Landing Page với **Live Demo tương tác 30 giây (không cần đăng nhập)**.
- `/onboarding`: Bài test xếp trình độ ước lượng 10 câu (A1–B1), chọn mục tiêu và lượng từ/ngày.
- `/app/dashboard`: Trả lời 3 câu hỏi: *Hôm nay học gì? Tôi tiến bộ đến đâu? Tôi nên học tiếp gì?*
- `/app/library`: Lưới Chủ đề, chip lọc POS, công tắc Họ từ, nút Tạo Pack (10 từ).
- `/app/quest/:packId`: Lobby xem trước 10 từ kèm phát âm, lộ trình 3 cấp độ L1 → L2 → L3.
- `/app/play/:sessionId`: Màn hình chơi với GameHUD, GameBoard và ExplainSheet.
- `/app/result/:sessionId`: Kết quả 3 sao, điểm, XP, Coins, danh sách từ vào Sổ tay.
- `/app/review`: Tab "Sổ tay từ sai" & "Đến hạn SRS", nút Ôn dạng game.
- `/app/path`: Lộ trình học cá nhân hóa (A1 Giao tiếp, A2 Du lịch, B1 Công sở).
- `/app/leaderboard`: Bảng xếp hạng Tuần / Tháng / Mọi thời đại.
- `/app/shop`: Cửa hàng vật phẩm (Streak Freeze, Heart Refill, Hint Token...).
- `/app/profile`: Bản đồ nhiệt Streak 12 tuần, huy hiệu, biểu đồ độ chính xác 5 loại từ.
- `/app/report`: Báo cáo tuần tách bạch 3 bộ đếm (Từ đã gặp, Từ đúng lần 1, Từ thông thạo).
- `/admin`: CMS quản trị nội dung từ vựng và hàng chờ xử lý báo lỗi từ ExplainSheet.

---

## 🚀 Hướng Dẫn Chạy Ứng Dụng

### Yêu Cầu Môi Trường
- **Node.js**: v18+ (khuyên dùng Node.js v24 hoặc v26 LTS đã được tích hợp).
- **Trình duyệt**: Chrome, Edge, Safari hoặc Firefox hỗ trợ Web Audio và Web Speech API.

### 1. Khởi chạy Chế độ Phát triển (Development)
```bash
npm run dev
```
Truy cập: `http://localhost:3000`

### 2. Khởi chạy Chế độ Sản xuất (Production)
```bash
npm run build
npm run start
```
Hệ thống sẽ chạy máy chủ Next.js siêu tốc tại cổng 3000.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)
- **Frontend & Backend:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling & UI:** Tailwind CSS + Lucide React Icons + Canvas Confetti
- **Audio Engine:** Web Audio API (Synthesized SFX không phụ thuộc file ngoài) + Web Speech API TTS (UK & US)
- **Database & State:** Data Store lưu trữ JSON/bộ nhớ với bộ dữ liệu seed chuẩn hóa hàng trăm mục từ vựng, câu ví dụ, họ từ, mẹo ngữ pháp.
