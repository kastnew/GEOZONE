# GeoZone AI Backend API Contract Docs 🧭

Tài liệu đặc tả hợp đồng giao tiếp API (API Contract Documentation) cho hệ thống **GeoZone AI** — Nền tảng tự động lập lịch trình du lịch cá nhân hóa dựa trên phân vùng địa lý và LLM.

- **Base URL:** `http://localhost:5000`
- **Prefix:** Toàn bộ API được mount dưới tiền tố `/api/v1`.
- **Định dạng dữ liệu:** Request body gửi JSON cần có header `Content-Type: application/json`.
- **Xác thực (Authentication):** Sử dụng chuẩn **Dual-Token** (Access Token 15m dạng Bearer Header + Refresh Token 7d dạng HttpOnly Cookie).
- **Credentials:** Các API làm việc với Cookie (Auth refresh, login, logout) bắt buộc bật `credentials: 'include'` (hoặc `withCredentials: true` trên Axios).
- **Phân quyền (Authorization):** Gồm 3 quyền chính trong hệ thống: `USER` (Khách du lịch), `ADMIN` (Quản trị viên), `CUSTOMER` (Tương thích ngược).

---

# Bảng Mục Lục API

- [1. Health Check](#1-health-check)
  - [`GET /api/v1/health`](#get-apiv1health)
- [2. Authentication (Xác thực & Phiên làm việc)](#2-authentication)
  - [`POST /api/v1/auth/register`](#post-apiv1authregister)
  - [`POST /api/v1/auth/login`](#post-apiv1authlogin)
  - [`PATCH /api/v1/auth/change-password`](#patch-apiv1authchange-password)
  - [`POST /api/v1/auth/refresh-token`](#post-apiv1authrefresh-token)
  - [`POST /api/v1/auth/logout`](#post-apiv1authlogout)
- [3. User Management (Quản lý Người dùng)](#3-user-management)
  - [`GET /api/v1/users/me`](#get-apiv1usersme)
  - [`PATCH /api/v1/users/me`](#patch-apiv1usersme)
  - [`GET /api/v1/users`](#get-apiv1users)
  - [`GET /api/v1/users/:userId`](#get-apiv1usersuserid)
  - [`PATCH /api/v1/users/:userId`](#patch-apiv1usersuserid)
  - [`PATCH /api/v1/users/:userId/status`](#patch-apiv1usersuseridstatus)
- [4. Authentication & Security Middlewares](#4-authentication--security-middlewares)
- [5. Places & Zones Catalog (Danh mục Địa lý & Địa điểm)](#5-places--zones-catalog)
  - [`GET /api/v1/places/zones`](#get-apiv1placeszones)
  - [`GET /api/v1/places/search`](#get-apiv1placessearch)
- [6. AI Travel Planner & Dynamic Swap (Lập Lịch Trình Tự Động)](#6-ai-travel-planner--dynamic-swap)
  - [`POST /api/v1/plans/generate`](#post-apiv1plansgenerate)
  - [`POST /api/v1/plans/swap`](#post-apiv1plansswap)
- [7. Saved Itineraries Management (Lưu Trữ & Chia Sẻ Lịch Trình) [Kế hoạch]](#7-saved-itineraries-management-kế-hoạch)
  - [`POST /api/v1/plans/save`](#post-apiv1planssave-kế-hoạch)
  - [`GET /api/v1/plans/my-plans`](#get-apiv1plansmy-plans-kế-hoạch)
  - [`GET /api/v1/plans/:planId`](#get-apiv1plansplanid-kế-hoạch)
  - [`DELETE /api/v1/plans/:planId`](#delete-apiv1plansplanid-kế-hoạch)
  - [`GET /api/v1/plans/share/:shareToken`](#get-apiv1planssharesharetoken-kế-hoạch)
- [8. User Favorites (Địa Điểm Yêu Thích) [Kế hoạch]](#8-user-favorites-kế-hoạch)
  - [`POST /api/v1/users/favorites/:placeId`](#post-apiv1usersfavoritesplaceid-kế-hoạch)
  - [`DELETE /api/v1/users/favorites/:placeId`](#delete-apiv1usersfavoritesplaceid-kế-hoạch)
  - [`GET /api/v1/users/favorites`](#get-apiv1usersfavorites-kế-hoạch)
- [9. Admin Catalog Management (Quản Lý Địa Danh & Vùng) [Kế hoạch]](#9-admin-catalog-management-kế-hoạch)
  - [`POST /api/v1/admin/places`](#post-apiv1adminplaces-kế-hoạch)
  - [`PATCH /api/v1/admin/places/:placeId`](#patch-apiv1adminplacesplaceid-kế-hoạch)
  - [`DELETE /api/v1/admin/places/:placeId`](#delete-apiv1adminplacesplaceid-kế-hoạch)
  - [`POST /api/v1/admin/zones`](#post-apiv1adminzones-kế-hoạch)
  - [`PATCH /api/v1/admin/zones/:zoneId`](#patch-apiv1adminzoneszoneid-kế-hoạch)
- [10. RAG Knowledge Base Management [Kế hoạch]](#10-rag-knowledge-base-management-kế-hoạch)
  - [`GET /api/v1/knowledge`](#get-apiv1knowledge-kế-hoạch)
  - [`POST /api/v1/knowledge`](#post-apiv1knowledge-kế-hoạch)
  - [`DELETE /api/v1/knowledge/:id`](#delete-apiv1knowledgeid-kế-hoạch)
- [11. Tổng Hợp Trạng Thái Triển Khai API](#11-tổng-hợp-trạng-thái-triển-khai-api)

---

# 1. Health Check

# GET /api/v1/health

Dùng để kiểm tra trạng thái hoạt động của hệ thống backend.

Request không cần tham số, header hoặc body.

Response:

```json
{
  "status": "ok",
  "service": "GeoZone AI Backend",
  "timestamp": "2026-11-12T00:00:00.000Z"
}
```

HTTP status: `200 OK`

---

# 2. Authentication

Hệ thống xác thực áp dụng mô hình **Dual-Token** kế thừa trực tiếp từ dự án **Velora E-Commerce**, đảm bảo khả năng chống Timing-Attack, lưu trữ Refresh Token dưới dạng băm SHA-256 và thu hồi phiên toàn diện.

# POST /api/v1/auth/register

Đăng ký tài khoản người dùng mới. Tài khoản tạo qua endpoint này có quyền mặc định `USER`.

Request body:

```json
{
  "email": "tourist@example.com",
  "password": "StrongPassword123!",
  "name": "Nguyễn Văn Du Khách"
}
```

- `email`: string, bắt buộc. Tự động trim và chuyển về chữ thường (`lowercase`) chống trùng lặp.
- `password`: string, bắt buộc, độ dài từ 8 đến 72 ký tự. Băm bằng `bcrypt` (10 salt rounds).
- `name`: string, tùy chọn. Nếu để trống sẽ lấy tiền tố trước `@` của email.

Response thành công:

```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công!",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "tourist@example.com",
    "name": "Nguyễn Văn Du Khách",
    "role": "USER",
    "avatar_url": null,
    "is_active": true,
    "created_at": "2026-11-12T00:00:00.000Z"
  }
}
```

HTTP status: `201 Created`

Các trường hợp lỗi:
- `400`: Thiếu email hoặc mật khẩu (`"Email và mật khẩu là bắt buộc!"`).
- `400`: Định dạng email không hợp lệ (`"Email không hợp lệ!"`).
- `400`: Mật khẩu ngắn hơn 8 ký tự hoặc dài hơn 72 ký tự.
- `400`: Email đã được đăng ký (`"Email đã được sử dụng!"`).
- `500`: Lỗi máy chủ nội bộ.

# POST /api/v1/auth/login

Đăng nhập hệ thống bằng email và mật khẩu.

**Cơ chế an ninh:**
- **Chống Timing-Attack:** Áp dụng `DUMMY_HASH` chạy `bcrypt.compare` kể cả khi email không tồn tại để ngăn chặn việc dò quét sự tồn tại của email.
- **Silent Cleanup (Thu hồi phiên cũ mồ côi):** Nếu trình duyệt gửi kèm cookie `refreshToken` cũ (do đăng nhập lại hoặc chuyển đổi tài khoản trên cùng thiết bị), backend sẽ tự động băm SHA-256 và cập nhật `revoked: true` cho token cũ trong bảng `refresh_tokens` nhằm triệt tiêu hoàn toàn orphaned tokens mà không làm gián đoạn lượt đăng nhập mới.

Request body:

```json
{
  "email": "tourist@example.com",
  "password": "StrongPassword123!"
}
```

Khi đăng nhập thành công:
1. Backend cấp phát `accessToken` (15 phút) trả về trong JSON body.
2. Backend cấp phát `refreshToken` (7 ngày), băm một chiều `SHA-256` lưu vào bảng `refresh_tokens`.
3. Gửi cookie `refreshToken` về trình duyệt với cờ `HttpOnly: true`, `SameSite: Lax` (hoặc `None` ở production), `Secure: true` (khi chạy HTTPS).

Response thành công:

```json
{
  "success": true,
  "message": "Đăng nhập thành công!",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "tourist@example.com",
    "name": "Nguyễn Văn Du Khách",
    "avatar_url": null,
    "role": "USER"
  }
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:
- `400`: Thiếu hoặc sai định dạng email/mật khẩu.
- `401`: Email hoặc mật khẩu không chính xác (`"Email hoặc mật khẩu không đúng!"`).
- `403`: Tài khoản đã bị quản trị viên khóa (`"Tài khoản của bạn đã bị vô hiệu hóa!"`).
- `500`: Lỗi hệ thống.

# PATCH /api/v1/auth/change-password

Đổi mật khẩu người dùng đang đăng nhập.

Request headers:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request body:

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewStrongPassword456!"
}
```

**Cơ chế an ninh:** Khi đổi mật khẩu thành công, hệ thống sử dụng Database Transaction để:
1. Cập nhật `password_hash` mới.
2. Thu hồi toàn bộ Refresh Token (`revoked = true`) của tài khoản trên tất cả các thiết bị.
3. Xóa cookie `refreshToken` trên trình duyệt hiện tại.

Response thành công:

```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:
- `400`: Thiếu trường mật khẩu hoặc độ dài mật khẩu mới không hợp lệ (8 - 72 ký tự).
- `401`: Mật khẩu hiện tại không đúng (`"Mật khẩu hiện tại không đúng!"`).
- `401`: Thiếu hoặc sai Access Token.
- `403`: Tài khoản đã bị vô hiệu hóa.

# POST /api/v1/auth/refresh-token

Cấp mới Access Token (Silent Refresh) bằng Refresh Token được gửi tự động trong HttpOnly Cookie.

Request:
- Không gửi token qua header hay body.
- Trình duyệt tự gửi cookie `refreshToken`.
- Frontend bắt buộc bật cấu hình: `credentials: 'include'` (Fetch API) hoặc `withCredentials: true` (Axios).

Response thành công:

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:
- `401`: Không tìm thấy cookie `refreshToken`.
- `401`: Refresh token hết hạn hoặc sai chữ ký (Tự động xóa cookie).
- `403`: Token đã bị thu hồi (`revoked: true`) hoặc tài khoản người dùng bị khóa (`is_active: false`).

# POST /api/v1/auth/logout

Đăng xuất khỏi hệ thống.

Request:
- Gửi kèm HttpOnly cookie `refreshToken` (có thể kèm Access Token).

Khi gọi API, backend:
1. Tính băm SHA-256 của token trong cookie và xóa bản ghi trong bảng `refresh_tokens`.
2. Xóa sạch cookie `refreshToken` trên client bằng `res.clearCookie()`.

Response thành công:

```json
{
  "success": true,
  "message": "Đăng xuất thành công!"
}
```

HTTP status: `200 OK`

---

# 3. User Management

# GET /api/v1/users/me

Lấy thông tin hồ sơ của tài khoản đang đăng nhập.

Request headers:

```http
Authorization: Bearer <access_token>
```

Response thành công:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "tourist@example.com",
    "name": "Nguyễn Văn Du Khách",
    "avatar_url": "https://example.com/avatar.jpg",
    "role": "USER",
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-11-12T00:00:00.000Z"
  }
}
```

HTTP status: `200 OK`

# PATCH /api/v1/users/me

Cập nhật thông tin hồ sơ cá nhân (Tên hiển thị, Ảnh đại diện).

Request headers:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Request body:

```json
{
  "name": "Tên Hiển Thị Mới",
  "avatar_url": "https://example.com/new-avatar.png"
}
```

- `name`: string, tối đa 120 ký tự.
- `avatar_url`: string, tối đa 255 ký tự.

Response thành công:

```json
{
  "success": true,
  "message": "Cập nhật hồ sơ thành công!",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "tourist@example.com",
    "name": "Tên Hiển Thị Mới",
    "avatar_url": "https://example.com/new-avatar.png",
    "role": "USER",
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-11-12T00:00:00.000Z"
  }
}
```

HTTP status: `200 OK`

# GET /api/v1/users

Dành riêng cho **`ADMIN`**. Lấy danh sách toàn bộ người dùng trong hệ thống với các bộ lọc phân trang, tìm kiếm và sắp xếp.

Request headers:

```http
Authorization: Bearer <admin_access_token>
```

Query parameters:
- `page`: số trang, mặc định `1`.
- `limit`: số bản ghi mỗi trang, mặc định `10` (tối đa `100`).
- `search`: từ khóa tìm kiếm (hỗ trợ tìm theo email, tên, hoặc chính xác mã UUID).
- `role`: lọc theo vai trò (`USER`, `ADMIN`, `CUSTOMER`).
- `status`: lọc theo trạng thái (`active`, `inactive`).
- `sortBy`: sắp xếp (`oldest`, `email_asc`, `name_asc`, mặc định: `created_at` mới nhất).

Ví dụ: `GET /api/v1/users?page=1&limit=10&role=USER&status=active`

Response thành công:

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "tourist@example.com",
      "name": "Nguyễn Văn Du Khách",
      "avatar_url": null,
      "role": "USER",
      "is_active": true,
      "is_verified": false,
      "created_at": "2026-11-12T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

HTTP status: `200 OK`. Lỗi `403` nếu không có quyền `ADMIN`.

# GET /api/v1/users/:userId

Lấy thông tin chi tiết của một người dùng theo UUID. 
- Người dùng chỉ được xem thông tin của chính mình (`checkOwner`).
- Tài khoản `ADMIN` có quyền xem thông tin của mọi người dùng.

Request headers: `Authorization: Bearer <access_token>`  
Path parameter: `userId` (UUID v4)

Response:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "tourist@example.com",
    "name": "Nguyễn Văn Du Khách",
    "avatar_url": null,
    "role": "USER",
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-11-12T00:00:00.000Z"
  }
}
```

HTTP status: `200 OK`. Lỗi `400` nếu sai UUID, `403` nếu không phải chính chủ/admin, `404` nếu không tìm thấy.

# PATCH /api/v1/users/:userId

Cập nhật thông tin người dùng theo UUID (Chính chủ hoặc `ADMIN`). `ADMIN` có thể cập nhật thêm `role`.

Request headers: `Authorization: Bearer <access_token>`  
Path parameter: `userId` (UUID v4)  
Request body:

```json
{
  "name": "Nguyễn Văn Cập Nhật",
  "email": "newemail@example.com",
  "role": "ADMIN"
}
```

Response thành công:

```json
{
  "success": true,
  "message": "Cập nhật người dùng thành công!",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newemail@example.com",
    "name": "Nguyễn Văn Cập Nhật",
    "role": "ADMIN",
    "is_active": true
  }
}
```

HTTP status: `200 OK`

# PATCH /api/v1/users/:userId/status

Dành riêng cho **`ADMIN`**. Dùng để khóa (Vô hiệu hóa) hoặc mở khóa tài khoản người dùng.

Request headers: `Authorization: Bearer <admin_access_token>`  
Path parameter: `userId` (UUID v4)

**Cơ chế an toàn:** 
1. Admin không thể tự khóa tài khoản của chính mình (Trả về `400`).
2. Khi một tài khoản bị chuyển sang `is_active: false`, hệ thống tự động thu hồi toàn bộ Refresh Token của tài khoản đó để buộc đăng xuất tức thì khỏi mọi thiết bị.

Response thành công:

```json
{
  "success": true,
  "message": "Vô hiệu hóa tài khoản thành công!",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "tourist@example.com",
    "role": "USER",
    "is_active": false
  }
}
```

HTTP status: `200 OK`

---

# 4. Authentication & Security Middlewares

| Tên Middleware | File mã nguồn | Ý nghĩa & Luồng bảo vệ |
|---|---|---|
| **`verifyToken`** | `src/middlewares/auth.middleware.js` | Trích xuất chuỗi JWT Bearer từ header `Authorization`, kiểm tra chữ ký và hạn dùng. Giải mã gán thông tin vào `req.user`. |
| **`verifyActiveUser`** | `src/middlewares/auth.middleware.js` | Chạy ngay sau `verifyToken`, truy vấn trực tiếp DB theo `req.user.sub` để kiểm tra tài khoản có bị khóa (`is_active: false`) không và cập nhật `req.user.role` realtime. |
| **`verifyAdmin`** | `src/middlewares/auth.middleware.js` | Chặn đứng các request từ người dùng không có vai trò `ADMIN` với mã HTTP `403`. |
| **`checkOwner`** | `src/middlewares/checkOwner.js` | Kiểm tra quyền: Chỉ cho phép đi tiếp nếu `req.user.role === 'ADMIN'` hoặc `req.user.sub === req.params.userId`. |
| **`optionalAuth`** | `src/middlewares/optionalAuth.js` | Kiểm tra token tùy chọn. Nếu client gửi token hợp lệ thì gán `req.user`, nếu không gửi vẫn cho request tiếp tục xử lý dưới vai trò khách vãng lai (Guest). |
| **`validateUuidParam`** | `src/middlewares/validateUuid.js` | Kiểm tra định dạng các tham số params (như `userId`, `planId`) theo đúng chuẩn biểu thức chính quy UUID v4 trước khi thực hiện truy vấn. |
| **`errorHandler`** | `src/middlewares/errorHandler.js` | Bắt lỗi toàn cục, tự động phân tích các mã lỗi Prisma (`P2002` trùng lặp, `P2025` không tìm thấy, `P2023` sai UUID) thành thông báo tiếng Việt chuẩn mực. |

---

# 5. Places & Zones Catalog

# GET /api/v1/places/zones

Lấy danh sách toàn bộ các phân vùng địa lý (Zones) tại thành phố thử nghiệm (Đà Nẵng) kèm số lượng địa điểm thuộc mỗi Zone.

Request: Không cần tham số hay header xác thực.

Response thành công:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "Z1",
      "name": "Trung tâm Hải Châu",
      "description": "Khu vực trung tâm thương mại, bảo tàng, chợ truyền thống",
      "centerLat": "16.0678000",
      "centerLng": "108.2208000",
      "_count": {
        "places": 3
      }
    },
    {
      "id": 2,
      "code": "Z2",
      "name": "Ven biển Mỹ Khê - Sơn Trà",
      "description": "Dải bờ biển du lịch, công viên ven biển, nhà hàng hải sản",
      "centerLat": "16.0590000",
      "centerLng": "108.2450000",
      "_count": {
        "places": 2
      }
    }
  ]
}
```

HTTP status: `200 OK`

# GET /api/v1/places/search

Tìm kiếm và lọc danh sách các địa điểm du lịch theo thành phố và các thẻ sở thích (Tags).

Query parameters:
- `city`: string, mặc định `"Da Nang"`.
- `tags`: chuỗi các tags phân cách bằng dấu phẩy (ví dụ: `food,beach,culture`).

Ví dụ: `GET /api/v1/places/search?city=Da%20Nang&tags=food,culture`

Response thành công:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Chợ Cồn",
      "city": "Da Nang",
      "zoneId": 1,
      "zoneCode": "Z1",
      "zoneName": "Trung tâm Hải Châu",
      "address": "290 Hùng Vương, Vĩnh Trung, Hải Châu, Đà Nẵng",
      "estimatedCost": 100000,
      "duration": 90,
      "openingTime": "07:00",
      "closingTime": "19:00",
      "latitude": 16.0694,
      "longitude": 108.2162,
      "popularity": 0.95,
      "rating": 4.5,
      "tags": ["food", "culture"]
    }
  ]
}
```

HTTP status: `200 OK`

---

# 6. AI Travel Planner & Dynamic Swap

# POST /api/v1/plans/generate

API cốt lõi kích hoạt **Thuật toán Planner 5 bước kết hợp LLM (Gemini) và RAG** để sinh lịch trình du lịch cá nhân hóa hoàn chỉnh.

Request body:

```json
{
  "city": "Da Nang",
  "days": 2,
  "totalBudget": 1500000,
  "preferences": ["food", "beach", "culture"],
  "startTime": "08:00",
  "endTime": "21:00",
  "enableRag": false
}
```

- `city`: string, thành phố du lịch (mặc định `"Da Nang"`).
- `days`: number, số ngày lưu trú (từ 1 đến 4 ngày).
- `totalBudget`: number, tổng ngân sách dự kiến (VNĐ).
- `preferences`: array of string, danh sách sở thích thuộc 7 tags chuẩn: `food`, `beach`, `culture`, `nature`, `adventure`, `nightlife`, `sightseeing`.
- `startTime`: string, mốc giờ bắt đầu ngày mới (mặc định `"08:00"`).
- `enableRag`: boolean, cờ lựa chọn chiến lược AI:
  - `false` (Phương án 1 - Direct JSON): Tốc độ 1-2s, chi phí thấp, tóm tắt trực quan.
  - `true` (Phương án 2 - Hybrid RAG): Truy xuất cẩm nang văn hóa/ẩm thực bổ trợ trường `aiTravelTip`.

Response thành công:

```json
{
  "success": true,
  "data": {
    "planId": "plan_1794416744000",
    "city": "Da Nang",
    "totalDays": 2,
    "totalBudget": 1500000,
    "actualCost": 160000,
    "strategyUsed": "DIRECT_JSON",
    "overallSummary": "Chuyến đi Da Nang được thiết kế tối ưu theo phân vùng địa lý và ngân sách của bạn.",
    "days": [
      {
        "dayNumber": 1,
        "zoneId": 1,
        "zoneName": "Trung tâm Hải Châu",
        "title": "Ngày 1: Khám phá Trung tâm Hải Châu",
        "totalEstimatedCost": 160000,
        "totalDurationMin": 255,
        "activities": [
          {
            "placeId": 1,
            "placeName": "Chợ Cồn",
            "zoneId": 1,
            "zoneName": "Trung tâm Hải Châu",
            "timeSlot": "08:00 - 09:30",
            "startTime": "08:00",
            "endTime": "09:30",
            "duration": 90,
            "estimatedCost": 100000,
            "travelTimeFromPrev": 0,
            "latitude": 16.0694,
            "longitude": 108.2162,
            "aiDescription": "Trải nghiệm thiên đường ẩm thực địa phương phong phú tại Chợ Cồn.",
            "aiTravelTip": "Nên ghé khu trong nhà trước 17:00 và chuẩn bị tiền mặt mệnh giá nhỏ."
          }
        ]
      }
    ]
  }
}
```

HTTP status: `200 OK`

# POST /api/v1/plans/swap

Tính năng **Hoán đổi động (Dynamic Swap Engine)** cho phép người dùng thay thế 1 địa điểm trong timeline bằng một địa điểm khác:
- Cùng phân vùng (`targetZoneId`).
- Chưa xuất hiện trong lịch trình (`excludedPlaceIds`).
- Chi phí vừa vặn với ngân sách còn lại (`remainingBudget`).

Request body:

```json
{
  "currentPlaceId": 1,
  "dayNumber": 1,
  "targetZoneId": 1,
  "remainingBudget": 500000,
  "excludedPlaceIds": [1, 2, 3],
  "userPreferences": ["food", "culture"]
}
```

Response thành công:

```json
{
  "success": true,
  "data": {
    "placeId": 4,
    "placeName": "Bảo tàng Điêu khắc Chăm",
    "zoneId": 1,
    "zoneName": "Trung tâm Hải Châu",
    "timeSlot": "Đã cập nhật",
    "startTime": "08:00",
    "endTime": "09:30",
    "duration": 90,
    "estimatedCost": 60000,
    "travelTimeFromPrev": 15,
    "latitude": 16.0603,
    "longitude": 108.2235,
    "aiDescription": "Địa điểm thay thế lý tưởng: Bảo tàng Điêu khắc Chăm phù hợp với ngân sách của bạn."
  }
}
```

HTTP status: `200 OK`. Trả về `404` nếu không còn địa điểm nào khả dĩ trong cùng Zone.

---

# 7. Saved Itineraries Management (Kế hoạch)

Nhóm API hỗ trợ người dùng lưu lại lịch trình sau khi tạo, xem lại danh sách các chuyến đi và chia sẻ lịch trình với bạn bè qua liên kết công khai.

# POST /api/v1/plans/save [Kế hoạch]

Lưu lịch trình vừa tạo vào tài khoản người dùng đã đăng nhập.

- **Phương thức:** `POST`
- **Quyền yêu cầu:** `USER` (Bắt buộc Access Token)
- **Database:** Tạo bản ghi trong bảng `saved_plans`.
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 3]`

# GET /api/v1/plans/my-plans [Kế hoạch]

Lấy danh sách các lịch trình du lịch đã lưu của người dùng hiện tại (hỗ trợ phân trang).

- **Phương thức:** `GET`
- **Quyền yêu cầu:** `USER` (Bắt buộc Access Token)
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 3]`

# GET /api/v1/plans/:planId [Kế hoạch]

Lấy dữ liệu chi tiết của 1 lịch trình đã lưu theo mã UUID.

- **Phương thức:** `GET`
- **Quyền yêu cầu:** `USER` (Chính chủ hoặc `ADMIN`)
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 3]`

# DELETE /api/v1/plans/:planId [Kế hoạch]

Xóa 1 lịch trình đã lưu khỏi tài khoản người dùng.

- **Phương thức:** `DELETE`
- **Quyền yêu cầu:** `USER` (Chính chủ hoặc `ADMIN`)
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 3]`

# GET /api/v1/plans/share/:shareToken [Kế hoạch]

Xem chi tiết lịch trình công khai thông qua mã token chia sẻ (không yêu cầu đăng nhập).

- **Phương thức:** `GET`
- **Quyền yêu cầu:** Public
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

---

# 8. User Favorites (Kế hoạch)

Nhóm API cho phép người dùng đánh dấu và quản lý các địa điểm yêu thích (Bookmark) tại Đà Nẵng.

# POST /api/v1/users/favorites/:placeId [Kế hoạch]

Thêm địa điểm vào danh sách yêu thích của người dùng.

- **Phương thức:** `POST`
- **Quyền yêu cầu:** `USER` (Bắt buộc Access Token)
- **Database:** Bảng `user_favorites` (`@@unique([user_id, place_id])`).
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

# DELETE /api/v1/users/favorites/:placeId [Kế hoạch]

Xóa địa điểm khỏi danh sách yêu thích của người dùng.

- **Phương thức:** `DELETE`
- **Quyền yêu cầu:** `USER` (Bắt buộc Access Token)
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

# GET /api/v1/users/favorites [Kế hoạch]

Lấy danh sách tất cả địa điểm mà người dùng hiện tại đã đánh dấu yêu thích.

- **Phương thức:** `GET`
- **Quyền yêu cầu:** `USER` (Bắt buộc Access Token)
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

---

# 9. Admin Catalog Management (Kế hoạch)

Nhóm API dành riêng cho `ADMIN` để thêm, sửa, xóa các địa điểm du lịch và quản lý thông số phân vùng Zone trên hệ thống.

# POST /api/v1/admin/places [Kế hoạch]

Thêm mới một địa điểm du lịch vào cơ sở dữ liệu.

- **Phương thức:** `POST`
- **Quyền yêu cầu:** `ADMIN`
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

# PATCH /api/v1/admin/places/:placeId [Kế hoạch]

Cập nhật thông tin địa điểm (giá vé, thời lượng, giờ mở cửa, tọa độ, tags).

- **Phương thức:** `PATCH`
- **Quyền yêu cầu:** `ADMIN`
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

# DELETE /api/v1/admin/places/:placeId [Kế hoạch]

Xóa một địa điểm khỏi hệ thống.

- **Phương thức:** `DELETE`
- **Quyền yêu cầu:** `ADMIN`
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

# POST /api/v1/admin/zones [Kế hoạch]

Tạo một phân vùng địa lý mới (mã Zone, tên Zone, tọa độ tâm).

- **Phương thức:** `POST`
- **Quyền yêu cầu:** `ADMIN`
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

# PATCH /api/v1/admin/zones/:zoneId [Kế hoạch]

Cập nhật thông tin phân vùng địa lý.

- **Phương thức:** `PATCH`
- **Quyền yêu cầu:** `ADMIN`
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

---

# 10. RAG Knowledge Base Management (Kế hoạch)

Nhóm API quản trị các mẩu cẩm nang văn hóa, kinh nghiệm ẩm thực phục vụ tầng RAG.

# GET /api/v1/knowledge [Kế hoạch]

Truy vấn danh sách các đoạn tri thức cẩm nang (`knowledge_chunks`) theo địa điểm hoặc chuyên mục.

- **Phương thức:** `GET`
- **Quyền yêu cầu:** Public / `USER`
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

# POST /api/v1/knowledge [Kế hoạch]

Thêm mới một mẩu cẩm nang tri thức du lịch vào Database / Vector Store.

- **Phương thức:** `POST`
- **Quyền yêu cầu:** `ADMIN`
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

# DELETE /api/v1/knowledge/:id [Kế hoạch]

Xóa một mẩu cẩm nang tri thức.

- **Phương thức:** `DELETE`
- **Quyền yêu cầu:** `ADMIN`
- **Trạng thái:** `[Chưa triển khai - Đang trong kế hoạch lộ trình Tuần 4]`

---

# 11. Tổng Hợp Trạng Thái Triển Khai API

| Endpoint | Method | Trạng thái kỹ thuật | Quyền hạn |
|---|---|:---:|---|
| `/api/v1/health` | `GET` | ✅ **Đã hoàn thiện** | Public |
| `/api/v1/auth/register` | `POST` | ✅ **Đã hoàn thiện** | Public |
| `/api/v1/auth/login` | `POST` | ✅ **Đã hoàn thiện** | Public |
| `/api/v1/auth/change-password` | `PATCH` | ✅ **Đã hoàn thiện** | Logged-in User |
| `/api/v1/auth/refresh-token` | `POST` | ✅ **Đã hoàn thiện** | Public (Cookie) |
| `/api/v1/auth/logout` | `POST` | ✅ **Đã hoàn thiện** | Public (Cookie) |
| `/api/v1/users/me` | `GET` | ✅ **Đã hoàn thiện** | Logged-in User |
| `/api/v1/users/me` | `PATCH` | ✅ **Đã hoàn thiện** | Logged-in User |
| `/api/v1/users` | `GET` | ✅ **Đã hoàn thiện** | `ADMIN` |
| `/api/v1/users/:userId` | `GET` | ✅ **Đã hoàn thiện** | Owner / `ADMIN` |
| `/api/v1/users/:userId` | `PATCH` | ✅ **Đã hoàn thiện** | Owner / `ADMIN` |
| `/api/v1/users/:userId/status` | `PATCH` | ✅ **Đã hoàn thiện** | `ADMIN` |
| `/api/v1/places/zones` | `GET` | ✅ **Đã hoàn thiện** | Public |
| `/api/v1/places/search` | `GET` | ✅ **Đã hoàn thiện** | Public |
| `/api/v1/plans/generate` | `POST` | ✅ **Đã hoàn thiện** | Public / Guest |
| `/api/v1/plans/swap` | `POST` | ✅ **Đã hoàn thiện** | Public / Guest |
| `/api/v1/plans/save` | `POST` | ⏳ *Kế hoạch Tuần 3* | Logged-in User |
| `/api/v1/plans/my-plans` | `GET` | ⏳ *Kế hoạch Tuần 3* | Logged-in User |
| `/api/v1/plans/:planId` | `GET` | ⏳ *Kế hoạch Tuần 3* | Owner / `ADMIN` |
| `/api/v1/plans/:planId` | `DELETE` | ⏳ *Kế hoạch Tuần 3* | Owner / `ADMIN` |
| `/api/v1/plans/share/:shareToken`| `GET` | ⏳ *Kế hoạch Tuần 4* | Public |
| `/api/v1/users/favorites/:placeId`| `POST`| ⏳ *Kế hoạch Tuần 4* | Logged-in User |
| `/api/v1/users/favorites/:placeId`| `DELETE`| ⏳ *Kế hoạch Tuần 4* | Logged-in User |
| `/api/v1/users/favorites` | `GET` | ⏳ *Kế hoạch Tuần 4* | Logged-in User |
| `/api/v1/admin/places` | `POST` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| `/api/v1/admin/places/:placeId` | `PATCH`| ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| `/api/v1/admin/places/:placeId` | `DELETE`| ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| `/api/v1/admin/zones` | `POST` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| `/api/v1/admin/zones/:zoneId` | `PATCH` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| `/api/v1/knowledge` | `GET` | ⏳ *Kế hoạch Tuần 4* | Public |
| `/api/v1/knowledge` | `POST` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| `/api/v1/knowledge/:id` | `DELETE` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
