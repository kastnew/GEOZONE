# Kế Hoạch Dự Án Chi Tiết: GeoZone AI (IT3150 - Project I)

## 1. Tổng quan Dự án
- **Tên đề tài:** GeoZone AI – Nền tảng tự động lập lịch trình du lịch cá nhân hóa dựa trên phân vùng địa lý và LLM.
- **Bản chất kỹ thuật:** Hệ thống tối ưu hóa và gom cụm địa lý (Zone-based Clustering & Greedy Knapsack Scheduling) trên Backend, kết hợp Mô hình ngôn ngữ lớn (LLM) để tổng hợp narrative và làm giàu bằng tri thức (RAG).
- **Quy mô thử nghiệm:** Thành phố Đà Nẵng (100–150 địa điểm chuẩn hóa, chia thành 5 Zones).

---

## 2. Phân công Nhiệm vụ (Nhóm 4 Thành viên)

| Thành viên | Vai trò | Trách nhiệm chính | Các file code & thư mục phụ trách |
|---|---|---|---|
| **Thành viên 1** | **Data & Database Lead** | - Thu thập, chuẩn hóa 100-150 địa điểm Đà Nẵng.<br>- Phân bổ tọa độ, gán nhãn `zone_id`, `tags`, chi phí, giờ mở/đóng cửa.<br>- Thiết kế schema PostgreSQL (Prisma), viết script seed database.<br>- Thu thập tài liệu cẩm nang du lịch cho RAG Knowledge Base. | `data/raw/danang_places.json`<br>`data/knowledge_base/*`<br>`data/seed/seed.ts`<br>`backend/prisma/schema.prisma` |
| **Thành viên 2** | **Backend Core & Algorithm Lead** | - Thiết lập Express.js & TypeScript architecture.<br>- Viết các hàm nghiệp vụ: lọc ứng viên (Filter), chấm điểm (Scorer), gom nhóm theo Zone (ZoneGrouper).<br>- Triển khai thuật toán lập lịch trình thỏa mãn ràng buộc ngân sách & thời gian (DayAllocator, TimeSlotScheduler).<br>- Xây dựng tính năng Hoán đổi động (Dynamic Swap Engine). | `backend/src/services/planner/*`<br>`backend/src/controllers/*`<br>`backend/src/routes/*`<br>`backend/src/types/plan.types.ts` |
| **Thành viên 3** | **AI & RAG Engineer** | - Tích hợp Gemini API qua Google Gen AI SDK.<br>- Xây dựng 2 phương án: **Không có RAG** (Direct JSON) và **Có RAG** (Knowledge Retrieval).<br>- Thiết kế System Prompts ràng buộc chống ảo giác (Anti-hallucination).<br>- Xây dựng cơ chế Output Validation & Merging bảo vệ dữ liệu giá/thời gian của DB. | `backend/src/services/ai/*`<br>`backend/src/services/ai/prompts/*`<br>`backend/src/services/ai/strategies/*`<br>`backend/src/services/ai/rag/*` |
| **Thành viên 4** | **Frontend UI/UX Lead** | - Xây dựng giao diện tương tác người dùng bằng React + Vite + Tailwind CSS.<br>- Xây dựng Input Form (ngân sách, số ngày, sở thích, toggle RAG).<br>- Thiết kế Timeline View trực quan hiển thị hoạt động từng ngày.<br>- Triển khai popup Dynamic Swap và bản đồ phân cụm Zone trực quan. | `frontend/src/components/*`<br>`frontend/src/services/api.ts`<br>`frontend/src/App.tsx`<br>`frontend/src/types/index.ts` |

---

## 3. Lộ trình Triển khai (Timeline 6 Tuần)

```mermaid
gantt
    title Lộ trình Triển khai GeoZone AI (IT3150)
    dateFormat  YYYY-MM-DD
    section Tuần 1: Thiết kế & Setup
    Thiết kế DB Schema & Setup Repo        :done, t1, 2026-11-03, 7d
    Thu thập dataset Đà Nẵng (100 điểm)   :done, t2, 2026-11-03, 7d
    section Tuần 2: Thuật toán Core
    Xây dựng CandidateFilter & PlaceScorer :active, t3, 2026-11-10, 7d
    ZoneGrouper & DayAllocator Algorithm   :active, t4, 2026-11-10, 7d
    section Tuần 3: AI & RAG Integration
    Tích hợp LLM Gemini & Prompt Chain     :t5, 2026-11-17, 7d
    Xây dựng 2 phương án RAG vs No-RAG     :t6, 2026-11-17, 7d
    Output Validation chống Hallucination  :t7, 2026-11-17, 7d
    section Tuần 4: Frontend Development
    Giao diện Input Form & Tag Selector    :t8, 2026-11-24, 7d
    Giao diện Timeline View & Day Cards    :t9, 2026-11-24, 7d
    section Tuần 5: Dynamic Swap & Tích hợp
    Triển khai Dynamic Swap Backend/Frontend:t10, 2026-12-01, 7d
    Kết nối API End-to-End & Test          :t11, 2026-12-01, 7d
    section Tuần 6: Tối ưu & Báo cáo
    Đánh giá độ trễ, chi phí & Hallucination:t12, 2026-12-08, 7d
    Viết báo cáo Project I & Slide Demo    :t13, 2026-12-08, 7d
```

---

## 4. Bảng Đánh giá Rủi ro & Giải pháp Dự phòng

| Rủi ro kỹ thuật | Mức độ | Giải pháp phòng ngừa của GeoZone |
|---|---|---|
| **LLM tự ý sửa đổi giá tiền / giờ mở cửa** | Cao | Áp dụng cơ chế **Output Validation & Merging**: LLM chỉ sinh mô tả (`aiDescription`), toàn bộ giá tiền và giờ mở cửa luôn được Backend inject từ DB gốc. |
| **Không tìm thấy điểm phù hợp sở thích** | Trung bình | Tích hợp **Fallback Relaxation**: nếu số địa điểm lọc theo tag không đủ số lượng tối thiểu cho các ngày, hệ thống tự động bổ sung các địa điểm phổ biến (`popularity >= 0.8`). |
| **Zone quá xa hoặc không kịp thời gian di chuyển** | Trung bình | Lưu ma trận thời gian di chuyển ước tính `ZoneDistance` và cộng thêm đệm an toàn 15–30 phút giữa các chặng. |
| **Chi phí gọi LLM API hoặc mất mạng** | Thấp | Thiết lập hệ thống fallback template cục bộ, đảm bảo lịch trình vẫn hiển thị ngay cả khi LLM API gặp sự cố. |
