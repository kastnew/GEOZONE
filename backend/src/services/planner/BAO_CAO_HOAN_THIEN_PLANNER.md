# BÁO CÁO HOÀN THIỆN PHÂN HỆ PLANNER (GEOZONE AI)

Tài liệu này tổng hợp toàn bộ các chức năng, công thức, thuật toán và cấu trúc xử lý đã hoàn thiện trong phân hệ **Planner** (`backend/src/services/planner/`), đồng thời đảm bảo tương thích 100% với hệ thống chung của nhóm.

---

## 1. Tổng quan Kiến trúc Pipeline Mới

Phân hệ Planner xử lý yêu cầu lập lịch trình qua **6 bước nối tiếp** (tích hợp dự báo thời tiết, tối ưu theo tọa độ GPS và hoàn toàn không phụ thuộc cứng vào `zoneId`):

```text
Trip Request (Thành phố, Số ngày, Ngân sách, Sở thích)
   │
   ├──► [Bước 0] weatherService.js      : Lấy dự báo thời tiết từng ngày (Open-Meteo API + Fallback)
   │
   ▼
[Bước 1] candidateFilter.js             : Lọc đa ràng buộc (Ngân sách, Rating, Thời lượng, Bảo vệ 0đ, Fallback)
   │
   ▼
[Bước 2] placeScorer.js                 : Chấm điểm 2 pha (Sở thích 50% + Rating 30% + Chi phí 20% - Phạt trùng loại)
   │
   ▼
[Bước 3] zoneGrouper.js                 : Chuẩn hóa tọa độ GPS & cung cấp hàm đo khoảng cách Haversine
   │
   ▼
[Bước 4] dayAllocator.js                : Chia điểm vào từng ngày (Cụm GPS + Điểm thời tiết + Ngân sách cân bằng)
   │                                      ▲
   ▼                                      │ (Feedback Loop: Kẹt giờ -> Cộng Penalty & Chọn lại)
[Bước 5] timeSlotScheduler.js           : Sinh hoán vị có cắt tỉa -> Xếp lộ trình ngắn nhất & khớp giờ Sáng/Trưa/Chiều/Tối
   │
   └──► [Hỗ trợ] dynamicSwapEngine.js   : Hoán đổi địa điểm theo bán kính GPS <= 5 km (không phân biệt Zone)
```

---

## 2. Chi tiết những gì đã làm & Thuật toán sử dụng

### Bước 0: Dự báo Thời tiết (`weatherService.js`)
* **Công nghệ sử dụng:** Tích hợp **Open-Meteo API** (`api.open-meteo.com`) — miễn phí, không cần API Key.
* **Cơ chế hoạt động:**
  * Dựa trên tọa độ thành phố (`Da Nang`, `Ha Noi`, `Ho Chi Minh`, `Hoi An`, `Hue`, `Da Lat`, `Nha Trang`, `Phu Quoc`) để lấy dự báo thời tiết cho từng ngày đi.
  * Quy đổi mã thời tiết WMO sang 3 trạng thái đơn giản: `SUNNY` (Nắng đẹp), `CLOUDY` (Mát mẻ), `RAINY` (Có mưa), kèm nhiệt độ cao nhất, xác suất mưa và lời khuyên.
  * **An toàn tuyệt đối:** Đặt timeout `2000ms`; nếu mất mạng hoặc API lỗi, tự động chuyển về trạng thái dự phòng (`CLOUDY`) để hệ thống không bao giờ bị gián đoạn.

### Bước 1: Lọc Địa điểm Ứng viên Đa ràng buộc (`candidateFilter.js`)
* **Trần ngân sách đơn lẻ (`maxSinglePlaceCost`):** Tự động loại bỏ địa điểm có vé đơn lẻ vượt quá 65% tổng ngân sách cả chuyến đi.
* **Bảo vệ địa điểm miễn phí (`0đ`) & Điểm `Must-Visit`:** Các địa điểm công cộng miễn phí và các địa điểm người dùng đã chủ động thêm vào **Giỏ Chuyến đi (`mustVisitIds`)** luôn được giữ lại, vượt qua mọi bộ lọc tags hay trần chi phí.
* **Ngưỡng chất lượng & thời lượng:** Loại bỏ địa điểm có `rating < 3.0` hoặc thời lượng tham quan quá dài (`> 360` phút).
* **Fallback 2 tầng:** Nếu lọc theo sở thích bị thiếu số lượng hoặc thiếu độ phủ phân vùng, tự động nạp thêm các địa điểm có `popularity * rating` cao nhất ở các khu vực còn thiếu (kỳ vọng tối thiểu `days * 6` ứng viên).

### Bước 2: Chấm điểm 2 Pha, Thích ứng Ngân sách & Thời tiết (`placeScorer.js`)
* **Hàm `scorePlaces()` (Chấm 1 lần duy nhất các yếu tố tĩnh):**
  * **Pha 1 (`baseScore`):**
    $$\text{BaseScore} = 0.5 \times \text{PreferenceScore} + 0.3 \times \text{RatingScore} + 0.2 \times \text{CostScore}$$
    *(Trong đó `RatingScore = rating / 5.0` thay cho `popularity` cũ).*
  * **Chấm điểm Chi phí theo Ngưỡng Trung bình (`Threshold Cost Scoring`):**
    * Tính mức chi tiêu trung bình kỳ vọng cho 1 địa điểm: `avgPlaceBudget = dailyBudget / 4` (hoặc trung bình cộng giá vé tập ứng viên).
    * Nếu `estimatedCost <= avgPlaceBudget` ➔ cộng chung 1 mức **`costScore = 1.0`** (công bằng tuyệt đối, không thiên vị điểm `0đ`).
    * Nếu `estimatedCost > avgPlaceBudget` ➔ **`costScore = 0.0`**.
  * **Ưu tiên `Must-Visit`:** Các điểm nằm trong `mustVisitIds` được gắn cờ `isMustVisit = true` và nhận điểm tối đa **`totalScore = 2.0`**.
  * **Pha 2 (`diversityPenalty` - Chống lặp loại hình):** Đếm số lần xuất hiện của cùng một loại hình chính trong mỗi Zone. Lần thứ 2 phạt `0.08`, từ lần thứ 3 trở đi phạt lũy tiến `0.15 * số lần`, tránh lịch trình bị trùng lặp nhàm chán.
* **Hàm `applyWeatherAdjustment()` (Chỉ gọi 1 lần cho từng ngày ở Bước 4):**
  * Ngày **Mưa (`RAINY`)**: Trừ `0.25 – 0.35` điểm với các điểm ngoài trời (`beach`, `nature`, `adventure`); cộng `+0.15` điểm cho các điểm trong nhà/ẩm thực/văn hóa (`food`, `culture`, `nightlife`).
  * Ngày **Nắng (`SUNNY`)**: Cộng nhẹ `+0.05` điểm cho các điểm ngoài trời.

### Bước 3: Chuẩn hóa Tọa độ & Đo Khoảng cách GPS (`zoneGrouper.js`)
* **Công thức Haversine (`calculateDistanceKm`):** Tính khoảng cách thực tế (km) giữa hai tọa độ GPS (`latitude`, `longitude`).
* **Chuẩn hóa dữ liệu (`groupPlacesByZone`):** Tính tâm tọa độ thực tế của từng Zone, tự động bù tọa độ tâm Zone nếu địa điểm bị khuyết GPS, và tính điểm đại diện Zone theo Top-4 địa điểm cao nhất (giữ nguyên cấu trúc `Map` tương thích với `plan.controller.js`).

### Bước 4: Phân bổ Ngày theo Cụm GPS (Bán kính 8 km) & Ngân sách Cân bằng (`dayAllocator.js`)
* **Bỏ khóa cứng 1 ngày = 1 Zone & Siết bán kính cụm cứng (`Hard Radius <= 8 km`):**
  * Chỉ nhặt các điểm phụ trong bán kính **`<= 8 km`** quanh điểm Mỏ Neo (chỉ nới tối đa `15 km` khi quanh đó không đủ 2 điểm), loại bỏ hoàn toàn tình trạng nhảy sang ngoại ô 20–30 km gây đi lòng vòng.
* **Quỹ ngân sách cân bằng động (Rolling Budget):** Tính hạn mức ngày `dailyTarget = remainingBudget / remainingDays` (biên độ trần `+20%`), tự động dồn phần dư/thiếu sang ngày hôm sau để không ngày nào chi tiêu quá lệch.
* **Chọn điểm theo Cụm Mỏ Neo (Anchor) & Bắt buộc có `Must-Visit`:**
  * Nếu còn điểm `isMustVisit` chưa đi, ưu tiên chọn làm điểm **Mỏ Neo** của ngày đầu tiên (và ưu tiên gom các điểm `isMustVisit` gần nhau vào cùng ngày).
  * Nhặt thêm các điểm tiếp theo (tối đa **6 điểm/ngày**, dừng sớm nếu chạm ngưỡng thời lượng 8 tiếng hoặc trần ngân sách ngày) dựa trên **Hàm suy giảm khoảng cách theo hàm mũ (`e^(-0.25 * distKm)`)**:
    $$\text{PickScore} = (\text{Điểm địa điểm} \times 0.6) + (e^{-0.25 \times \text{distKm}} \times 0.4) + \text{Bonus nhẹ (+0.05) nếu cùng Zone}$$
  * Quản lý tập `usedPlaceIds` xuyên suốt chuyến đi để **tuyệt đối không trùng lặp địa điểm**.
  * Gắn nhãn `zoneId` / `zoneName` của ngày theo Zone chiếm đa số các điểm đã chọn (giữ hiển thị đẹp trên UI và bản đồ).
* **Vòng lặp Phản hồi Tự sửa lỗi 2 cấp (Feedback Loop với Bước 5):**
  * Sau khi nhặt xong tập điểm cho một ngày, gọi `validateDaySchedule()` của Bước 5 để kiểm tra xem có xếp được khung giờ hợp lệ tuyệt đối không.
  * **Cấp 1:** Nếu bị kẹt giờ, cộng điểm phạt (`-0.6`) cho điểm gây xung đột (luôn **bảo vệ điểm `isMustVisit`** không bị phạt nếu còn điểm thường) và quay lại Bước 4 chọn điểm khác thay thế hợp giờ hơn.
  * **Cấp 2:** Nếu sau khi thay điểm vẫn bị chật/kẹt giờ, tự động **rút bớt 1 điểm** (ví dụ từ 6 xuống 5 hoặc 4 điểm) để giải phóng quỹ thời gian, đảm bảo 100% xếp được chu trình hợp lệ.

### Bước 5: Tối ưu Lộ trình & Khung giờ (`timeSlotScheduler.js`)
* **Thuật toán sử dụng:** **Sinh Hoán Vị có Cắt tỉa nhánh (Backtracking with Pruning)** áp dụng cho $N \le 7$ điểm/ngày (tự động fallback sang **Nearest Neighbor** nếu $N > 7$).
* **Các tiêu chí tối ưu đồng thời:**
  1. **Tổng quãng đường (km) ngắn nhất** (tránh chạy vòng vèo zíc-zắc).
  2. **Kiểm tra giờ mở/đóng cửa (`openingTime`, `closingTime`):** Cắt tỉa nhánh vi phạm giờ đóng cửa hoặc quá giờ kết thúc ngày; tự động đợi đến giờ mở cửa (ví dụ Chợ đêm mở từ `17:30`).
  3. **Khớp khung giờ sinh hoạt Sáng – Trưa – Chiều – Tối:** Thưởng điểm khi quán ăn (`food`) nằm trong khung Trưa (`11:00–13:30`) hoặc Tối (`17:30–20:30`), và điểm `nightlife` nằm từ `17:30` trở đi.
  4. **Thời gian di chuyển động & Nghỉ trưa/ăn tối 1 tiếng 30 phút (90p):**
     * Tính thời gian di chuyển thực tế theo khoảng cách GPS: $\max(10,\ \text{round}(\frac{\text{distanceKm}}{25} \times 60) + 5)$ phút.
     * **Nghỉ trưa bắt buộc +1 tiếng 30 phút (90p):** Ngay sau khi điểm cuối buổi sáng kết thúc (muộn nhất `12:30`), hệ thống luôn chừa khoảng trống 90 phút nghỉ ngơi trước khi chuyển sang hoạt động chiều.
     * **Nghỉ & ăn tối +1 tiếng 30 phút (90p):** Tự động chèn khi bước vào khung `17:00–19:00` (nếu điểm tiếp theo không phải quán ăn `food`).
* **Hàm `validateDaySchedule()`:** Kiểm tra nhanh tính khả thi của lịch trình và chỉ định đích danh `culpritPlaceId` (điểm gây xung đột lớn nhất) để Bước 4 tự động sửa sai.

### Hỗ trợ: Hoán đổi Địa điểm Động (`dynamicSwapEngine.js` & `SwapModal.jsx`)
* **Nối trực tiếp lên Web UI:** Khi bấm `⇄ Đổi`, Frontend gọi trực tiếp API sang `dynamicSwapEngine.js` (`returnMultiple: true`) để nhận về **Top 8 gợi ý đã chấm điểm**.
* **Kiểm tra chặt chẽ 4 ràng buộc thực tế:**
  1. **Không trùng lặp:** Loại trừ toàn bộ các điểm đã có trong mọi ngày (`excludedPlaceIds`).
  2. **Tổng ngân sách (`remainingBudget`):** Chi phí điểm mới $\le$ ngân sách còn lại cho phép (`totalBudget - (currentCost - oldCost)`), đảm bảo **không bao giờ vượt tổng ngân sách** khi đổi điểm.
  3. **Giờ mở/đóng cửa (`isOpenAtSlot`):** Chỉ gợi ý các điểm đang mở cửa tại khung giờ `slotStartTime` cần đổi.
  4. **Thời lượng (`maxDurationAllowed`):** Đảm bảo điểm mới không làm tổng thời lượng ngày vượt quá giới hạn.
* **Tìm kiếm theo bán kính GPS (`5 km -> 10 km -> toàn thành phố`):** Không khóa cứng theo Zone; chấm điểm bằng `scorePlaces` mới kết hợp `proximityBonus`.

---

## 3. Kết quả Kiểm thử (`backend/test/planner.test.js`)

Đã viết bộ kiểm thử tự động độc lập cho toàn bộ pipeline mới và kiểm tra cú pháp toàn bộ các file:
* `node --check` trên tất cả các file Planner & Controllers: **0 lỗi cú pháp**.
* `node backend/test/planner.test.js`: **PASS 100%** (**8/8 bài test** + kiểm tra `weatherService` fallback):
  1. Đo khoảng cách Haversine GPS chính xác (`0.42 km` giữa Bảo tàng Chăm và Cầu Rồng).
  2. Chấm điểm `rating` + phạt lặp loại + điều chỉnh thời tiết (`SUNNY` vs `RAINY`).
  3. Chuẩn hóa tọa độ và phân cụm `zoneGrouper`.
  4. Phân bổ 2 ngày: 8 địa điểm, 0 trùng lặp, kiểm soát tốt ngân sách và thích ứng thời tiết.
  5. Sinh hoán vị có cắt tỉa: xếp Chợ đêm Sơn Trà đúng sau `17:30`, tính tổng km và thời gian di chuyển động.
  6. **Feedback Loop (Bước 5 ➔ Bước 4):** Giả lập ngày bị kẹt do chọn trùng nhiều điểm buổi tối (`18:30–19:00`), hệ thống tự động trừ Penalty và chọn lại được bộ điểm hợp lệ 100%.
  7. **Hard Radius 8 km & Must-Visit Guarantee:** Kiểm chứng điểm `Must-Visit` luôn đạt `totalScore = 2.0`, chắc chắn xuất hiện trong lịch trình và các điểm cùng ngày không bị kéo đi lòng vòng.
  8. **Threshold CostScore & Nghỉ trưa 1h30p:** Kiểm chứng điểm `0đ` và `150k` (`<= avgPlaceBudget`) nhận cùng `costScore = 1.0`, điểm `500k` (`> avgPlaceBudget`) nhận `0.0`, và tự động chèn 90 phút (1h30p) nghỉ trưa khi lịch trình đi qua khung `11:30–13:30`.
