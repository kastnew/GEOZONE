# GeoZone AI 🧭

> **Nền tảng tự động lập lịch trình du lịch cá nhân hóa dựa trên phân vùng địa lý và LLM**  
> *Đồ án Project I (IT3150) - Nhóm 4 thành viên*

---

## 🌟 Giới thiệu Cốt lõi
Khác với các ứng dụng du lịch dùng AI thông thường dễ bị hiện tượng **ảo giác (hallucination)** (bịa đặt giá vé, sai lệch thời gian, sắp xếp địa điểm chạy đi chạy lại khắp thành phố), **GeoZone AI** tách bạch rõ ràng giữa hai tầng:
1. **Planning & Data Layer (Backend):** Sử dụng dữ liệu có cấu trúc từ PostgreSQL kết hợp thuật toán phân vùng địa lý (`zone_id`), chấm điểm đa mục tiêu (`placeScorer`) và giải thuật tham lam Knapsack (`dayAllocator`) để đảm bảo 100% tính khả thi về mặt địa lý và ngân sách.
2. **AI Synthesis & RAG Layer:** Sử dụng LLM (Google Gemini) để biên tập tiêu đề, diễn đạt lời dẫn chuyện tự nhiên và tích hợp kho tri thức cẩm nang du lịch bản địa (**RAG**).

---

## 🧩 Hai Phương Án Tích Hợp AI (No-RAG vs RAG)
Hệ thống áp dụng **Strategy Pattern** cho phép chuyển đổi linh hoạt qua nút Toggle trên giao diện hoặc cấu hình file `.env`:
- **Phương án 1 (KHÔNG CÓ RAG - Direct JSON Synthesis):** Backend lọc và tính toán lịch trình hoàn chỉnh từ DB, đưa JSON vào Prompt nghiêm ngặt để LLM viết lời giới thiệu. Tốc độ cực nhanh, chi phí thấp, không bịa đặt số liệu.
- **Phương án 2 (CÓ RAG - Hybrid Knowledge-Augmented):** Sau khi thuật toán chọn địa điểm, module `KnowledgeRetriever` truy xuất thêm các đoạn cẩm nang tri thức chuyên sâu (lưu ý văn hóa tâm linh, mẹo ăn uống, quy định giao thông). LLM làm giàu lịch trình với các mẹo bản địa đắt giá.

Chi tiết phân tích kỹ thuật: xem tại [docs/rag_strategy_comparison.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/docs/rag_strategy_comparison.md).

---

## 📂 Cấu Trúc Dự Án (Project Structure)

```text
GEO_ZONE/
├── backend/                        # Backend REST API (Node.js, Express, TypeScript, Prisma)
│   ├── prisma/                     # Database Schema & Migration
│   │   └── schema.prisma           # Model Zones, Places, Tags, Distances, KnowledgeChunks
│   ├── src/
│   │   ├── config/                 # Cấu hình biến môi trường và kết nối DB
│   │   ├── controllers/            # Xử lý Request/Response (Places, Plan, Dynamic Swap)
│   │   ├── routes/                 # Định tuyến API (/api/v1/plans, /api/v1/places)
│   │   ├── services/
│   │   │   ├── planner/            # Thuật toán cốt lõi Backend (Filter, Scorer, Grouper, Allocator)
│   │   │   └── ai/                 # LLM Client, Prompts, Output Validator
│   │   │       ├── strategies/     # Strategy Pattern: DirectJsonStrategy vs RagStrategy
│   │   │       └── rag/            # Embedder, VectorStore, KnowledgeRetriever
│   │   ├── middlewares/            # Error handling, request validation
│   │   └── types/                  # TypeScript Data Types & Interfaces
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # Giao diện người dùng (React, Vite, Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── form/               # Input Form, Tag Selector, Budget Slider, RAG Toggle
│   │   │   ├── timeline/           # Timeline View, Day Card, Place Item, Swap Modal
│   │   │   ├── map/                # Bản đồ trực quan hóa các Zone
│   │   │   └── summary/            # Thẻ kiểm soát ngân sách
│   │   ├── services/               # Axios / Fetch API client
│   │   └── types/                  # Frontend Types
│   ├── package.json
│   └── vite.config.ts
│
├── data/                           # Dữ liệu mẫu & Kho tri thức
│   ├── raw/                        # Dataset 100-150 địa điểm Đà Nẵng (JSON)
│   ├── knowledge_base/             # Cẩm nang văn hóa, ẩm thực, di chuyển cho RAG
│   └── seed/                       # Script nạp dữ liệu vào PostgreSQL & Vector Store
│
└── docs/                           # Tài liệu thiết kế & Báo cáo đồ án
    ├── project_plan_breakdown.md   # Phân công 4 thành viên & Tiến độ 6 tuần
    └── rag_strategy_comparison.md  # So sánh chuyên sâu 2 phương án RAG
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử

### 1. Yêu cầu Tiên quyết
- Node.js (v18 trở lên)
- PostgreSQL (hoặc Docker chạy container Postgres)
- Khóa API Google Gemini (`GEMINI_API_KEY`)

### 2. Thiết lập Backend
```bash
cd backend
npm install

# Sao chép biến môi trường và cấu hình DATABASE_URL, GEMINI_API_KEY
cp .env.example .env

# Sinh Prisma Client và nạp dữ liệu mẫu
npx prisma db push
npm run db:seed

# Khởi động Backend
npm run dev
# Server lắng nghe tại: http://localhost:5000
```

### 3. Thiết lập Frontend
```bash
cd frontend
npm install
npm run dev
# Mở trình duyệt tại: http://localhost:3000
```

---

## 👥 Phân Công Thành Viên (Nhóm 4 Người)
- **Thành viên 1:** Data & Database Lead (PostgreSQL Schema, Thu thập dataset Đà Nẵng, Seed Data).
- **Thành viên 2:** Backend Core & Algorithm Lead (Zone Clustering, Knapsack Budget, Dynamic Swap).
- **Thành viên 3:** AI & RAG Engineer (Tích hợp LLM Gemini, Chế độ No-RAG & RAG, Anti-Hallucination).
- **Thành viên 4:** Frontend UI/UX Lead (Giao diện React, Timeline tương tác, Map & Swap UI).

Xem chi tiết bảng phân công tại: [docs/project_plan_breakdown.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/docs/project_plan_breakdown.md).
=======
# GEOZONE
>>>>>>> 254d5dad6b2642c9e0e4c4982b286557d8992531
