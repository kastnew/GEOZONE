# Sổ Tay Kỹ Thuật: Hướng Dẫn Làm Việc Với Codebase GeoZone AI 📘

Tài liệu này được biên soạn dành cho cả 4 thành viên trong nhóm, giúp mọi người hiểu sâu sắc **dòng chảy dữ liệu (Data Flow)**, **nhiệm vụ của từng file code** và **cách chạy, sửa đổi, kiểm thử mã nguồn bằng JavaScript thuần**.

---

## 1. Bản Đồ Dòng Chảy Dữ Liệu (Architecture & Data Flow)

Hệ thống hoạt động theo nguyên tắc: **Backend tính toán logic và tiền bạc $\to$ LLM chỉ hỗ trợ diễn đạt $\to$ RAG bổ sung mẹo bản địa**.

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant FE as Frontend (React App)
    participant API as Express Router & Controller
    participant Planner as 5 Bước Thuật toán Planner
    participant DB as PostgreSQL (Prisma)
    participant RAG as Knowledge Retriever
    participant LLM as Google Gemini API

    User->>FE: Nhập (Ngân sách, Số ngày, Sở thích, Toggle RAG)
    FE->>API: POST /api/v1/plans/generate
    API->>Planner: Gọi candidateFilter(request)
    Planner->>DB: Truy vấn Places có tags phù hợp
    DB-->>Planner: Danh sách ứng viên
    Planner->>Planner: B2: Chấm điểm (placeScorer)
    Planner->>Planner: B3: Gom nhóm theo zone_id (zoneGrouper)
    Planner->>Planner: B4: Phân bổ ngày theo ngân sách (dayAllocator)
    Planner->>Planner: B5: Xếp khung giờ & di chuyển (timeSlotScheduler)
    
    alt Không kích hoạt RAG (Phương án 1)
        API->>LLM: Gửi Draft JSON + Prompt chống ảo giác
        LLM-->>API: Trả về tiêu đề & mô tả địa điểm
    else Có kích hoạt RAG (Phương án 2)
        API->>RAG: Truy xuất cẩm nang văn hóa/ẩm thực của các địa điểm
        RAG-->>API: Trả về các đoạn cẩm nang liên quan (chunks)
        API->>LLM: Gửi Draft JSON + Retrieved Chunks
        LLM-->>API: Trả về tiêu đề + mô tả + Mẹo bản địa (aiTravelTip)
    end

    API->>API: Output Validator: Khóa cứng ID, Giá, Giờ gốc từ DB
    API-->>FE: Trả về JSON lịch trình hoàn chỉnh
    FE-->>User: Hiển thị Timeline, Bản đồ Zone & Thẻ Ngân sách
```

---

## 2. Giải Thích Chi Tiết Nhiệm Vụ Của Từng File Code

### 2.1. Thư mục `backend/src/services/planner/` (Thuật toán cốt lõi)
Đây là phần quan trọng nhất quyết định điểm số chuyên môn của đồ án:

| File | Nhiệm vụ kỹ thuật | Hàm chính | Khi nào cần sửa file này? |
|---|---|---|---|
| `candidateFilter.js` | Lọc các địa điểm từ DB khớp với thành phố và tags sở thích. Có cơ chế fallback tự bổ sung điểm phổ biến nếu kết quả lọc quá ít. | `filterCandidatePlaces(request)` | Khi muốn thay đổi quy tắc lọc (ví dụ: chỉ lọc địa điểm mở cửa vào ngày đi). |
| `placeScorer.js` | Tính điểm số phù hợp $Score(i) = w_1 \cdot Sở\_thích + w_2 \cdot Phổ\_biến + w_3 \cdot Chi\_phí$. Sắp xếp danh sách điểm theo độ ưu tiên. | `scorePlaces(places, userPreferences, weights)` | Khi muốn tinh chỉnh trọng số $w_1, w_2, w_3$ để ưu tiên tiết kiệm tiền hơn hoặc ưu tiên địa điểm nổi tiếng hơn. |
| `zoneGrouper.js` | Dùng cấu trúc dữ liệu `Map` để gom các địa điểm có cùng `zone_id` lại với nhau, tính điểm trung bình của mỗi Zone. | `groupPlacesByZone(places)` | Khi muốn bổ sung logic kiểm tra vị trí tâm của Zone hoặc lọc Zone không có điểm nào. |
| `dayAllocator.js` | Giải thuật tham lam (Greedy Knapsack): Phân bổ các Zone vào từng ngày sao cho tổng chi phí địa điểm không vượt quá ngân sách ngày ($Budget / Days$). | `allocateDays(zoneMap, totalDays, totalBudget)` | Khi muốn đổi chiến lược ghép Zone (ví dụ: cho phép 1 ngày đi qua 2 Zone lân cận nhau). |
| `timeSlotScheduler.js` | Chia khung giờ trong ngày: 08:00 sáng đến chiều, tự động chèn khoảng nghỉ và cộng thời gian di chuyển 15–30 phút giữa các điểm. | `scheduleTimeSlots(dayBundles, startTime)` | Khi muốn thay đổi thời gian xuất phát buổi sáng hoặc thêm thời gian nghỉ ăn trưa cố định (11:30 - 13:00). |
| `dynamicSwapEngine.js` | Xử lý nút bấm "🔄 Đổi địa điểm": Tìm điểm thay thế *cùng Zone*, *chưa có trong lịch trình*, và *chi phí nhỏ hơn ngân sách còn lại*. | `executeDynamicSwap(request)` | Khi muốn bổ sung tiêu chí hoán đổi (ví dụ: ưu tiên điểm cùng category với điểm bị đổi). |

---

### 2.2. Thư mục `backend/src/services/ai/` (Tầng LLM & RAG)

| File | Nhiệm vụ kỹ thuật |
|---|---|
| `llmClient.js` | Khởi tạo kết nối tới Google GenAI SDK (`@google/genai`) với model `gemini-2.5-flash`. |
| `prompts/systemPrompts.js` | Chứa System Prompt nghiêm ngặt yêu cầu LLM **tuyệt đối không bịa đặt địa điểm, không sửa giá tiền, không sửa giờ giấc**. |
| `prompts/narrativePrompt.js` | Chứa hàm tạo User Prompt cho 2 phương án: Dạng thô (No-RAG) và Dạng kèm ngữ cảnh cẩm nang (RAG). |
| `strategies/directJsonStrategy.js` | Thực thi **Phương án 1 (Không có RAG)**: Đưa JSON trực tiếp vào prompt để LLM sinh narrative. |
| `strategies/ragStrategy.js` | Thực thi **Phương án 2 (Có RAG)**: Gọi `knowledgeRetriever` lấy cẩm nang trước rồi mới yêu cầu LLM sinh cẩm nang du lịch. |
| `rag/vectorStore.js` | Bộ nhớ vector in-memory tính độ tương đồng Cosine Similarity để tìm văn bản cẩm nang liên quan. |
| `rag/knowledgeRetriever.js` | Tìm kiếm mẹo văn hóa, ẩm thực, di chuyển tương ứng với các địa điểm trong lịch trình. |
| `outputValidator.js` | **Lớp phòng thủ dữ liệu:** Nhận chuỗi JSON từ LLM, parse và chỉ lấy tiêu đề + lời văn mô tả; toàn bộ thông tin giá tiền và thời gian luôn lấy lại từ dữ liệu gốc của DB để loại bỏ 100% ảo giác số liệu. |

---

### 2.3. Thư mục `backend/src/controllers/` & `routes/` (Tầng Giao Tiếp Web)
- `controllers/plan.controller.js`: Tiếp nhận request từ client, điều phối 5 bước của Planner, chọn chiến lược AI (RAG hay Không RAG) và trả response.
- `controllers/swap.controller.js`: Tiếp nhận yêu cầu đổi 1 địa điểm từ timeline, gọi Swap Engine và trả về địa điểm mới.
- `controllers/place.controller.js`: Cung cấp API lấy danh sách các Zone và tìm kiếm địa điểm để hiển thị lên bản đồ.
- `routes/index.js`: Gắn tiền tố `/api/v1` cho các route.

---

### 2.4. Thư mục `frontend/src/` (Giao Diện Người Dùng React)
- `components/form/TripInputForm.jsx`: Biểu mẫu thu thập 4 tham số: Thành phố, Số ngày (1-4), Ngân sách (Slider), Sở thích (Tags), và **Nút bật/tắt RAG**.
- `components/timeline/TimelineView.jsx` & `DayCard.jsx`: Trình bày lịch trình dạng timeline trục dọc theo từng ngày, hiển thị rõ Zone trọng tâm.
- `components/timeline/PlaceItem.jsx`: Từng thẻ địa điểm, hiển thị giờ đến, giá vé, lời văn của AI, mẹo bản địa (badge vàng của RAG), và nút bấm "🔄 Đổi địa điểm".
- `components/timeline/SwapModal.jsx`: Popup xác nhận khi người dùng muốn đổi một địa điểm sang điểm khác cùng Zone.
- `components/summary/BudgetSummaryCard.jsx`: Tính toán tự động tổng tiền thực tế vs ngân sách dự chi, cảnh báo màu đỏ nếu vượt ngân sách hoặc màu xanh nếu tiết kiệm.
- `components/map/ZoneMapView.jsx`: Khung bản đồ hiển thị trực quan các cụm khu vực.

---

## 3. Hướng Dẫn Cài Đặt & Chạy Dự Án Bằng JavaScript

### Bước 1: Khởi động Backend
1. Mở một cửa sổ Terminal trong VS Code:
   ```bash
   cd backend
   npm install
   ```
2. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   ```
   Mở file `.env` và điền:
   - `DATABASE_URL`: Đường dẫn PostgreSQL của bạn (ví dụ: `postgresql://postgres:123456@localhost:5432/geozone_db?schema=public`)
   - `GEMINI_API_KEY`: API Key lấy từ Google AI Studio (miễn phí).
3. Nạp dữ liệu vào cơ sở dữ liệu:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run db:seed
   ```
4. Chạy Backend với chế độ tự động reload khi sửa code:
   ```bash
   npm run dev
   ```
   *Terminal sẽ thông báo: `🚀 GeoZone AI Server đang chạy tại http://localhost:5000`*

### Bước 2: Khởi động Frontend
1. Mở cửa sổ Terminal thứ 2:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Mở trình duyệt tại: `http://localhost:3000`.

---

## 4. Hướng Dẫn Cách Code & Kiểm Thử Từng Tính Năng

### 4.1. Thử nghiệm Thay Đổi Thuật Toán Chấm Điểm
- Mở file [backend/src/services/planner/placeScorer.js](file:///c:/Users/Admin/Desktop/GEO_ZONE/backend/src/services/planner/placeScorer.js).
- Tìm dòng `weights = { wPreference: 0.5, wPopularity: 0.3, wCost: 0.2 }`.
- Thay đổi trọng số: ví dụ muốn ưu tiên tuyệt đối cho địa điểm tiết kiệm chi phí, sửa thành:
  `weights = { wPreference: 0.3, wPopularity: 0.2, wCost: 0.5 }`.
- Bấm tạo lại lịch trình trên Web để thấy các địa điểm giá 0đ (Biển Mỹ Khê, Cầu Rồng) được đẩy lên đầu.

### 4.2. Thử nghiệm Bật / Tắt RAG
- **Khi tắt RAG:** Nhấn nút Tạo lịch trình $\to$ Kết quả trả về sau 1 giây. Các thẻ địa điểm chỉ có mô tả ngắn gọn.
- **Khi bật RAG:** Nhấn nút Tạo lịch trình $\to$ Kết quả trả về sau 2–3 giây. Dưới mỗi địa điểm xuất hiện thêm khung màu vàng **💡 Mẹo bản địa** (ví dụ: Chùa Linh Ứng nhắc nhở trang phục, Chợ Cồn nhắc mang tiền mặt...).

### 4.3. Bổ Sung Dữ Liệu Địa Điểm Mới
- Mở file [data/raw/danang_places.json](file:///c:/Users/Admin/Desktop/GEO_ZONE/data/raw/danang_places.json).
- Thêm một đối tượng mới theo đúng cấu trúc (chú ý gán đúng `zoneCode` từ Z1 đến Z5 và mảng `tags`).
- Chạy lại lệnh: `npm run db:seed` ở thư mục `backend`.

---

## 5. Quy Tắc Phối Hợp Git Để Không Bị Xung Đột (Conflict)
1. **Mỗi thành viên làm việc trên một nhánh riêng:**
   - Thành viên 1: `feature/database-and-data`
   - Thành viên 2: `feature/planner-algorithms`
   - Thành viên 3: `feature/ai-and-rag`
   - Thành viên 4: `feature/frontend-ui`
2. **Không sửa chéo file:** Thành viên nào làm nhiệm vụ của thành viên đó theo bảng phân công.
3. **Trước khi commit code:** Luôn chạy thử `npm run dev` để đảm bảo code không có lỗi cú pháp.
