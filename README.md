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
├── data/                           # Seed script và dữ liệu tham khảo
│   └── seed/                       # seed.js (Nạp catalog, Zone, Tags và tài khoản mẫu)
├── frontend/src/data/              # Danh mục địa điểm của 5 thành phố dùng để seed
│
├── HUONG_DAN_LAM_VIEC_CODEBASE.md  # 📘 Hướng dẫn chi tiết cách làm việc với các file code
└── NHIEM_VU_4_TUAN_CAC_THANH_VIEN.md # 📅 Bảng phân công chi tiết 4 tuần cho nhóm 4 người
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử

### 1. Chuẩn bị môi trường

Cài Node.js và PostgreSQL, sau đó tạo database `geozone_db` trong PostgreSQL (bằng pgAdmin hoặc công cụ dòng lệnh). Tất cả lệnh dưới đây chạy từ thư mục gốc `GEOZONE`.

```bash
npm install
```

Npm workspaces sẽ cài dependency cho cả `backend` và `frontend`.

### 2. Cấu hình Backend và PostgreSQL

Tạo file môi trường riêng cho backend:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

Trên macOS/Linux, dùng `cp backend/.env.example backend/.env`.

Mở `backend/.env` và cập nhật `DATABASE_URL` theo tài khoản PostgreSQL trên máy. Đặt `FRONTEND_ORIGINS` thành origin chính xác của frontend (mặc định `http://localhost:3000`; khi triển khai, liệt kê các origin được phép, phân cách bằng dấu phẩy). Đặt hai giá trị bí mật riêng, ngẫu nhiên cho `ACCESS_TOKEN_SECRET` và `REFRESH_TOKEN_SECRET`; không commit file `.env`. `GEMINI_API_KEY` chỉ cần thiết khi bật tính năng gọi LLM.

Áp dụng migration, sau đó nạp dữ liệu mẫu:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Lệnh seed đọc toàn bộ dữ liệu 5 thành phố từ `frontend/src/data/` (Đà Nẵng, Huế, Hà Nội, Hạ Long và Ninh Bình), đồng thời tạo các Zone, Tags và tài khoản mẫu. Seed có thể chạy lại: cập nhật dữ liệu mẫu đã có, không xóa hàng loạt địa điểm, chuyến đi, tài khoản hay mục yêu thích của người dùng.

Nếu chỉ muốn thay toàn bộ catalog địa điểm hiện có bằng dữ liệu trong các file trên, chạy `npm run db:replace-places`. Lệnh này thay các hàng trong `places` và `place_tags`, chỉ bổ sung `zones`/`tags` còn thiếu, giữ lại favorites nếu địa điểm tương ứng còn trong catalog, và không cập nhật tài khoản hay chuyến đi. Lệnh sẽ dừng nếu có KnowledgeChunk liên kết cần được bảo toàn.

Tài khoản mặc định sau khi seed:

- **User Demo:** `demo@geozone.vn` / Mật khẩu: `password123`
- **Admin Demo:** `admin@geozone.vn` / Mật khẩu: `admin123`

Đổi mật khẩu mẫu trước khi sử dụng môi trường chia sẻ hoặc triển khai thật.

### 3. Khởi động Backend và Frontend

```bash
npm run dev
```

Ứng dụng chạy đồng thời tại:

- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:3000`

Frontend đã cấu hình proxy `/api` tới backend. Nếu muốn khởi động riêng, dùng `npm run dev --workspace backend` hoặc `npm run dev --workspace frontend`.
