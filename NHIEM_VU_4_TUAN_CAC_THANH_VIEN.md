# Phân Công Nhiệm Vụ 4 Tuần Dự Án GeoZone AI (IT3150) 📅

Tài liệu này xác định chi tiết mục tiêu, công việc từng ngày, sản phẩm đầu ra (Deliverables) và tiêu chí nghiệm thu cho từng thành viên trong nhóm 4 người qua 4 tuần thực hiện đồ án Project I.

---

## BẢNG TỔNG QUAN PHÂN VAI TRÒ

| Thành viên | Vị trí đảm nhiệm | Chuyên môn phụ trách |
|---|---|---|
| **Thành viên 1** | **Data & Database Lead** | Thiết kế CSDL PostgreSQL, thu thập & chuẩn hóa 100-150 địa điểm Đà Nẵng, biên soạn tài liệu tri thức du lịch cho RAG. |
| **Thành viên 2** | **Backend Core & Algorithms Lead** | Xây dựng API Express.js, thiết kế thuật toán 5 bước (Lọc, Chấm điểm, Gom Zone, Knapsack Ngân sách, Timeline) và Dynamic Swap Engine. |
| **Thành viên 3** | **AI & RAG Engineer** | Tích hợp LLM Gemini API, xây dựng 2 phương án (No-RAG vs RAG), thiết kế Vector Retriever và cơ chế khoá dữ liệu chống ảo giác (Anti-Hallucination). |
| **Thành viên 4** | **Frontend UI/UX Lead** | Phát triển giao diện React + Tailwind CSS, xây dựng Timeline tương tác, Form cấu hình tham số, Modal đổi địa điểm và bản đồ phân cụm Zone. |

---

## TUẦN 1: THIẾT LẬP NỀN TẢNG & CHUẨN BỊ DỮ LIỆU
*Mục tiêu tuần 1: CSDL sẵn sàng, dữ liệu sạch, môi trường chạy ổn định cho cả nhóm.*

### Thành viên 1 (Data & Database Lead)
- [ ] **Ngày 1-2:** Cài đặt PostgreSQL cục bộ hoặc Docker. Khởi tạo database `geozone_db`.
- [ ] **Ngày 3-4:** Thu thập danh sách 50 địa điểm đầu tiên tại Đà Nẵng, phân chia vào 5 Zone:
  - Z1: Trung tâm Hải Châu (Chợ Cồn, Bảo tàng Chăm, Cầu Rồng...)
  - Z2: Ven biển Mỹ Khê (Bãi biển, Công viên Biển Đông, hải sản...)
  - Z3: Bán đảo Sơn Trà (Chùa Linh Ứng, Đỉnh Bàn Cờ...)
  - Z4: Ngũ Hành Sơn (Động Huyền Không, Làng đá Non Nước...)
  - Z5: Ngoại ô Hòa Vang (Bà Nà Hills, Suối khoáng nóng...)
- [ ] **Ngày 5-6:** Điền đầy đủ các thuộc tính cho từng địa điểm vào file [data/raw/danang_places.json](file:///c:/Users/Admin/Desktop/GEO_ZONE/data/raw/danang_places.json): `estimatedCost`, `duration`, `openingTime`, `closingTime`, `latitude`, `longitude`, `popularity`, `tags`.
- [ ] **Ngày 7:** Chạy script [data/seed/seed.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/data/seed/seed.js) để nạp thành công vào PostgreSQL.
- **Sản phẩm bàn giao:** File CSDL PostgreSQL đã chứa ít nhất 50 địa điểm có đầy đủ tọa độ và tag.

### Thành viên 2 (Backend Core & Algorithms)
- [ ] **Ngày 1-2:** Cài đặt Node.js, cấu hình Express app tại [backend/src/app.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/app.js) và [backend/src/server.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/server.js).
- [ ] **Ngày 3-4:** Viết [backend/src/services/place.service.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/place.service.js) để truy vấn địa điểm từ Prisma theo `city` và mảng `tags`.
- [ ] **Ngày 5-6:** Viết các unit function đầu tiên cho [backend/src/services/planner/candidateFilter.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/candidateFilter.js): Lọc địa điểm và xử lý fallback khi người dùng chọn tag hiếm.
- [ ] **Ngày 7:** Viết API `GET /api/v1/places/zones` và `GET /api/v1/places/search` để kiểm tra trả về dữ liệu chuẩn JSON.
- **Sản phẩm bàn giao:** Server chạy mượt tại cổng 5000, 2 API kiểm tra dữ liệu hoạt động tốt trên Postman.

### Thành viên 3 (AI & RAG Engineer)
- [ ] **Ngày 1-2:** Đăng ký tài khoản Google AI Studio, lấy `GEMINI_API_KEY` và cấu hình vào file [backend/.env.example](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/.env.example).
- [ ] **Ngày 3-4:** Viết client kết nối Gemini API tại [backend/src/services/ai/llmClient.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/llmClient.js) bằng thư viện `@google/genai`.
- [ ] **Ngày 5-6:** Soạn thảo System Prompt chống ảo giác tại [backend/src/services/ai/prompts/systemPrompts.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/prompts/systemPrompts.js) với các quy tắc cấm thay đổi giá tiền và giờ giấc.
- [ ] **Ngày 7:** Viết hàm test đơn giản gọi Gemini sinh văn bản từ một chuỗi JSON mẫu để đo thời gian phản hồi.
- **Sản phẩm bàn giao:** File kết nối Gemini chạy ổn định, kiểm tra prompt cơ bản sinh đúng JSON mong muốn.

### Thành viên 4 (Frontend UI/UX Lead)
- [ ] **Ngày 1-2:** Khởi tạo dự án React + Vite, cài đặt Tailwind CSS.
- [ ] **Ngày 3-4:** Dựng layout tổng thể với thanh [Header.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/common/Header.jsx) và chân trang [Footer.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/common/Footer.jsx).
- [ ] **Ngày 5-6:** Dựng thành phần [TripInputForm.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/form/TripInputForm.jsx) gồm:
  - Ô chọn thành phố (Đà Nẵng).
  - Dropdown chọn số ngày lưu trú (1 - 4 ngày).
  - Thanh trượt ngân sách [BudgetSlider.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/form/BudgetSlider.jsx).
  - Bộ chọn thẻ sở thích [TagSelector.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/form/TagSelector.jsx) (Ẩm thực, Biển, Văn hóa, Mạo hiểm...).
- [ ] **Ngày 7:** Thêm nút Switch Toggle **"Bật/Tắt RAG (Cẩm nang tri thức)"** lên giao diện.
- **Sản phẩm bàn giao:** Giao diện Form nhập liệu đẹp mắt, responsive trên cả máy tính và điện thoại.

---

## TUẦN 2: PHÁT TRIỂN THUẬT TOÁN CORE & GIAO DIỆN TIMELINE
*Mục tiêu tuần 2: Hoàn thiện logic toán học của Backend và giao diện Timeline của Frontend.*

### Thành viên 1 (Data & Database Lead)
- [ ] **Ngày 8-9:** Mở rộng dataset lên 100 địa điểm chất lượng cao, kiểm tra kỹ giá vé thực tế năm 2026.
- [ ] **Ngày 10-11:** Bổ sung bảng ma trận khoảng cách `ZoneDistance` giữa 5 Zone (thời gian di chuyển trung bình giữa Z1 $\leftrightarrow$ Z2 là 15 phút, Z1 $\leftrightarrow$ Z3 là 25 phút, Z1 $\leftrightarrow$ Z5 là 45 phút).
- [ ] **Ngày 12-13:** Bắt đầu biên tập các file cẩm nang tri thức văn bản trong thư mục `data/knowledge_base/`:
  - [danang_food_guide.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/data/knowledge_base/danang_food_guide.md): Quán ăn nổi tiếng, món đặc sản nên gọi, khung giờ đông đúc.
  - [danang_culture_rules.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/data/knowledge_base/danang_culture_rules.md): Quy định trang phục khi vào chùa, quy tắc chụp ảnh bảo tàng.
  - [travel_tips_zones.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/data/knowledge_base/travel_tips_zones.md): Lưu ý cấm xe máy ga lên Đỉnh Bàn Cờ, thời điểm ngắm hoàng hôn biển Mỹ Khê.
- [ ] **Ngày 14:** Bàn giao bộ tài liệu tri thức cho Thành viên 3.
- **Sản phẩm bàn giao:** Dataset 100 địa điểm hoàn chỉnh và 3 file tài liệu cẩm nang tri thức thực tế.

### Thành viên 2 (Backend Core & Algorithms)
- [ ] **Ngày 8-9:** Cài đặt hàm chấm điểm tại [backend/src/services/planner/placeScorer.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/placeScorer.js) theo công thức toán học có trọng số ($Preference, Popularity, Cost$).
- [ ] **Ngày 10-11:** Cài đặt hàm gom nhóm theo vùng tại [backend/src/services/planner/zoneGrouper.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/zoneGrouper.js), tính điểm trung bình của từng Zone để xếp hạng.
- [ ] **Ngày 12-13:** Cài đặt thuật toán phân bổ ngày [backend/src/services/planner/dayAllocator.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/dayAllocator.js) (Greedy Knapsack):
  - Phân bổ Zone tốt nhất cho từng ngày.
  - Nhặt các địa điểm có điểm cao nhất vào ngày đó sao cho: $Tổng\_tiền \le Ngân\_sách\_ngày \times 1.2$ và $Tổng\_thời\_gian \le 8\_tiếng$.
- [ ] **Ngày 14:** Cài đặt [backend/src/services/planner/timeSlotScheduler.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/timeSlotScheduler.js): Gán khung giờ chi tiết (08:00 - 09:30...), cộng thêm thời gian di chuyển giữa các địa điểm.
- **Sản phẩm bàn giao:** Thuật toán 5 bước chạy hoàn chỉnh, sinh ra được đối tượng JSON Draft Lịch Trình chuẩn xác về tiền và giờ mà chưa cần đến AI.

### Thành viên 3 (AI & RAG Engineer)
- [ ] **Ngày 8-9:** Hoàn thiện [backend/src/services/ai/strategies/directJsonStrategy.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/strategies/directJsonStrategy.js) (**Phương án 1: KHÔNG CÓ RAG**):
  - Nhận Draft JSON từ thuật toán của Thành viên 2.
  - Ghép vào Prompt gửi cho Gemini.
  - Nhận kết quả và chuyển tiếp cho bộ kiểm tra đầu ra.
- [ ] **Ngày 10-11:** Viết bộ hậu kiểm dữ liệu tại [backend/src/services/ai/outputValidator.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/outputValidator.js):
  - Parse JSON trả về từ Gemini.
  - Khóa chặt: giữ nguyên 100% ID địa điểm, giá tiền, thời lượng từ thuật toán Backend; chỉ trích xuất trường `title` và `aiDescription` do AI sinh ra.
- [ ] **Ngày 12-14:** Viết hàm thử nghiệm mô phỏng trường hợp LLM cố tình trả về sai giá vé $\to$ Đảm bảo OutputValidator phát hiện và tự động khôi phục lại giá gốc từ DB.
- **Sản phẩm bàn giao:** Hoàn tất toàn bộ luồng Phương án 1 (No-RAG), cam kết 0% Hallucination về giá vé và thời gian.

### Thành viên 4 (Frontend UI/UX Lead)
- [ ] **Ngày 8-9:** Xây dựng component [PlaceItem.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/timeline/PlaceItem.jsx): Hiển thị khung giờ, tên địa điểm, nhãn Zone, giá tiền (format tiền Việt VNĐ), câu văn mô tả của AI.
- [ ] **Ngày 10-11:** Xây dựng component [DayCard.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/timeline/DayCard.jsx) gom các PlaceItem theo từng ngày, hiển thị tổng ngân sách chi tiêu của ngày đó.
- [ ] **Ngày 12-13:** Xây dựng [TimelineView.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/timeline/TimelineView.jsx): Banner tổng quan hành trình và danh sách tất cả các ngày.
- [ ] **Ngày 14:** Xây dựng [BudgetSummaryCard.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/summary/BudgetSummaryCard.jsx): Bảng so sánh ngân sách dự chi vs chi phí thực tế, có thông báo màu xanh (tiết kiệm) hoặc màu đỏ (vượt ngân sách).
- **Sản phẩm bàn giao:** Giao diện hiển thị lịch trình hoàn chỉnh với dữ liệu giả định (mock data).

---

## TUẦN 3: TRIỂN KHAI RAG & TÍNH NĂNG HOÁN ĐỔI ĐỘNG (DYNAMIC SWAP)
*Mục tiêu tuần 3: Đưa RAG vào hoạt động thực tế, hoàn thành tính năng Dynamic Swap và ghép nối Frontend-Backend.*

### Thành viên 1 (Data & Database Lead)
- [ ] **Ngày 15-16:** Thiết kế bảng `KnowledgeChunk` trong CSDL PostgreSQL để lưu trữ các mẩu cẩm nang văn hóa, ẩm thực.
- [ ] **Ngày 17-18:** Viết script băm nhỏ (chunking) 3 file cẩm nang thành các đoạn văn ngắn (mỗi đoạn 150-250 từ, gắn với `placeId` hoặc `zoneCode`).
- [ ] **Ngày 19-20:** Hỗ trợ Thành viên 3 lưu trữ và index dữ liệu tri thức vào Vector Store.
- [ ] **Ngày 21:** Rà soát lại tính toàn vẹn của toàn bộ dữ liệu CSDL.
- **Sản phẩm bàn giao:** Kho tri thức cẩm nang du lịch được phân đoạn và sẵn sàng cho việc truy xuất.

### Thành viên 2 (Backend Core & Algorithms)
- [ ] **Ngày 15-16:** Xây dựng tính năng Hoán đổi động tại [backend/src/services/planner/dynamicSwapEngine.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/dynamicSwapEngine.js):
  - Nhận vào `currentPlaceId`, `dayNumber`, `targetZoneId`, `remainingBudget`.
  - Truy vấn các địa điểm trong cùng Zone, loại trừ các điểm đã có trong lịch trình, chi phí $\le$ ngân sách còn lại.
  - Chấm điểm các ứng viên và chọn điểm có điểm cao nhất để thay thế.
- [ ] **Ngày 17-18:** Viết controller [backend/src/controllers/swap.controller.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/controllers/swap.controller.js) và route `POST /api/v1/plans/swap`.
- [ ] **Ngày 19-20:** Tích hợp với `plan.controller.js` để kết nối cả 2 luồng: Lập lịch mới và Đổi địa điểm.
- [ ] **Ngày 21:** Viết test case kiểm tra: Đổi địa điểm ở Zone 1 không bao giờ bị nhảy sang Zone khác.
- **Sản phẩm bàn giao:** API Dynamic Swap hoạt động chuẩn xác 100%, bảo toàn tính hợp lý của lịch trình.

### Thành viên 3 (AI & RAG Engineer)
- [ ] **Ngày 15-16:** Xây dựng module vector hóa tại [backend/src/services/ai/rag/embedder.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/rag/embedder.js) và [backend/src/services/ai/rag/vectorStore.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/rag/vectorStore.js) (sử dụng Cosine Similarity).
- [ ] **Ngày 17-18:** Xây dựng module truy xuất tri thức tại [backend/src/services/ai/rag/knowledgeRetriever.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/rag/knowledgeRetriever.js):
  - Khi Backend chọn ra danh sách địa điểm, Retriever tự động tìm kiếm các mẩu cẩm nang liên quan nhất đến địa điểm đó.
- [ ] **Ngày 19-20:** Hoàn thiện [backend/src/services/ai/strategies/ragStrategy.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/strategies/ragStrategy.js) (**Phương án 2: CÓ RAG**):
  - Ghép các đoạn cẩm nang tìm được vào Prompt gửi Gemini với System Instruction `RAG_ENRICHED_SYSTEM_PROMPT`.
  - Yêu cầu Gemini bổ sung trường `aiTravelTip` cho từng hoạt động.
- [ ] **Ngày 21:** Kiểm tra so sánh trực tiếp: Cùng 1 yêu cầu, chạy No-RAG vs chạy RAG để thấy rõ sự khác biệt về chất lượng câu trả lời.
- **Sản phẩm bàn giao:** Hoàn tất toàn bộ kiến trúc RAG, chuyển đổi linh hoạt qua cờ `ENABLE_RAG`.

### Thành viên 4 (Frontend UI/UX Lead)
- [ ] **Ngày 15-16:** Kết nối API thực tế qua [frontend/src/services/api.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/services/api.js) bằng `fetch`: Gửi yêu cầu từ Form lên backend và nhận lịch trình thật.
- [ ] **Ngày 17-18:** Xây dựng popup xác nhận hoán đổi địa điểm [SwapModal.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/timeline/SwapModal.jsx):
  - Khi người dùng nhấn nút "🔄 Đổi địa điểm" tại 1 thẻ, mở modal hiển thị thông tin điểm hiện tại.
  - Khi nhấn "Xác nhận đổi", gọi API `POST /api/v1/plans/swap` và cập nhật lại thẻ đó ngay trên Timeline mà không cần tải lại toàn bộ trang.
- [ ] **Ngày 19-20:** Hiển thị khung **💡 Mẹo bản địa** màu vàng trên thẻ địa điểm khi người dùng kích hoạt chế độ RAG.
- [ ] **Ngày 21:** Thêm hiệu ứng [LoadingSpinner.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/common/LoadingSpinner.jsx) khi đang chờ AI phản hồi.
- **Sản phẩm bàn giao:** Ứng dụng Frontend kết nối mượt mà với Backend, trải nghiệm người dùng liền mạch.

---

## TUẦN 4: TỐI ƯU HÓA, ĐÁNH GIÁ THỰC NGHIỆM & BÁO CÁO ĐỒ ÁN
*Mục tiêu tuần 4: Kiểm thử toàn diện, chuẩn bị số liệu thực nghiệm, hoàn thiện slide và báo cáo Word.*

### Cả 4 Thành viên cùng phối hợp thực hiện:

#### 1. Đánh giá Thực nghiệm (Experimental Evaluation)
- **Thành viên 2 & 3** thực hiện đo đạc trên 30 kịch bản test khác nhau và lập bảng số liệu:
  - **Tỷ lệ vi phạm ngân sách (Budget Violation Rate):** Mục tiêu đạt **0%** nhờ thuật toán Greedy Knapsack.
  - **Tỷ lệ nhảy cóc khu vực (Zone Hopping Rate):** Mục tiêu đạt **0%** nhờ cơ chế gom nhóm Zone-based.
  - **Thời gian phản hồi trung bình (Latency):**
    - Chế độ Không RAG: $\approx 1.2$ giây.
    - Chế độ Có RAG: $\approx 2.4$ giây.
  - **Đánh giá Hallucination:** Kiểm tra ngẫu nhiên 50 địa điểm sinh ra, xác nhận 100% giá vé và địa chỉ trùng khớp với dữ liệu thực tế tại Đà Nẵng.

#### 2. Viết Báo Cáo Kỹ Thuật (Báo Cáo Project I - IT3150)
- **Thành viên 1:** Viết Chương 2 (Cơ sở dữ liệu, thiết kế phân vùng Zone tại Đà Nẵng, nguồn thu thập dữ liệu).
- **Thành viên 2:** Viết Chương 3 (Mô hình hóa bài toán tối ưu, thuật toán chấm điểm, gom cụm và phân bổ lịch trình).
- **Thành viên 3:** Viết Chương 4 (Tích hợp AI, so sánh chuyên sâu 2 phương án RAG vs No-RAG, cơ chế kiểm soát ảo giác).
- **Thành viên 4:** Viết Chương 5 (Thiết kế giao diện người dùng, tính năng Dynamic Swap, đánh giá kết quả thực nghiệm và hướng phát triển).

#### 3. Chuẩn Bị Slide Thuyết Trình & Kịch Bản Demo (Presentation & Demo)
- **Kịch bản Demo trực tiếp (5 phút):**
  1. *Phút 1:* Nhập ngân sách 1.500.000đ cho 2 ngày đi Đà Nẵng, thích ẩm thực và biển. Tắt RAG $\to$ Bấm tạo $\to$ Phản hồi tức thì, hiển thị Ngày 1 đi Zone Trung tâm (Chợ Cồn, Cầu Rồng), Ngày 2 đi Zone Biển (Mỹ Khê). Tổng chi phí 160.000đ (hoàn toàn dưới 1.5tr).
  2. *Phút 2:* Nhấn nút "🔄 Đổi địa điểm" tại Chợ Cồn $\to$ Hệ thống tự động thay thế bằng Bảo tàng Chăm (cùng Zone Trung tâm), tổng chi phí cập nhật chuẩn xác.
  3. *Phút 3:* Bật công tắc **"Kích hoạt RAG"** $\to$ Bấm tạo lại $\to$ Giới thiệu các khung **💡 Mẹo bản địa** do RAG bổ sung: mẹo mang tiền lẻ ăn ốc hút chợ Cồn, lưu ý trang phục dài khi vào viếng chùa Linh Ứng.
  4. *Phút 4-5:* Trình bày bảng so sánh kỹ thuật No-RAG vs RAG và giải thích cơ chế khóa cứng dữ liệu chống Hallucination.

---

## BẢNG TIÊU CHÍ NGHIỆM THU ĐỒ ÁN ĐẠT ĐIỂM TỐI ĐA (ĐIỂM A)

| Tiêu chí đánh giá | Yêu cầu đạt được | File minh chứng |
|---|---|---|
| **Tính đúng đắn thuật toán** | Lịch trình 100% không vượt ngân sách, các điểm trong cùng 1 ngày thuộc cùng 1 khu vực địa lý hợp lý. | [dayAllocator.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/dayAllocator.js), [zoneGrouper.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/zoneGrouper.js) |
| **Tính sáng tạo & tương tác** | Tính năng Hoán đổi động (Dynamic Swap) cho phép đổi điểm tức thì mà không phá vỡ lịch trình. | [dynamicSwapEngine.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/dynamicSwapEngine.js), [SwapModal.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/timeline/SwapModal.jsx) |
| **Ứng dụng AI chuẩn mực** | Có sự phân biệt rõ ràng và hỗ trợ cả 2 phương án: **Không có RAG** (nhanh, nhẹ) và **Có RAG** (giàu tri thức). Có cơ chế chặn đứng hiện tượng ảo giác số liệu. | [directJsonStrategy.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/strategies/directJsonStrategy.js), [ragStrategy.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/strategies/ragStrategy.js), [outputValidator.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/outputValidator.js) |
| **Kiến trúc phần mềm** | Code sạch bằng JavaScript ES Modules hiện đại, phân tách rõ Controller - Service - Strategy - Component, không bị phụ thuộc vòng. | Toàn bộ mã nguồn thư mục `backend/` và `frontend/` |
| **Báo cáo & Demo** | Báo cáo chi tiết, số liệu thực nghiệm đầy đủ, giao diện chạy mượt mà không có lỗi runtime. | Báo cáo Project I & Slide thuyết trình |
