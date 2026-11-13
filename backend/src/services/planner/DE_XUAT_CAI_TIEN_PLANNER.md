# Đề xuất Cải tiến Phân hệ Planner (GeoZone AI)

Tài liệu này tổng hợp các cải tiến **đã triển khai** ở Bước 1 & Bước 2 và **đề xuất định hướng cải tiến** cho Bước 3, Bước 4 & Bước 5 trong thư mục `backend/src/services/planner/`.

---

## Phần 1: Các cải tiến đã hoàn thành (Bước 1 & Bước 2)

### 1. Bước 1 — `candidateFilter.js` (Lọc địa điểm ứng viên)
Nâng cấp từ lọc đơn thuần theo thành phố và tags sang lọc đa ràng buộc:
- **Ràng buộc trần ngân sách đơn lẻ (`maxSinglePlaceCost`):** Loại bỏ các địa điểm có chi phí vé đơn lẻ vượt quá 65% tổng ngân sách cả chuyến đi (giữ mức trần tối thiểu 300.000đ).
- **Bảo vệ các địa điểm miễn phí (`0đ`):** Các điểm tham quan có `estimatedCost === 0` luôn được giữ lại làm điểm cân bằng chi phí.
- **Ngưỡng chất lượng & thời lượng khả thi:** Loại bỏ địa điểm có `rating < 3.0` hoặc thời lượng trải nghiệm quá dài (`duration > 360` phút).
- **Đảm bảo tính đa dạng phân vùng (`Zone Diversity`):** Kiểm tra số lượng Zone thu được phải đáp ứng theo số ngày đi.
- **Cơ chế Fallback 2 tầng:** Khi thiếu Zone hoặc thiếu số lượng ứng viên tối thiểu (`days * 4`), tự động bổ sung các địa điểm phổ biến có điểm đánh giá cao, ưu tiên lấp đầy các Zone còn thiếu trước.

### 2. Bước 2 — `placeScorer.js` (Chấm điểm địa điểm)
Nâng cấp công thức tính điểm theo 2 pha:
- **Pha 1 — Điểm cơ sở (`baseScore`) với `rating` thay cho `popularity`:**
  - `preferenceScore`: Tỷ lệ tag của địa điểm trùng khớp với sở thích (`preferences`) của người dùng.
  - `ratingScore`: Chuẩn hóa trường `rating` từ thang điểm 5.0 sao về thang $[0, 1]$ (`rating / 5.0`, mặc định `4.5` nếu thiếu dữ liệu).
  - `costScore`: `1 - min(estimatedCost / maxCost, 1)` (chi phí càng thấp điểm càng cao).
  - Công thức tổng hợp: `baseScore = wPreference * preferenceScore + wRating * ratingScore + wCost * costScore` (mặc định `0.5 / 0.3 / 0.2`).
- **Pha 2 — Phạt trùng lặp loại địa điểm (`diversityPenalty`):**
  - Hạn chế tình trạng một Zone chọn quá nhiều địa điểm cùng một loại hình chính (`primaryType = tags[0]`).
  - Áp dụng mức phạt lũy tiến trong cùng Zone: lần xuất hiện thứ 1 không phạt (`0`), lần thứ 2 phạt nhẹ (`0.08`), từ lần thứ 3 trở đi phạt tăng dần (`0.15 * số lần`).
  - Điểm cuối cùng: `totalScore = max(0, baseScore - diversityPenalty)`.

---

## Phần 2: Đề xuất Cải tiến cho Bước 3, Bước 4 và Bước 5

*(Lưu ý: Phần này tập trung mô tả các mục tiêu nghiệp vụ, quy tắc và ràng buộc cần xử lý ở từng bước; chưa đi sâu vào chi tiết thuật toán sẽ áp dụng cho phần 4 và phần 5).*

### 1. Bước 3 — `zoneGrouper.js` (Gom nhóm & Tổ chức Phân vùng Địa lý)
- **Đánh giá sức hấp dẫn của Zone dựa trên nhóm điểm tốt nhất:** Thay vì tính trung bình cộng toàn bộ địa điểm trong Zone (dễ bị kéo tụt bởi các điểm ít phù hợp), đánh giá sức mạnh của Zone dựa trên nhóm các địa điểm có điểm cao nhất trong Zone đó.
- **Xác định khoảng cách & các Zone láng giềng:** Tính toán khoảng cách giữa các Zone (dựa trên tọa độ tâm cụm hoặc dữ liệu khoảng cách) để xác định những cặp Zone nằm gần nhau, thuận tiện di chuyển nối tiếp trong ngày.
- **Hỗ trợ chia nhỏ các Zone lớn ("Siêu Zone"):** Đối với những Zone có quá nhiều địa điểm nổi bật không thể đi hết trong một ngày, hỗ trợ tách thành các cụm con theo khu vực để người dùng có thể trải nghiệm Zone đó trong nhiều ngày liên tiếp mà không bị chồng chéo lộ trình.

### 2. Bước 4 — `dayAllocator.js` (Phân bổ Zone & Chọn địa điểm theo Ngày)
- **Xử lý trường hợp 1 Zone có quá nhiều điểm hay cần đi vài ngày:**
  - Không khóa cứng một Zone chỉ được chọn một lần duy nhất cho cả chuyến đi.
  - Sau khi phân bổ xong một ngày, cập nhật lại danh sách các địa điểm còn lại chưa đi trong từng Zone. Nếu các điểm còn lại của một Zone giàu tài nguyên vẫn phù hợp với người dùng hơn so với các Zone khác thì tiếp tục phân bổ Zone đó cho ngày kế tiếp.
- **Cho phép 1 ngày kết hợp tối đa 2 Zone gần nhau:**
  - Mỗi ngày ưu tiên chọn 1 Zone làm khu vực chính.
  - Tuy nhiên, nếu Zone chính chưa đủ lấp đầy các khung giờ hoặc có một địa điểm ở Zone láng giềng rất gần (di chuyển ngắn) nhưng khớp sở thích của người dùng hơn hẳn, cho phép ghép thêm địa điểm của Zone phụ đó vào lộ trình trong ngày.
- **Chia ngân sách cân bằng giữa các ngày & Không trùng lặp:**
  - Điều phối kinh phí từng ngày xoay quanh mức trung bình hợp lý, có ngưỡng trần kiểm soát để không có ngày nào tiêu quá nhiều so với phần còn lại của chuyến đi.
  - Tự động điều chỉnh lại hạn mức ngân sách cho các ngày tiếp theo dựa trên số tiền thực tế còn dư hoặc vượt nhẹ của các ngày trước.
  - Quản lý danh sách địa điểm đã phân bổ xuyên suốt toàn bộ chuyến đi để đảm bảo không chọn trùng lặp địa điểm giữa các ngày.

### 3. Bước 5 — `timeSlotScheduler.js` (Sắp xếp Lộ trình & Khung giờ Chi tiết)
- **Sắp xếp lộ trình hợp lý về quãng đường và thời gian:**
  - Từ tập các địa điểm đã chọn trong ngày, sắp xếp lại thứ tự điểm dừng chân sao cho đường đi liền mạch, tổng quãng đường di chuyển ngắn và tránh đi vòng vèo qua lại.
  - Trong trường hợp ngày đó có đi 2 Zone gần nhau, đảm bảo hoàn thành gọn các địa điểm ở Zone thứ nhất trước rồi mới di chuyển sang Zone thứ hai.
- **Tính toán thời gian di chuyển thực tế:**
  - Thay thế con số ước lượng cố định 15 phút hiện tại bằng thời gian di chuyển ước tính dựa trên khoảng cách địa lý thực tế giữa hai địa điểm kế tiếp nhau.
- **Đưa ra lộ trình đầy đủ các khung giờ (Sáng - Trưa - Chiều - Tối):**
  - Sắp xếp các địa điểm khớp với giờ mở cửa, giờ đóng cửa (`openingTime`, `closingTime`) của từng nơi.
  - Phân bổ hợp lý theo khung giờ sinh hoạt và tính chất địa điểm trong ngày: hoạt động tham quan/ngoài trời vào buổi Sáng – Chiều, ăn uống/nghỉ ngơi vào khung giờ Trưa – Tối, và các điểm vui chơi về đêm vào khung giờ Tối.
