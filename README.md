# GeoZone AI 🧭

> **Nền tảng tự động lập lịch trình du lịch cá nhân hóa dựa trên phân vùng địa lý và LLM**  
> *Đề tài Đồ án Project I (IT3150) - Nhóm 4 sinh viên*

---

## 📚 TÀI LIỆU QUAN TRỌNG DÀNH CHO NHÓM
1. 📘 **[HUONG_DAN_LAM_VIEC_CODEBASE.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/HUONG_DAN_LAM_VIEC_CODEBASE.md)**: Hướng dẫn chi tiết cách làm việc với các file code, luồng dữ liệu (Data Flow), cách chạy, debug và kiểm thử từng tính năng bằng JavaScript.
2. 📅 **[NHIEM_VU_4_TUAN_CAC_THANH_VIEN.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/NHIEM_VU_4_TUAN_CAC_THANH_VIEN.md)**: Phân công chi tiết nhiệm vụ từng ngày từ Tuần 1 đến Tuần 4 cho cả 4 thành viên, tiêu chí nghiệm thu và kịch bản demo.
3. 🔬 **[docs/rag_strategy_comparison.md](file:///c:/Users/Admin/Desktop/GEO_ZONE/docs/rag_strategy_comparison.md)**: Phân tích so sánh chuyên sâu 2 phương án AI: **Không có RAG** vs **Có RAG**.

---

## 🌟 Giới thiệu Cốt lõi
Khác với các ứng dụng du lịch dùng AI thông thường dễ bị hiện tượng **ảo giác (hallucination)** (bịa đặt giá vé, sai lệch thời gian, sắp xếp địa điểm chạy đi chạy lại khắp thành phố), **GeoZone AI** tách bạch rõ ràng giữa hai tầng:
1. **Planning & Data Layer (Backend):** Sử dụng dữ liệu có cấu trúc từ PostgreSQL kết hợp thuật toán phân vùng địa lý (`zone_id`), chấm điểm đa mục tiêu (`placeScorer`) và giải thuật tham lam Knapsack (`dayAllocator`) để đảm bảo 100% tính khả thi về mặt địa lý và ngân sách.
2. **AI Synthesis & RAG Layer:** Sử dụng LLM (Google Gemini) để biên tập tiêu đề, diễn đạt lời dẫn chuyện tự nhiên và tích hợp kho tri thức cẩm nang du lịch bản địa (**RAG**).

---

## 🧩 Hai Phương Án Tích Hợp AI (No-RAG vs RAG)
Hệ thống áp dụng **Strategy Pattern** cho phép chuyển đổi linh hoạt qua nút Toggle trên giao diện hoặc cấu hình file `.env`:
- **Phương án 1 (KHÔNG CÓ RAG - Direct JSON Synthesis):** Backend lọc và tính toán lịch trình hoàn chỉnh từ DB, đưa JSON vào Prompt nghiêm ngặt để LLM viết lời giới thiệu. Tốc độ cực nhanh (1–2s), chi phí thấp, không bịa đặt số liệu.
- **Phương án 2 (CÓ RAG - Hybrid Knowledge-Augmented):** Sau khi thuật toán chọn địa điểm, module `KnowledgeRetriever` truy xuất thêm các đoạn cẩm nang tri thức chuyên sâu (lưu ý văn hóa tâm linh, mẹo ăn uống, quy định giao thông). LLM làm giàu lịch trình với các mẹo bản địa đắt giá.

---

## 📂 Cấu Trúc Dự Án (JavaScript ES Modules)

```text
GEO_ZONE/
├── backend/                        # Backend REST API (Node.js, Express, JavaScript ES Modules, Prisma)
│   ├── prisma/
│   │   └── schema.prisma           # CSDL: Zones, Places, Tags, Distances, KnowledgeChunks
│   ├── src/
│   │   ├── config/                 # Cấu hình môi trường (env.config.js, database.js)
│   │   ├── controllers/            # Controller tiếp nhận request (Places, Plan, Dynamic Swap)
│   │   ├── routes/                 # Định tuyến API (/api/v1/plans, /api/v1/places)
│   │   ├── services/
│   │   │   ├── planner/            # THUẬT TOÁN CORE (Filter, Scorer, Grouper, Allocator, Scheduler, Swap)
│   │   │   └── ai/                 # LLM Client, Prompts, Output Validator
│   │   │       ├── strategies/     # Strategy Pattern: directJsonStrategy.js vs ragStrategy.js
│   │   │       └── rag/            # embedder.js, vectorStore.js, knowledgeRetriever.js
│   │   ├── middlewares/            # errorHandler.js, validateRequest.js
│   │   └── types/                  # plan.types.js (JSDoc schema)
│   ├── package.json
│   └── jsconfig.json
│
├── frontend/                       # Giao diện người dùng (React, Vite, JSX, Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── form/               # Form nhập liệu, Tag Selector, Budget Slider, RAG Toggle
│   │   │   ├── timeline/           # Timeline View, Day Card, Place Item, Swap Modal
│   │   │   ├── map/                # Bản đồ trực quan hóa các Zone
│   │   │   └── summary/            # Thẻ kiểm soát ngân sách
│   │   ├── services/               # api.js gọi Backend REST APIs
│   │   ├── App.jsx                 # Component chính điều phối state
│   │   └── main.jsx                # Entry point ReactDOM
│   ├── package.json
│   ├── vite.config.js
│   └── jsconfig.json
│
├── data/                           # Dữ liệu mẫu & Kho tri thức
│   ├── raw/                        # danang_places.json (100-150 địa điểm chuẩn hóa)
│   ├── knowledge_base/             # Cẩm nang ẩm thực, văn hóa, kinh nghiệm di chuyển
│   └── seed/                       # seed.js (Nạp CSDL tự động)
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
# Điền DATABASE_URL và GEMINI_API_KEY vào .env
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
# Server chạy tại: http://localhost:5000
```

### 2. Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
# Mở trình duyệt tại: http://localhost:3000
```
