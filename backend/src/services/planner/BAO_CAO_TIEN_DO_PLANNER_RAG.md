# BÁO CÁO TIẾN ĐỘ: PHẦN THUẬT TOÁN LẬP LỊCH TRÌNH & AI (RAG)

## 1. Tóm tắt chung: Hiện tại hệ thống đã làm được đến đâu?
Hiện tại, **luồng tạo lịch trình tự động từ đầu đến cuối đã chạy được bản cơ bản (đạt khoảng 55% khối lượng)**.  
Khi người dùng nhập vào: *Thành phố muốn đến, Số ngày đi, Tổng ngân sách và Sở thích (ẩm thực, biển, văn hóa...)*, hệ thống đã có thể tự động chọn lọc địa điểm, chia vào từng ngày theo khu vực địa lý, tính tổng chi phí và kết hợp với AI để xuất ra một lịch trình hoàn chỉnh.

---

## 2. Những phần đã hoàn thiện xong (Đã chạy tốt)

### 2.1. Chọn lọc địa điểm thông minh theo túi tiền và chất lượng
Hệ thống đã giải quyết xong bài toán lọc dữ liệu đầu vào để không đưa các địa điểm vô lý vào lịch trình:
* **Tự động loại bỏ điểm quá đắt:** Những địa điểm có giá vé đơn lẻ chiếm phần lớn ngân sách cả chuyến đi sẽ bị loại ngay từ đầu để tránh làm vỡ kế hoạch chi tiêu của khách.
* **Ưu tiên giữ lại các điểm tham quan miễn phí (0đ):** Các địa điểm nổi tiếng không mất vé (như bãi biển, cầu biểu tượng, chùa...) luôn được giữ lại để giúp cân bằng ngân sách cho những chuyến đi tiết kiệm.
* **Đảm bảo chất lượng và đủ khu vực đi chơi:** Tự động lọc bỏ các điểm có đánh giá thấp (dưới 3 sao) hoặc tốn quá nhiều thời gian. Nếu người dùng chọn sở thích quá hẹp dẫn đến thiếu chỗ đi, hệ thống tự động bổ sung thêm các điểm nổi tiếng khác từ nhiều khu vực khác nhau để đủ lịch trình cho tất cả các ngày.

### 2.2. Công thức chấm điểm địa điểm & Chống lặp loại hình nhàm chán
Để biết địa điểm nào đáng đi nhất cho từng khách hàng, thuật toán chấm điểm đã được hoàn thiện với 2 bước:
* **Bước 1 — Chấm điểm theo 3 tiêu chí:** Kết hợp giữa **Độ khớp sở thích của khách (50%)**, **Điểm đánh giá thực tế trên thang 5 sao (30%)** và **Mức độ tiết kiệm chi phí (20%)**.
* **Bước 2 — Hạn chế chọn quá nhiều địa điểm cùng loại:** Trước đây nếu khách chọn thích "Ẩm thực", hệ thống rất dễ chọn cả ngày toàn quán ăn. Hiện tại thuật toán đã có cơ chế **trừ điểm phạt nếu lặp lại cùng một loại hình**: trong một khu vực, từ địa điểm thứ 2, thứ 3 cùng loại trở đi sẽ bị giảm điểm ưu tiên để nhường chỗ cho các hoạt động khác (như ngắm cảnh, vui chơi, văn hóa), giúp lịch trình trong ngày phong phú và cân bằng hơn.

### 2.3. Kết nối AI viết lời dẫn lịch trình (Phiên bản chưa dùng RAG)
* Đã kết nối thành công với AI (Google Gemini) theo nguyên tắc **chống AI "bịa chuyện"**: Toàn bộ việc chọn địa điểm, tính giờ và cộng tiền đều do thuật toán tính toán chính xác trước; AI chỉ nhận kết quả đó để viết lời giới thiệu và dẫn dắt hành trình cho tự nhiên, tuyệt đối không tự ý thêm địa điểm ảo hay tính sai ngân sách của người dùng.

---

## 3. Những phần đang tiếp tục cải tiến & hoàn thiện (Đang thực hiện)

Qua quá trình chạy thử bản cơ bản, phần phân bổ ngày và sắp xếp giờ đi vẫn còn một số điểm cứng nhắc. Hiện tại tôi đang tập trung nâng cấp 3 phần chính sau:

### 3.1. Chia khu vực (Zone) và phân bổ tiền giữa các ngày linh hoạt hơn
* **Hiện trạng:** Bản cơ bản đang ép cứng *1 ngày chỉ đi đúng 1 khu vực (Zone)* và chia đều ngân sách một cách máy móc.
* **Đang nâng cấp:**
  1. **Xử lý khu vực có quá nhiều điểm hay:** Nếu một khu vực trung tâm có rất nhiều điểm hấp dẫn không thể đi hết trong 1 ngày, thuật toán sẽ cho phép khách khám phá tiếp khu vực đó ở ngày hôm sau (với các điểm mới hoàn toàn) thay vì ép phải chuyển sang một khu vực xa xôi ít điểm thú vị hơn.
  2. **Cho phép 1 ngày kết hợp 2 khu vực gần nhau:** Nếu 2 khu vực nằm sát nhau (di chuyển rất gần) và bên khu vực kế bên có địa điểm đúng sở thích của khách hơn, hệ thống sẽ cho phép ghép cả 2 khu vực vào cùng 1 ngày.
  3. **Chia ngân sách cân bằng giữa các ngày:** Điều chỉnh để không có ngày nào tiêu quá nhiều tiền so với các ngày còn lại; nếu ngày hôm trước tiêu dư hoặc hụt thì tự động cân đối lại cho các ngày hôm sau.

### 3.2. Tối ưu thứ tự đường đi và xếp khớp khung giờ Sáng – Trưa – Chiều – Tối
* **Hiện trạng:** Các địa điểm trong 1 ngày mới chỉ đang được xếp nối đuôi nhau theo điểm số từ cao xuống thấp và mặc định mỗi chặng di chuyển mất 15 phút. Điều này dễ khiến khách phải chạy vòng vèo hoặc xếp quán ăn/chợ đêm vào buổi sáng.
* **Đang nâng cấp:**
  * Đang xây dựng thuật toán sắp xếp lại **điểm nào đi trước, điểm nào đi sau** dựa trên tọa độ thực tế để tạo thành một cung đường liền mạch, ngắn nhất, không bị đi ngược đường.
  * Tự động tính thời gian di chuyển theo khoảng cách thực tế và đặt địa điểm vào đúng khung giờ mở cửa cũng như nhịp sinh hoạt trong ngày (**Sáng** tham quan ➔ **Trưa** ăn uống/nghỉ ngơi ➔ **Chiều** vui chơi/biển ➔ **Tối** dạo phố/chợ đêm).

### 3.3. Hoàn thiện phần RAG (Bổ sung "Cẩm nang du lịch bản địa" cho AI)
* **Hiện trạng:** Khung kỹ thuật của RAG (bộ máy tìm kiếm kiến thức bổ trợ) đã dựng xong, nhưng AI hiện mới chỉ giới thiệu lịch trình ở mức cơ bản, chưa có nhiều mẹo thực tế sâu sắc.
* **Đang nâng cấp:**
  * Đang biên tập và nạp dữ liệu **"Cẩm nang bản địa"** cho từng địa điểm (ví dụ: đến chợ này nên ăn món gì, đi chùa cần lưu ý trang phục ra sao, mấy giờ ngắm hoàng hôn đẹp nhất, giờ nào cầu Rồng phun lửa...).
  * Khi thuật toán chốt xong danh sách địa điểm của từng ngày, bộ máy RAG sẽ tự động tìm đúng các mẹo thực tế của những địa điểm đó và nạp cho AI, giúp lời khuyên trong lịch trình chi tiết và hữu ích như một hướng dẫn viên bản địa thật sự.

---

## 4. Kế hoạch hoàn thiện trong giai đoạn tới
1. Hoàn thành thuật toán chia ngày linh hoạt (hỗ trợ 1 khu vực đi nhiều ngày / 1 ngày kết hợp 2 khu vực gần nhau) và cân bằng chi phí mỗi ngày.
2. Hoàn thành thuật toán sắp xếp thứ tự lộ trình ngắn nhất theo khung giờ Sáng – Trưa – Chiều – Tối và cập nhật cho cả tính năng "Đổi địa điểm" của người dùng.
3. Nạp xong bộ dữ liệu cẩm nang du lịch vào RAG và chạy thử nghiệm so sánh chất lượng lịch trình giữa hai chế độ **Không có RAG** và **Có RAG**.
