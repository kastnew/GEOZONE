# Phân Công Nhiệm Vụ 4 Tuần Dự Án GeoZone AI (IT3150) 📅

Tài liệu này xác định chi tiết mục tiêu, công việc từng ngày, sản phẩm đầu ra (Deliverables) và tiêu chí nghiệm thu cho từng thành viên trong nhóm 4 người qua 4 tuần thực hiện đồ án Project I.

---

## BẢNG TỔNG QUAN PHÂN VAI TRÒ

| Thành viên | Vị trí đảm nhiệm | Chuyên môn phụ trách |
|---|---|---|
| **Thành viên 1** | **Data & Database Lead** | Thiết kế CSDL PostgreSQL (Places, Zones, Tags, User, SavedPlan), thu thập 100-150 địa điểm, seed tài khoản demo và cẩm nang tri thức RAG. |
| **Thành viên 2** | **Backend Core & Algorithms Lead** | Xây dựng API Express.js, thuật toán 5 bước (Lọc, Chấm điểm, Gom Zone, Knapsack, Timeline), Dynamic Swap Engine và Quản lý lưu lịch trình (Saved Plans). |
| **Thành viên 3** | **AI, Auth & RAG Engineer** | Triển khai phân hệ Xác thực (JWT, Register, Login), tích hợp LLM Gemini API, xây dựng 2 phương án (No-RAG vs RAG), Vector Retriever và Anti-Hallucination. |
| **Thành viên 4** | **Frontend UI/UX Lead** | Phát triển giao diện React + Tailwind CSS: Form cấu hình, Timeline tương tác, Modal Đăng nhập/Đăng ký, Nút Lưu lịch trình và Màn hình "Chuyến đi của tôi". |

---

## TUẦN 1: THIẾT LẬP NỀN TẢNG, DATABASE & MÔI TRƯỜNG DỰ ÁN
*Mục tiêu tuần 1: CSDL hoàn thiện (bao gồm User & SavedPlan), dữ liệu sạch, môi trường chạy ổn định cho cả nhóm.*

### Thành viên 1 (Data & Database Lead)
- [ ] **Ngày 1-2:** Cài đặt PostgreSQL cục bộ hoặc Docker. Khởi tạo database `geozone_db`.
- [ ] **Ngày 3-4:** Thiết kế bảng `User` và `SavedPlan` trong [backend/prisma/schema.prisma](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/prisma/schema.prisma):
  - `User`: `id`, `email`, `password`, `name`, `avatar`, `role`.
  - `SavedPlan`: `id`, `userId`, `planTitle`, `city`, `totalDays`, `totalBudget`, `actualCost`, `strategyUsed`, `planData (JSON)`.
- [ ] **Ngày 5-6:** Thu thập danh sách 50 địa điểm đầu tiên tại Đà Nẵng, phân chia vào 5 Zone:
  - Z1: Trung tâm Hải Châu (Chợ Cồn, Bảo tàng Chăm, Cầu Rồng...)
  - Z2: Ven biển Mỹ Khê (Bãi biển, Công viên Biển Đông, hải sản...)
  - Z3: Bán đảo Sơn Trà (Chùa Linh Ứng, Đỉnh Bàn Cờ...)
  - Z4: Ngũ Hành Sơn (Động Huyền Không, Làng đá Non Nước...)
  - Z5: Ngoại ô Hòa Vang (Bà Nà Hills, Suối khoáng nóng...)
- [ ] **Ngày 7:** Viết script seed tự động tạo 2 tài khoản demo:
  - `demo@geozone.vn` / `password123` (Role: USER)
  - `admin@geozone.vn` / `admin123` (Role: ADMIN)
- **Sản phẩm bàn giao:** File CSDL PostgreSQL đã chứa 50 địa điểm và tài khoản demo đã được nạp sẵn.

### Thành viên 2 (Backend Core & Algorithms)
- [ ] **Ngày 1-2:** Cài đặt Node.js, cấu hình Express app tại [backend/src/app.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/app.js) và [backend/src/server.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/server.js).
- [ ] **Ngày 3-4:** Viết [backend/src/services/place.service.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/place.service.js) để truy vấn địa điểm từ Prisma theo `city` và mảng `tags`.
- [ ] **Ngày 5-6:** Viết các unit function đầu tiên cho [backend/src/services/planner/candidateFilter.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/candidateFilter.js): Lọc địa điểm và xử lý fallback khi người dùng chọn tag hiếm.
- [ ] **Ngày 7:** Viết API chuẩn RESTful `GET /api/v1/zones` (lấy danh sách phân vùng), `GET /api/v1/places` (tra cứu địa điểm theo query params) và `GET /api/v1/tags` (lấy danh mục sở thích) để kiểm tra trả về dữ liệu chuẩn JSON.
- **Sản phẩm bàn giao:** Server chạy mượt tại cổng 5000, các API danh mục dữ liệu hoạt động tốt trên Postman.

### Thành viên 3 (AI, Auth & RAG Engineer)
- [ ] **Ngày 1-2:** Cài đặt thư viện `bcryptjs` và `jsonwebtoken`, cấu hình `JWT_SECRET` trong [backend/src/config/env.config.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/config/env.config.js).
- [ ] **Ngày 3-4:** Xây dựng middleware xác thực [backend/src/middlewares/authMiddleware.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/middlewares/authMiddleware.js) (`requireAuth` và `optionalAuth`).
- [ ] **Ngày 5-6:** Đăng ký tài khoản Google AI Studio, lấy `GEMINI_API_KEY` và cấu hình vào file [backend/.env.example](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/.env.example).
- [ ] **Ngày 7:** Soạn thảo System Prompt chống ảo giác tại [backend/src/services/ai/prompts/systemPrompts.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/prompts/systemPrompts.js).
- **Sản phẩm bàn giao:** Middleware JWT xác thực hoàn chỉnh, client kết nối Gemini chạy ổn định.

### Thành viên 4 (Frontend UI/UX Lead)
- [ ] **Ngày 1-2:** Khởi tạo dự án React + Vite, cài đặt Tailwind CSS.
- [ ] **Ngày 3-4:** Dựng layout tổng thể với thanh [Header.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/common/Header.jsx) và chân trang [Footer.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/common/Footer.jsx).
- [ ] **Ngày 5-6:** Dựng thành phần [TripInputForm.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/form/TripInputForm.jsx) gồm:
  - Dropdown chọn số ngày (1 - 4 ngày), thanh trượt ngân sách, bộ chọn tag sở thích.
  - Công tắc bật/tắt chế độ RAG.
- [ ] **Ngày 7:** Thiết lập hệ thống lưu trữ Token và User Profile trong `localStorage` tại [frontend/src/services/api.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/services/api.js).
- **Sản phẩm bàn giao:** Giao diện Form nhập liệu đẹp mắt, responsive trên cả máy tính và điện thoại.

---

## TUẦN 2: HOÀN THIỆN AUTH, THUẬT TOÁN CORE & GIAO DIỆN TIMELINE
*Mục tiêu tuần 2: Hệ thống Login/Register chạy thông suốt, thuật toán 5 bước hoàn tất và giao diện hiển thị Timeline.*

### Thành viên 1 (Data & Database Lead)
- [ ] **Ngày 8-9:** Mở rộng dataset lên 100 địa điểm chất lượng cao, kiểm tra kỹ giá vé thực tế năm 2026.
- [ ] **Ngày 10-11:** Bổ sung bảng ma trận khoảng cách `ZoneDistance` giữa 5 Zone (thời gian di chuyển trung bình Z1 $\leftrightarrow$ Z2: 15p, Z1 $\leftrightarrow$ Z3: 25p, Z1 $\leftrightarrow$ Z5: 45p).
- [ ] **Ngày 12-13:** Bắt đầu biên tập các file cẩm nang tri thức văn bản trong thư mục `data/knowledge_base/`:
  - `danang_food_guide.md`, `danang_culture_rules.md`, `travel_tips_zones.md`.
- [ ] **Ngày 14:** Bàn giao bộ tài liệu tri thức cho Thành viên 3.
- **Sản phẩm bàn giao:** Dataset 100 địa điểm hoàn chỉnh và 3 file tài liệu cẩm nang tri thức thực tế.

### Thành viên 2 (Backend Core & Algorithms)
- [ ] **Ngày 8-9:** Cài đặt hàm chấm điểm tại [backend/src/services/planner/placeScorer.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/placeScorer.js) theo công thức toán học có trọng số ($Preference, Popularity, Cost$).
- [ ] **Ngày 10-11:** Cài đặt hàm gom nhóm theo vùng tại [backend/src/services/planner/zoneGrouper.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/zoneGrouper.js), tính điểm trung bình của từng Zone để xếp hạng.
- [ ] **Ngày 12-13:** Cài đặt thuật toán phân bổ ngày [backend/src/services/planner/dayAllocator.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/dayAllocator.js) (Greedy Knapsack):
  - Phân bổ Zone tốt nhất cho từng ngày.
  - Chọn các địa điểm sao cho: $Tổng\_tiền \le Ngân\_sách\_ngày \times 1.2$ và $Tổng\_thời\_gian \le 8\_tiếng$.
- [ ] **Ngày 14:** Cài đặt [backend/src/services/planner/timeSlotScheduler.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/timeSlotScheduler.js): Gán khung giờ chi tiết và cộng thêm thời gian di chuyển.
- **Sản phẩm bàn giao:** Thuật toán 5 bước chạy hoàn chỉnh, sinh ra được đối tượng JSON Draft Lịch Trình chuẩn xác về tiền và giờ.

### Thành viên 3 (AI, Auth & RAG Engineer)
- [ ] **Ngày 8-9:** Hoàn thiện Controller xác thực [backend/src/controllers/auth.controller.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/controllers/auth.controller.js) và Routes [backend/src/routes/auth.routes.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/routes/auth.routes.js):
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
- [ ] **Ngày 10-11:** Hoàn thiện [backend/src/services/ai/strategies/directJsonStrategy.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/strategies/directJsonStrategy.js) (**Phương án 1: KHÔNG CÓ RAG**).
- [ ] **Ngày 12-14:** Viết bộ hậu kiểm dữ liệu tại [backend/src/services/ai/outputValidator.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/outputValidator.js):
  - Giữ nguyên 100% ID địa điểm, giá tiền, thời lượng từ thuật toán Backend; chỉ trích xuất trường `title` và `aiDescription` do AI sinh ra.
- **Sản phẩm bàn giao:** Bộ API Auth hoàn chỉnh và luồng Phương án 1 (No-RAG) cam kết 0% Hallucination.

### Thành viên 4 (Frontend UI/UX Lead)
- [ ] **Ngày 8-9:** Xây dựng Modal Đăng nhập / Đăng ký [frontend/src/components/auth/AuthModal.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/auth/AuthModal.jsx) với nút tiện ích "Điền tài khoản Demo".
- [ ] **Ngày 10-11:** Tích hợp Auth vào thanh Header: Hiển thị avatar, tên người dùng, vai trò (`USER`/`ADMIN`) và nút Đăng xuất.
- [ ] **Ngày 12-13:** Xây dựng component [PlaceItem.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/timeline/PlaceItem.jsx), [DayCard.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/timeline/DayCard.jsx) và [TimelineView.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/timeline/TimelineView.jsx).
- [ ] **Ngày 14:** Xây dựng [BudgetSummaryCard.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/summary/BudgetSummaryCard.jsx) và [ZoneMapView.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/map/ZoneMapView.jsx).
- **Sản phẩm bàn giao:** Luồng đăng nhập trên giao diện chạy mượt, giao diện hiển thị Timeline đầy đủ thông tin.

---

## TUẦN 3: LƯU LỊCH TRÌNH (MY TRIPS), RAG & DYNAMIC SWAP
*Mục tiêu tuần 3: Đưa tính năng Lưu & Quản lý chuyến đi vào hoạt động, hoàn thành RAG và tính năng Dynamic Swap.*

### Thành viên 1 (Data & Database Lead)
- [ ] **Ngày 15-16:** Thiết kế bảng `KnowledgeChunk` trong CSDL PostgreSQL để lưu trữ các mẩu cẩm nang văn hóa, ẩm thực.
- [ ] **Ngày 17-18:** Viết script băm nhỏ (chunking) 3 file cẩm nang thành các đoạn văn ngắn (mỗi đoạn 150-250 từ, gắn với `placeId` hoặc `zoneCode`).
- [ ] **Ngày 19-20:** Hỗ trợ Thành viên 3 lưu trữ và index dữ liệu tri thức vào Vector Store.
- [ ] **Ngày 21:** Rà soát lại tính toàn vẹn của toàn bộ dữ liệu CSDL.
- **Sản phẩm bàn giao:** Kho tri thức cẩm nang du lịch được phân đoạn và sẵn sàng cho việc truy xuất.

### Thành viên 2 (Backend Core & Algorithms)
- [ ] **Ngày 15-16:** Viết các API Lưu & Quản lý lịch trình chuẩn RESTful trong [backend/src/controllers/plan.controller.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/controllers/plan.controller.js):
  - `POST /api/v1/plans` (Tạo mới/Lưu lịch trình vào CSDL, tự động gắn `user_id = req.user.sub`).
  - `GET /api/v1/plans` (Lấy danh sách các chuyến đi đã lưu của chính user đang đăng nhập).
  - `GET /api/v1/plans/:id` (Xem lại chi tiết 1 lịch trình cũ theo UUID).
  - `DELETE /api/v1/plans/:id` (Xóa lịch trình).
- [ ] **Ngày 17-18:** Xây dựng tính năng Hoán đổi động tại [backend/src/services/planner/dynamicSwapEngine.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/dynamicSwapEngine.js):
  - Tìm địa điểm thay thế cùng Zone, loại trừ các điểm đã có trong lịch trình, chi phí $\le$ ngân sách còn lại.
- [ ] **Ngày 19-20:** Viết controller [backend/src/controllers/swap.controller.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/controllers/swap.controller.js) và route `POST /api/v1/ai/swap-place` (kèm route `POST /api/v1/ai/generate-plan`).
- [ ] **Ngày 21:** Kiểm thử Postman các endpoint lưu, xem, xóa lịch trình với Bearer JWT Token.
- **Sản phẩm bàn giao:** Hệ thống API Quản lý chuyến đi (`/plans`) và AI Engine (`/ai/*`) hoàn thiện 100%.

### Thành viên 3 (AI, Auth & RAG Engineer)
- [ ] **Ngày 15-16:** Xây dựng module vector hóa tại [backend/src/services/ai/rag/embedder.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/rag/embedder.js) và [backend/src/services/ai/rag/vectorStore.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/rag/vectorStore.js) (sử dụng Cosine Similarity).
- [ ] **Ngày 17-18:** Xây dựng module truy xuất tri thức tại [backend/src/services/ai/rag/knowledgeRetriever.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/rag/knowledgeRetriever.js):
  - Tự động tìm kiếm các mẩu cẩm nang liên quan nhất đến các địa điểm được chọn.
- [ ] **Ngày 19-20:** Hoàn thiện [backend/src/services/ai/strategies/ragStrategy.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/ai/strategies/ragStrategy.js) (**Phương án 2: CÓ RAG**):
  - Ghép cẩm nang vào Prompt gửi Gemini với System Instruction `RAG_ENRICHED_SYSTEM_PROMPT`.
  - Yêu cầu Gemini bổ sung trường `aiTravelTip` cho từng hoạt động.
- [ ] **Ngày 21:** Đo đạc so sánh trực tiếp: Cùng 1 yêu cầu, chạy No-RAG vs chạy RAG để thấy rõ sự khác biệt.
- **Sản phẩm bàn giao:** Hoàn tất toàn bộ kiến trúc RAG, chuyển đổi linh hoạt qua cờ `ENABLE_RAG`.

### Thành viên 4 (Frontend UI/UX Lead)
- [ ] **Ngày 15-16:** Thêm nút **"💾 Lưu lịch trình này"** trên [TimelineView.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/timeline/TimelineView.jsx) và modal đặt tên chuyến đi [SavePlanModal.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/saved/SavePlanModal.jsx).
- [ ] **Ngày 17-18:** Xây dựng màn hình [MyTripsView.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/saved/MyTripsView.jsx):
  - Hiển thị danh sách các chuyến đi đã lưu dưới dạng Card.
  - Nút **"👁️ Xem chi tiết"** mở lại lịch trình trên Timeline.
  - Nút **"Xóa"** xóa lịch trình khỏi CSDL.
- [ ] **Ngày 19-20:** Xây dựng popup xác nhận hoán đổi địa điểm [SwapModal.jsx](file:///c:/Users/Admin/Desktop/GEO_ZONE/frontend/src/components/timeline/SwapModal.jsx).
- [ ] **Ngày 21:** Thêm hiệu ứng huy hiệu **💡 Mẹo bản địa** màu vàng trên thẻ địa điểm khi người dùng kích hoạt chế độ RAG.
- **Sản phẩm bàn giao:** Hoàn chỉnh toàn bộ giao diện: Lập lịch trình, Hoán đổi động, Đăng nhập/Đăng ký và Quản lý chuyến đi đã lưu.

---

## TUẦN 4: ĐÁNH GIÁ THỰC NGHIỆM, BÁO CÁO & DEMO
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
  - **Hiệu năng hệ thống xác thực & lưu lịch trình:** Thời gian đăng nhập < 100ms, thời gian lưu và truy xuất lịch trình < 50ms.

#### 2. Viết Báo Cáo Kỹ Thuật (Báo Cáo Project I - IT3150)
- **Thành viên 1:** Viết Chương 2 (Cơ sở dữ liệu: bảng Places, Zones, Tags, User, SavedPlan).
- **Thành viên 2:** Viết Chương 3 (Thuật toán 5 bước lập lịch trình và cơ chế Dynamic Swap).
- **Thành viên 3:** Viết Chương 4 (Hệ thống xác thực JWT, tích hợp AI Gemini, so sánh chuyên sâu No-RAG vs RAG, cơ chế kiểm soát ảo giác).
- **Thành viên 4:** Viết Chương 5 (Thiết kế giao diện người dùng, màn hình Chuyến đi của tôi, đánh giá kết quả thực nghiệm và hướng phát triển).

#### 3. Chuẩn Bị Slide Thuyết Trình & Kịch Bản Demo (5 phút)
1. *Phút 1:* Đăng nhập bằng tài khoản Demo `demo@geozone.vn` $\to$ Giới thiệu thông tin profile trên Header.
2. *Phút 2:* Nhập form 2 ngày Đà Nẵng, 1.500.000đ, tắt RAG $\to$ Bấm tạo $\to$ Hiển thị timeline chính xác về tiền và giờ.
3. *Phút 3:* Bấm nút **"💾 Lưu lịch trình này"** $\to$ Đặt tên "Kỳ nghỉ hè 2 ngày tại Đà Nẵng" $\to$ Chuyển sang tab **"🧳 Chuyến đi của tôi"** để xem chuyến đi vừa lưu.
4. *Phút 4:* Bấm **"👁️ Xem chi tiết"** $\to$ Lịch trình được mở lại nguyên vẹn $\to$ Bấm nút "🔄 Đổi địa điểm" tại 1 điểm để chứng minh thuật toán Dynamic Swap.
5. *Phút 5:* Bật chế độ **"Kích hoạt RAG"** để demo các mẹo bản địa độc đáo và trình bày bảng đánh giá thực nghiệm chống Hallucination.
