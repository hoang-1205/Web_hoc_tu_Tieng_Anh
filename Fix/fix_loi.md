# Báo cáo lỗi VocabQuest

## Lần sửa [1]

### Lỗi 1 — Pack Builder đưa nội dung chưa được duyệt vào pack
**Mô tả lỗi:** Hàm `createPack` lấy từ trực tiếp từ `data.vocabularies` mà không lọc `review_status = approved` và `is_published = true`. Khi thiếu từ trong pool, phần backfill còn lấy từ toàn bộ kho từ vựng, không bảo toàn bộ lọc chủ đề/loại từ/họ từ. Điều này vi phạm quy định chỉ đưa nội dung đã duyệt vào pack và khiến pack có thể chứa từ sai chủ đề.

**Cách sửa:** Chỉ tạo pool từ các mục có `review_status === 'approved'` và `is_published === true`. Khi bù từ, vẫn áp dụng cùng điều kiện duyệt và bộ lọc nguồn; nếu không đủ 10 từ thì trả số lượng thực tế hoặc báo thiếu dữ liệu, không lấy từ ngoài phạm vi.

### Lỗi 2 — Round 2 của L2 không thể được chơi đúng luồng
**Mô tả lỗi:** Pack cấu hình L2 gồm Round 1 `fill_blank` và Round 2 `sentence_builder`, nhưng trang Lobby chỉ chọn game theo `current_level`, luôn đặt `round_no: 1`. Khi một round thắng, `completeSession` tăng thẳng `pack.current_level` lên `session.level + 1`; Round 1 L2 vì vậy bỏ qua Sentence Builder và nhảy sang L3. API hoàn tất cũng chỉ trả game theo level, không xét round.

**Cách sửa:** Tiến trạng thái pack theo cặp level/round dựa trên `pack.levels`; sau khi thắng L2 Round 1, giữ L2 và chuyển sang Round 2 với `sentence_builder`. Chỉ chuyển L3 sau khi qua cả hai round L2. Lobby và response `next` phải lấy đúng round/game tiếp theo từ cấu hình pack.

### Lỗi 3 — Điều kiện thắng Adventure dùng chung ngưỡng 60% cho mọi game
**Mô tả lỗi:** `completeSession` xác định thắng bằng `accuracy >= 60` cho tất cả level/game. Đặc tả yêu cầu L2 và L3 đạt tối thiểu 70% theo từng round; Learning mới được bỏ ngưỡng accuracy. Hiện kết quả server có thể cho qua màn khi chưa đạt yêu cầu.

**Cách sửa:** Tính ngưỡng từ cấu hình game/level/round và kiểm tra đúng điều kiện thắng của round. Giữ chế độ Learning theo quy tắc riêng: hoàn thành mọi câu thì qua, không kiểm tra Heart hay accuracy.

### Lỗi 4 — Hoàn tất phiên không idempotent và cập nhật lặp phần thưởng/SRS
**Mô tả lỗi:** Gọi `POST /sessions/:id/complete` nhiều lần vẫn chạy lại toàn bộ cập nhật XP, coins, streak, SRS và tiến độ pack. Tài liệu yêu cầu lần gọi thứ hai trả kết quả cũ và không cấp thưởng lần nữa.

**Cách sửa:** Trước khi cập nhật, kiểm tra `finished_at`/`rewarded_at`. Nếu phiên đã hoàn tất, trả kết quả đã lưu; nếu chưa, cập nhật phiên và mọi dữ liệu liên quan đúng một lần trong một transaction/ thao tác nguyên tử.

### Lỗi 5 — SRS lấy kết quả cuối thay vì chất lượng thấp nhất trong phiên
**Mô tả lỗi:** `vocabResults.set` ghi đè kết quả trước đó của cùng từ mỗi khi gặp câu tiếp theo. Nếu một từ được hỏi nhiều lần trong phiên, chất lượng lưu cuối cùng có thể cao hơn lần sai trước, trái quy định mỗi từ cập nhật SRS một lần bằng `q` thấp nhất trong phiên.

**Cách sửa:** Khi gom kết quả theo `vocab_id`, lưu `min(q hiện tại, q mới)`; chỉ cập nhật tiến độ/SRS một lần cho mỗi từ sau khi đã xử lý toàn bộ event của phiên.

### Lỗi 6 — API nhận event không lưu hoặc chống gửi trùng
**Mô tả lỗi:** Endpoint `/sessions/:id/events` chỉ đếm event hợp lệ rồi trả `accepted`; các event không được ghi vào log hay lưu vào phiên. Không kiểm tra `client_event_id` trùng và điều kiện thời gian tối thiểu là 200 ms thay vì tối thiểu 250 ms cùng thời gian đọc câu theo đặc tả. Client gửi event theo lô nhưng dữ liệu này sẽ mất trước bước hoàn tất nếu phiên được đồng bộ riêng.

**Cách sửa:** Lưu event hợp lệ vào log phiên, đặt ràng buộc duy nhất theo `client_event_id`, trả lại các event trùng theo cơ chế idempotent; kiểm tra `response_ms >= 250` và ngưỡng đọc tối thiểu theo độ dài câu trước khi chấp nhận.

### Lỗi 7 — Trang chơi không tải session theo ID mà tự tạo session mới
**Mô tả lỗi:** `/app/play/:sessionId` gọi các endpoint không trả session theo ID, sau đó tự tạo pack và session mới với level 1, game `flip_card`, chế độ `adventure`. Vì vậy ID từ Lobby bị bỏ qua; người dùng không chơi pack/level/mode đã chọn, và mỗi lần mở trang có thể sinh thêm pack/session rác.

**Cách sửa:** Bổ sung API đọc session theo ID (có kiểm tra chủ sở hữu) và tải session đó khi mở trang chơi. Không tự tạo pack/session dự phòng; nếu ID không tồn tại hoặc pack không hợp lệ, hiển thị lỗi và cho quay lại Lobby.

## Lần sửa [2]

### Lỗi 8 — Flip Card ghi nhận event sai câu nên không thể qua L1 Adventure
**Mô tả lỗi:** Trong `FlipCardBoard`, mọi cặp ghép và mọi lần lật sai đều gửi `question_id` của `questions[0]`. Server vì vậy chỉ chấm câu đầu tiên; chín câu còn lại không có event. Với Adventure, accuracy tối đa chỉ có thể đạt 10%, thấp hơn ngưỡng 60% của Flip Card nên người chơi không thể qua L1. Ở cặp cuối, `onComplete` còn dùng state `events` cũ trong callback `setTimeout`, có thể làm mất event ghép cuối.

**Cách sửa:** Gắn mỗi cặp thẻ với đúng `question_id`/`vocab_id`, lưu kết quả ghép/sai theo đúng câu và tính accuracy theo quy tắc Flip Card. Khi hoàn tất, truyền danh sách event mới nhất đã bao gồm cặp cuối thay vì state cũ.

### Lỗi 9 — Learning có thể hoàn tất dù còn câu chưa trả lời
**Mô tả lỗi:** `completeSession` coi phiên Learning là thắng nếu tổng số event đạt số câu (`mergedEvents.length >= session.questions.length`). Điều kiện này đếm event, không đếm `question_id` duy nhất; gửi nhiều event cho cùng một câu có thể vượt ngưỡng trong khi các câu khác chưa được trả lời. Vòng xử lý kết quả cũng chỉ chọn event đầu tiên cho mỗi câu.

**Cách sửa:** Chỉ cho hoàn tất khi có kết quả hợp lệ cho đủ từng `question_id` trong session. Khử trùng lặp theo câu/lần thử và từ chối hoặc bỏ qua event ngoài danh sách câu; không dùng số lượng event thô làm điều kiện hoàn tất.

### Lỗi 10 — Kết quả thử lại của một câu bị bỏ qua khi server chấm
**Mô tả lỗi:** `completeSession` dùng `mergedEvents.find(...)` để lấy event đầu tiên có `question_id` tương ứng. Nếu cùng câu có nhiều lần thử (được phân biệt bằng `client_event_id` và `attempt_no`), các lần sau không được tính. Một câu trả lời đúng sau lần sai có thể bị chấm sai và SRS bị ghi `q = 1`, dù đặc tả quy định câu đúng từ lần thử thứ hai trở đi nhận `q = 3`.

**Cách sửa:** Gom tất cả event theo `question_id`, sắp xếp/đánh giá theo `attempt_no`; xác định kết quả cuối của câu và chất lượng SRS theo quy tắc thử lại (đúng sau lần đầu: `q = 3`). Tính accuracy theo lần thử đầu và chỉ cập nhật SRS một lần mỗi từ với `q` thấp nhất trong phiên.


