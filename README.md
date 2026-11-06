# GeoZone AI 🧭

> **Nền tảng tự động lập lịch trình du lịch cá nhân hóa dựa trên phân vùng địa lý và LLM**  
> *Đề tài Đồ án Project I (IT3150) - Nhóm 4 sinh viên*

---

## 📚 TÀI LIỆU QUAN TRỌNG DÀNH CHO NHÓM
1. 📘 **[HUONG_DAN_LAM_VIEC_CODEBASE.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/HUONG_DAN_LAM_VIEC_CODEBASE.md)**: Hướng dẫn chi tiết luồng dữ liệu (Data Flow), giải thích từng file code, hệ thống Auth, lưu lịch trình, cách chạy và test.
2. 📅 **[NHIEM_VU_4_TUAN_CAC_THANH_VIEN.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/NHIEM_VU_4_TUAN_CAC_THANH_VIEN.md)**: Bảng phân công chi tiết 4 tuần cho cả 4 thành viên (Database, Backend, AI/Auth, Frontend).
3. 🔬 **[docs/rag_strategy_comparison.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/docs/rag_strategy_comparison.md)**: Phân tích so sánh chuyên sâu 2 phương án AI: **Không có RAG** vs **Có RAG**.

---

## 🌟 Tính Năng Chính
1. **Lập Lịch Trình Tự Động (AI Planner):** Lọc theo sở thích, kiểm soát trần ngân sách bằng thuật toán Knapsack tham lam, gom nhóm theo khu vực địa lý (`zone_id`) $\to$ Đảm bảo 100% tính khả thi về di chuyển và tiền bạc.
2. **Hai Chế Độ AI (No-RAG vs RAG):** Chuyển đổi linh hoạt qua nút toggle trên giao diện.
3. **Hoán Đổi Động (Dynamic Swap):** Cho phép đổi một địa điểm bất kỳ sang điểm tương đương cùng Zone ngay trên timeline.
4. **Hệ Thống Xác Thực (User / Auth):** Đăng ký, đăng nhập JWT, băm mật khẩu `bcryptjs`, avatar cá nhân hóa và phân quyền `USER`/`ADMIN`.
5. **Lưu & Quản Lý Chuyến Đi (Saved Plans / My Trips):**
   - Nút **"💾 Lưu lịch trình này"** trên kết quả.
   - Tab **"🧳 Chuyến đi của tôi"** để xem lại toàn bộ lịch trình đã lưu, mở lại xem chi tiết hoặc xóa.

---

## 📂 Cấu Trúc Dự Án (JavaScript ES Modules)

```text
GEO_ZONE/
├── backend/                        # Backend REST API (Node.js, Express, JavaScript ES Modules, Prisma)
│   ├── prisma/
│   │   └── schema.prisma           # CSDL: User, SavedPlan, Zone, Place, Tag, ZoneDistance, KnowledgeChunk
│   ├── src/
│   │   ├── config/                 # env.config.js, database.js
│   │   ├── controllers/            # auth.controller.js, plan.controller.js, place.controller.js, swap.controller.js
│   │   ├── middlewares/            # authMiddleware.js (requireAuth, optionalAuth), errorHandler.js, validateRequest.js
│   │   ├── routes/                 # auth.routes.js, plan.routes.js, place.routes.js, index.js
│   │   ├── services/
│   │   │   ├── planner/            # Thuật toán 5 bước & Dynamic Swap Engine
│   │   │   └── ai/                 # LLM Client, Prompts, Strategies, RAG, Output Validator
│   │   └── types/                  # plan.types.js (JSDoc schema)
│   ├── package.json
│   └── jsconfig.json
│
├── frontend/                       # Giao diện người dùng (React, Vite, JSX, Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/               # AuthModal.jsx (Đăng nhập / Đăng ký)
│   │   │   ├── saved/              # MyTripsView.jsx (Chuyến đi của tôi), SavePlanModal.jsx (Lưu chuyến đi)
│   │   │   ├── form/               # Form nhập liệu, Tag Selector, Budget Slider, RAG Toggle
│   │   │   ├── timeline/           # Timeline View, Day Card, Place Item, Swap Modal
│   │   │   ├── map/                # Bản đồ trực quan hóa các Zone
│   │   │   └── summary/            # Thẻ kiểm soát ngân sách
│   │   ├── services/               # api.js (Auth, Planner, Saved Plans APIs)
│   │   ├── App.jsx                 # Điều phối state chính, tab switching
│   │   └── main.jsx                # Entry point ReactDOM
│   ├── package.json
│   ├── vite.config.js
│   └── jsconfig.json
│
├── data/                           # Dữ liệu mẫu & Kho tri thức
│   ├── raw/                        # danang_places.json (100-150 địa điểm chuẩn hóa)
│   ├── knowledge_base/             # Cẩm nang ẩm thực, văn hóa, kinh nghiệm di chuyển
│   └── seed/                       # seed.js (Nạp CSDL & tạo sẵn 2 tài khoản demo)
│
├── HUONG_DAN_LAM_VIEC_CODEBASE.md  # 📘 Hướng dẫn chi tiết cách làm việc với các file code
└── NHIEM_VU_4_TUAN_CAC_THANH_VIEN.md # 📅 Bảng phân công chi tiết 4 tuần cho nhóm 4 người
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử

### 1. Khởi động Backend
```bash
cd backend
npm install
cp .env.example .env
# Điền DATABASE_URL, JWT_SECRET và GEMINI_API_KEY vào .env
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
# Server chạy tại: http://localhost:5000
```
*Tài khoản test mặc định đã được tạo sẵn:*
- **User Demo:** `demo@geozone.vn` / Mật khẩu: `password123`
- **Admin Demo:** `admin@geozone.vn` / Mật khẩu: `admin123`

### 2. Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
# Mở trình duyệt tại: http://localhost:3000
```
