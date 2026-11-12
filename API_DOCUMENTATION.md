# GeoZone AI Backend API Contract Docs 🧭

Tài liệu đặc tả hợp đồng giao tiếp API (API Contract Documentation) cho hệ thống **GeoZone AI** — Nền tảng tự động lập lịch trình du lịch cá nhân hóa dựa trên phân vùng địa lý và LLM.

- **Base URL:** `http://localhost:5000`
- **Prefix:** Toàn bộ API được mount dưới tiền tố `/api/v1`.
- **Định dạng dữ liệu:** Request body gửi JSON cần có header `Content-Type: application/json`.
- **Nguyên tắc thiết kế chuẩn RESTful:**
  - **Tài nguyên danh từ số nhiều:** `/zones`, `/places`, `/tags`, `/plans`, `/users`.
  - **HTTP Methods ngữ nghĩa:** `GET` (đọc dữ liệu), `POST` (tạo mới/lưu trữ), `PATCH` (cập nhật từng phần), `DELETE` (xóa). Không đưa động từ (`save`, `search`, `my-plans`) vào URL collection.
  - **Phân quyền bằng Middleware:** Không sinh namespace dư thừa `/admin/` cho cùng một thực thể; quyền hạn `ADMIN` được bảo vệ bằng middleware `verifyToken` và `verifyAdmin`.
  - **Định danh chủ thể rõ ràng:** Các tài nguyên thuộc về người dùng đang đăng nhập sử dụng tiền tố `/users/me/...` (ví dụ: `/users/me/favorites`).
  - **Phân tách thao tác AI (RPC-style):** Các tác vụ xử lý tính toán thuật toán / LLM không lưu trực tiếp vào CSDL được gom nhóm rõ ràng dưới namespace `/ai/...` (`/ai/generate-plan`, `/ai/swap-place`).
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
- [5. Geographic Zones & Places Catalog (Khu Vực & Địa Điểm Du Lịch)](#5-geographic-zones--places-catalog)
  - [`GET /api/v1/zones`](#get-apiv1zones)
  - [`GET /api/v1/places`](#get-apiv1places)
  - [`GET /api/v1/places/:placeId`](#get-apiv1placesplaceid)
- [6. Taxonomy & Tags Catalog (Danh Mục Thẻ & Sở Thích)](#6-taxonomy--tags-catalog)
  - [`GET /api/v1/tags`](#get-apiv1tags)
- [7. AI Travel Engine (Sinh & Hoán Đổi Lịch Trình Tự Động)](#7-ai-travel-engine)
  - [`POST /api/v1/ai/generate-plan`](#post-apiv1aigenerate-plan)
  - [`POST /api/v1/ai/swap-place`](#post-apiv1aiswap-place)
- [8. Itineraries Management (Quản Lý Lịch Trình Đã Lưu) [Kế hoạch]](#8-itineraries-management-kế-hoạch)
  - [`POST /api/v1/plans`](#post-apiv1plans-kế-hoạch)
  - [`GET /api/v1/plans`](#get-apiv1plans-kế-hoạch)
  - [`GET /api/v1/plans/:planId`](#get-apiv1plansplanid-kế-hoạch)
  - [`DELETE /api/v1/plans/:planId`](#delete-apiv1plansplanid-kế-hoạch)
  - [`GET /api/v1/plans/share/:shareToken`](#get-apiv1planssharesharetoken-kế-hoạch)
- [9. User Favorites (Địa Điểm Yêu Thích) [Kế hoạch]](#9-user-favorites-kế-hoạch)
  - [`GET /api/v1/users/me/favorites`](#get-apiv1usersmefavorites-kế-hoạch)
  - [`POST /api/v1/users/me/favorites`](#post-apiv1usersmefavorites-kế-hoạch)
  - [`DELETE /api/v1/users/me/favorites/:placeId`](#delete-apiv1usersmefavoritesplaceid-kế-hoạch)
- [10. Catalog Administration (Quản Trị Danh Mục Địa Điểm & Vùng) [Kế hoạch]](#10-catalog-administration-kế-hoạch)
  - [`POST /api/v1/places`](#post-apiv1places-kế-hoạch)
  - [`PATCH /api/v1/places/:placeId`](#patch-apiv1placesplaceid-kế-hoạch)
  - [`DELETE /api/v1/places/:placeId`](#delete-apiv1placesplaceid-kế-hoạch)
  - [`POST /api/v1/zones`](#post-apiv1zones-kế-hoạch)
  - [`PATCH /api/v1/zones/:zoneId`](#patch-apiv1zoneszoneid-kế-hoạch)
  - [`DELETE /api/v1/zones/:zoneId`](#delete-apiv1zoneszoneid-kế-hoạch)
- [11. RAG Knowledge Base Management [Kế hoạch]](#11-rag-knowledge-base-management-kế-hoạch)
  - [`GET /api/v1/knowledge`](#get-apiv1knowledge-kế-hoạch)
  - [`POST /api/v1/knowledge`](#post-apiv1knowledge-kế-hoạch)
  - [`DELETE /api/v1/knowledge/:id`](#delete-apiv1knowledgeid-kế-hoạch)
- [12. Tổng Hợp Trạng Thái Triển Khai API](#12-tổng-hợp-trạng-thái-triển-khai-api)

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

Nhóm API quản lý phiên đăng nhập và bảo mật người dùng, kế thừa tiêu chuẩn bảo mật của dự án **Velora**.

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
- `400`: Thiếu email hoặc mật khẩu.
- `401`: Sai email hoặc sai mật khẩu (`"Email hoặc mật khẩu không đúng!"`).
- `403`: Tài khoản đã bị khóa bởi Admin (`"Tài khoản của bạn đã bị vô hiệu hóa!"`).
- `500`: Lỗi máy chủ nội bộ.

# PATCH /api/v1/auth/change-password

Đổi mật khẩu tài khoản người dùng đang đăng nhập.

Yêu cầu xác thực: Bearer Access Token trong header `Authorization`.

Request body:

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "BrandNewPassword456!"
}
```

Khi đổi mật khẩu thành công:
- Mật khẩu mới được băm và cập nhật vào CSDL.
- Toàn bộ `refreshToken` cũ của user trong bảng `refresh_tokens` đều bị đánh dấu `revoked: true` (đăng xuất khỏi tất cả thiết bị khác).
- Cookie `refreshToken` của phiên hiện tại được xóa sạch (`clearCookie`).

Response thành công:

```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:
- `400`: Thiếu thông tin mật khẩu hiện tại hoặc mật khẩu mới.
- `400`: Mật khẩu mới không đạt độ dài quy định (8–72 ký tự).
- `401`: Chưa cung cấp Bearer Token hoặc token không hợp lệ / hết hạn.
- `401`: Mật khẩu hiện tại không chính xác (`"Mật khẩu hiện tại không đúng!"`).
- `403`: Tài khoản bị vô hiệu hóa.
- `404`: Không tìm thấy thông tin người dùng trong CSDL.

# POST /api/v1/auth/refresh-token

Cấp mới Access Token thông qua `refreshToken` lưu trong HttpOnly Cookie mà không yêu cầu người dùng nhập lại mật khẩu (Silent Refresh).

Request:
- Header bắt buộc: Không yêu cầu Bearer token.
- Cookie bắt buộc: `refreshToken=<token>` (tự động đính kèm khi gọi từ trình duyệt có bật `credentials: 'include'`).

Quy trình xác thực:
1. Kiểm tra chữ ký JWT và thời hạn còn hiệu lực của `refreshToken` trong cookie.
2. Băm SHA-256 chuỗi token và đối chiếu với bản ghi trong bảng `refresh_tokens`.
3. Kiểm tra cờ `revoked == false` và tài khoản `user.is_active == true`.
4. Nếu hợp lệ, cấp phát Access Token mới (thời hạn 15 phút).

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
- `401`: Token trong cookie hết hạn hoặc chữ ký không hợp lệ.
- `403`: Phiên làm việc đã bị thu hồi (`revoked == true`) hoặc tài khoản bị vô hiệu hóa.
- `500`: Lỗi máy chủ.

# POST /api/v1/auth/logout

Đăng xuất người dùng hiện tại khỏi phiên làm việc.

Request: Gửi cookie `refreshToken` lên backend.

Backend xử lý:
1. Xóa bản ghi Refresh Token tương ứng trong bảng `refresh_tokens` (hoặc đánh dấu `revoked: true`).
2. Gửi chỉ thị `res.clearCookie('refreshToken')` về client để xóa cookie trên trình duyệt.

Response:

```json
{
  "success": true,
  "message": "Đăng xuất thành công!"
}
```

HTTP status: `200 OK`

---

# 3. User Management

Nhóm API quản lý hồ sơ cá nhân và quản trị người dùng dành cho Admin.

# GET /api/v1/users/me

Lấy thông tin tài khoản của chính người dùng đang đăng nhập.

Yêu cầu xác thực: Bearer Access Token.

Response:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "tourist@example.com",
    "name": "Nguyễn Văn Du Khách",
    "role": "USER",
    "avatar_url": null,
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-11-12T00:00:00.000Z",
    "updated_at": "2026-11-12T00:00:00.000Z"
  }
}
```

HTTP status: `200 OK`

# PATCH /api/v1/users/me

Cập nhật thông tin hồ sơ của chính người dùng đang đăng nhập (họ tên, ảnh đại diện). Không cho phép tự đổi email hoặc role qua endpoint này.

Yêu cầu xác thực: Bearer Access Token.

Request body:

```json
{
  "name": "Nguyễn Văn Du Khách (Đã cập nhật)",
  "avatar_url": "https://example.com/avatar.png"
}
```

Response:

```json
{
  "success": true,
  "message": "Cập nhật hồ sơ thành công!",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "tourist@example.com",
    "name": "Nguyễn Văn Du Khách (Đã cập nhật)",
    "role": "USER",
    "avatar_url": "https://example.com/avatar.png",
    "is_active": true,
    "updated_at": "2026-11-12T00:05:00.000Z"
  }
}
```

HTTP status: `200 OK`

# GET /api/v1/users

Dành riêng cho `ADMIN`: Lấy danh sách toàn bộ người dùng trong hệ thống (có hỗ trợ phân trang, tìm kiếm email/tên và lọc theo trạng thái).

Yêu cầu xác thực: Bearer Access Token của tài khoản có `role: "ADMIN"`.

Query parameters:
- `page`: number, mặc định 1.
- `limit`: number, mặc định 10.
- `search`: string, tìm kiếm mờ theo email hoặc name.
- `is_active`: boolean (`true` / `false`).

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "tourist@example.com",
      "name": "Nguyễn Văn Du Khách",
      "role": "USER",
      "is_active": true,
      "created_at": "2026-11-12T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

HTTP status: `200 OK`. Trả về `403 Forbidden` nếu không phải Admin.

# GET /api/v1/users/:userId

Xem thông tin chi tiết một người dùng cụ thể.

Yêu cầu xác thực:
- Người dùng chỉ được xem chính hồ sơ của mình (`id == userId`).
- Tài khoản `ADMIN` được quyền xem hồ sơ của bất kỳ ai.

HTTP status: `200 OK`. `403` nếu không có quyền sở hữu, `404` nếu không tìm thấy.

# PATCH /api/v1/users/:userId

Dành riêng cho `ADMIN`: Cập nhật thông tin chi tiết của người dùng khác (bao gồm cả phân quyền `role` và cờ kích hoạt `is_active`).

Yêu cầu xác thực: `ADMIN`.

Request body:

```json
{
  "name": "Tên mới",
  "role": "ADMIN",
  "is_active": true
}
```

HTTP status: `200 OK`

# PATCH /api/v1/users/:userId/status

Dành riêng cho `ADMIN`: Khóa hoặc mở khóa tài khoản người dùng nhanh chóng. Khi tài khoản bị khóa (`is_active: false`), toàn bộ Refresh Token của tài khoản đó lập tức bị thu hồi.

Yêu cầu xác thực: `ADMIN`.

Request body:

```json
{
  "is_active": false
}
```

HTTP status: `200 OK`

---

# 4. Authentication & Security Middlewares

Hệ thống bảo vệ các tài nguyên bằng 6 middleware chuẩn hóa:

1. **`verifyToken`**:
   - Trích xuất token từ header `Authorization: Bearer <token>`.
   - Xác thực chữ ký bằng `ENV.ACCESS_TOKEN_SECRET`.
   - Gán payload giải mã vào `req.user` (`{ sub: userId, role: userRole }`).
   - Trả về `401 Unauthorized` nếu thiếu token, token hết hạn hoặc sai chữ ký.

2. **`verifyActiveUser`**:
   - Kiểm tra `is_active == true` trong database.
   - Trả về `403 Forbidden` nếu tài khoản đã bị khóa.

3. **`verifyAdmin`**:
   - Kiểm tra `req.user.role === 'ADMIN'`.
   - Trả về `403 Forbidden` nếu là người dùng thông thường (`USER` hoặc `CUSTOMER`).

4. **`checkOwner`**:
   - Kiểm tra quyền sở hữu tài nguyên (ví dụ: `userId` trên params hoặc `plan.user_id`).
   - Cho phép nếu `req.user.sub === targetUserId` HOẶC `req.user.role === 'ADMIN'`.
   - Trả về `403 Forbidden` nếu cố tình truy cập tài nguyên của người khác.

5. **`optionalAuth`**:
   - Dùng cho các endpoint công khai nhưng có trải nghiệm cá nhân hóa nếu đã đăng nhập (ví dụ: `/ai/generate-plan`).
   - Nếu có Bearer token hợp lệ thì gán `req.user`; nếu không có token hoặc token hỏng thì bỏ qua mà không chặn request.

6. **`validateUuidParam(paramName)`**:
   - Kiểm tra định dạng UUID v4 của tham số trên URL (`:userId`, `:planId`).
   - Ngăn chặn lỗi cú pháp `P2023` từ Prisma nếu truyền chuỗi sai chuẩn. Trả về `400 Bad Request` ngay lập tức.

---

# 5. Geographic Zones & Places Catalog

Nhóm API tra cứu danh mục địa lý độc lập và danh sách các địa điểm du lịch Đà Nẵng.

# GET /api/v1/zones

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

# GET /api/v1/places

Tra cứu và lọc danh sách các địa điểm du lịch bằng Query Parameters chuẩn RESTful.

Query parameters:
- `city`: string, mặc định `"Da Nang"`.
- `zoneId`: number, lọc theo ID phân vùng (ví dụ: `1`).
- `tags`: chuỗi các thẻ sở thích phân cách bằng dấu phẩy (ví dụ: `food,beach,culture`).
- `maxCost`: number, lọc các địa điểm có chi phí dự tính $\le$ `maxCost`.

Ví dụ: `GET /api/v1/places?city=Da%20Nang&zoneId=1&tags=food,culture`

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

# GET /api/v1/places/:placeId

Xem thông tin chi tiết một địa điểm du lịch theo ID.

Response thành công:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Chợ Cồn",
    "city": "Da Nang",
    "zoneId": 1,
    "address": "290 Hùng Vương, Vĩnh Trung, Hải Châu, Đà Nẵng",
    "estimatedCost": 100000,
    "duration": 90,
    "openingTime": "07:00",
    "closingTime": "19:00",
    "latitude": 16.0694,
    "longitude": 108.2162,
    "popularity": 0.95,
    "rating": 4.5,
    "shortDesc": "Thiên đường ẩm thực địa phương phong phú của Đà Nẵng.",
    "tags": ["food", "culture"]
  }
}
```

HTTP status: `200 OK`. `404 Not Found` nếu không tìm thấy địa điểm.

---

# 6. Taxonomy & Tags Catalog

Nhóm API phục vụ vẽ bộ lọc sở thích (Filter/Preferences) cho Frontend.

# GET /api/v1/tags

Lấy toàn bộ danh mục các thẻ sở thích (Tags) đã được định nghĩa trong hệ thống để Frontend hiển thị màn hình onboarding hoặc popup chọn sở thích du lịch.

Request: Không cần xác thực.

Response thành công:

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "food", "category": "culinary" },
    { "id": 2, "name": "beach", "category": "nature" },
    { "id": 3, "name": "culture", "category": "heritage" },
    { "id": 4, "name": "nature", "category": "nature" },
    { "id": 5, "name": "relaxation", "category": "leisure" },
    { "id": 6, "name": "nightlife", "category": "entertainment" },
    { "id": 7, "name": "adventure", "category": "activity" }
  ]
}
```

HTTP status: `200 OK`

---

# 7. AI Travel Engine

Các tác vụ xử lý tính toán thuật toán / LLM theo phong cách RPC-style chuyên biệt. 

**Luồng chuẩn:**
1. Frontend gửi yêu cầu vào `POST /api/v1/ai/generate-plan` $\rightarrow$ Nhận JSON lịch trình nháp (chưa ghi vào CSDL).
2. Người dùng xem bản nháp trên Timeline, nếu muốn đổi chỗ thì Frontend gọi `POST /api/v1/ai/swap-place`.
3. Khi người dùng bấm "Lưu chuyến đi", Frontend gửi JSON hoàn thiện vào `POST /api/v1/plans` để lưu chính thức vào bảng `saved_plans`.

# POST /api/v1/ai/generate-plan

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
- `preferences`: array of string, danh sách sở thích thuộc 7 tags chuẩn: `food`, `beach`, `culture`, `nature`, `adventure`, `nightlife`, `relaxation`.
- `startTime`: string, mốc giờ bắt đầu ngày mới (mặc định `"08:00"`).
- `enableRag`: boolean, cờ lựa chọn chiến lược AI:
  - `false` (Direct JSON Strategy): Tốc độ 1-2s, chi phí thấp, tóm tắt trực quan.
  - `true` (Hybrid RAG Strategy): Truy xuất cẩm nang văn hóa/ẩm thực bổ trợ trường `aiTravelTip`.

Response thành công:

```json
{
  "success": true,
  "data": {
    "planId": "draft_plan_1794416744000",
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

# POST /api/v1/ai/swap-place

Tính năng **Hoán đổi động (Dynamic Swap Engine)** cho phép người dùng thay thế 1 địa điểm trong timeline bản nháp bằng một địa điểm khác:
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

HTTP status: `200 OK`. Trả về `404 Not Found` nếu không còn địa điểm nào khả dĩ trong cùng Zone.

---

# 8. Itineraries Management [Kế hoạch]

Nhóm API quản lý việc lưu trữ, truy xuất và chia sẻ lịch trình chính thức của người dùng trong CSDL PostgreSQL (bảng `saved_plans`).

# POST /api/v1/plans [Kế hoạch]

Tạo mới / Lưu một lịch trình du lịch vào CSDL. 

- **Phương thức:** `POST`
- **Quyền yêu cầu:** `USER` (Bắt buộc Bearer Access Token).
- **Cơ chế:** Backend tự động trích xuất `req.user.sub` làm `user_id` sở hữu, không cho phép giả mạo `userId` từ body.

Request body:

```json
{
  "title": "Chuyến đi Đà Nẵng 2 ngày cùng bạn thân",
  "city": "Da Nang",
  "totalDays": 2,
  "totalBudget": 1500000,
  "actualCost": 160000,
  "strategyUsed": "DIRECT_JSON",
  "planData": {
    "days": [...]
  }
}
```

Response thành công:

```json
{
  "success": true,
  "message": "Lưu lịch trình thành công!",
  "data": {
    "id": "e9b5f928-860d-4076-a0e2-6323cf106ec3",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Chuyến đi Đà Nẵng 2 ngày cùng bạn thân",
    "city": "Da Nang",
    "totalDays": 2,
    "totalBudget": "1500000.00",
    "actualCost": "160000.00",
    "status": "COMPLETED",
    "createdAt": "2026-11-12T00:00:00.000Z"
  }
}
```

HTTP status: `201 Created`

# GET /api/v1/plans [Kế hoạch]

Lấy danh sách các lịch trình du lịch đã lưu của **chính người dùng đang đăng nhập**.

- **Phương thức:** `GET`
- **Quyền yêu cầu:** `USER` (Bắt buộc Bearer Access Token).
- **Cơ chế:** Backend tự động lọc theo `where: { user_id: req.user.sub }`, sắp xếp theo thời gian tạo mới nhất.

Response thành công:

```json
{
  "success": true,
  "data": [
    {
      "id": "e9b5f928-860d-4076-a0e2-6323cf106ec3",
      "title": "Chuyến đi Đà Nẵng 2 ngày cùng bạn thân",
      "city": "Da Nang",
      "totalDays": 2,
      "totalBudget": "1500000.00",
      "actualCost": "160000.00",
      "createdAt": "2026-11-12T00:00:00.000Z"
    }
  ]
}
```

HTTP status: `200 OK`

# GET /api/v1/plans/:planId [Kế hoạch]

Xem chi tiết toàn bộ dữ liệu JSON của 1 lịch trình đã lưu.

- **Phương thức:** `GET`
- **Quyền yêu cầu:** `USER` (Người sở hữu lịch trình hoặc `ADMIN`).
- **Middleware:** `verifyToken`, `validateUuidParam('planId')`, `checkOwner`.

HTTP status: `200 OK`. `403` nếu không có quyền, `404` nếu không tìm thấy.

# DELETE /api/v1/plans/:planId [Kế hoạch]

Xóa 1 lịch trình đã lưu khỏi tài khoản người dùng.

- **Phương thức:** `DELETE`
- **Quyền yêu cầu:** `USER` (Người sở hữu lịch trình hoặc `ADMIN`).
- **Middleware:** `verifyToken`, `validateUuidParam('planId')`, `checkOwner`.

HTTP status: `200 OK`

# GET /api/v1/plans/share/:shareToken [Kế hoạch]

Xem chi tiết lịch trình công khai thông qua mã token chia sẻ (không yêu cầu đăng nhập).

- **Phương thức:** `GET`
- **Quyền yêu cầu:** Public
- **Cơ chế:** Lọc theo `where: { share_token: shareToken, is_public: true }`.

HTTP status: `200 OK`. `404` nếu link không tồn tại hoặc đã bị tắt chia sẻ.

---

# 9. User Favorites [Kế hoạch]

Nhóm API quản lý các địa điểm du lịch yêu thích của người dùng đang đăng nhập.

# GET /api/v1/users/me/favorites [Kế hoạch]

Lấy danh sách các địa điểm mà người dùng hiện tại đã đánh dấu yêu thích (kèm thông tin chi tiết của địa điểm).

- **Phương thức:** `GET`
- **Quyền yêu cầu:** `USER` (Bắt buộc Bearer Access Token).
- **Database:** Bảng `user_favorites` JOIN `places`.

Response thành công:

```json
{
  "success": true,
  "data": [
    {
      "favoriteId": "6c361922-a9b8-4c8d-b7eb-d1be8b7762bb",
      "placeId": 1,
      "name": "Chợ Cồn",
      "city": "Da Nang",
      "zoneId": 1,
      "estimatedCost": 100000,
      "rating": 4.5,
      "createdAt": "2026-11-12T00:00:00.000Z"
    }
  ]
}
```

HTTP status: `200 OK`

# POST /api/v1/users/me/favorites [Kế hoạch]

Thêm một địa điểm vào danh sách yêu thích của người dùng hiện tại.

- **Phương thức:** `POST`
- **Quyền yêu cầu:** `USER` (Bắt buộc Bearer Access Token).
- **Request body:** Gửi `placeId` trong JSON body:

```json
{
  "placeId": 1
}
```

Response thành công:

```json
{
  "success": true,
  "message": "Đã thêm vào danh sách yêu thích!",
  "data": {
    "id": "6c361922-a9b8-4c8d-b7eb-d1be8b7762bb",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "placeId": 1,
    "createdAt": "2026-11-12T00:00:00.000Z"
  }
}
```

HTTP status: `201 Created`. Trả về `409 Conflict` nếu địa điểm này đã có trong danh sách yêu thích.

# DELETE /api/v1/users/me/favorites/:placeId [Kế hoạch]

Xóa một địa điểm khỏi danh sách yêu thích của người dùng hiện tại.

- **Phương thức:** `DELETE`
- **Quyền yêu cầu:** `USER` (Bắt buộc Bearer Access Token).
- **Cơ chế:** Xóa bản ghi có `user_id = req.user.sub` và `place_id = parseInt(req.params.placeId, 10)`.

Response thành công:

```json
{
  "success": true,
  "message": "Đã xóa khỏi danh sách yêu thích!"
}
```

HTTP status: `200 OK`. `404 Not Found` nếu địa điểm chưa từng được yêu thích.

---

# 10. Catalog Administration [Kế hoạch]

Quản trị toàn diện danh mục Địa điểm du lịch và Phân vùng Zone dành riêng cho Quản trị viên (`ADMIN`). 

> [!NOTE]
> Không sử dụng namespace dư thừa `/admin/`. Các route này dùng chung URL với tài nguyên gốc (`/places`, `/zones`), trong đó phương thức `GET` là công khai cho mọi người, còn các phương thức ghi (`POST`, `PATCH`, `DELETE`) được bảo vệ bằng middleware `verifyToken` + `verifyAdmin`.

# POST /api/v1/places [Kế hoạch]

Thêm mới một địa điểm du lịch vào hệ thống.

- **Phương thức:** `POST`
- **Quyền yêu cầu:** `ADMIN` (Bearer Token)
- **Request body:** Thông tin địa điểm (`name`, `city`, `zoneId`, `address`, `estimatedCost`, `duration`, `openingTime`, `closingTime`, `latitude`, `longitude`, `tags`).

HTTP status: `201 Created`

# PATCH /api/v1/places/:placeId [Kế hoạch]

Cập nhật thông tin của một địa điểm du lịch.

- **Phương thức:** `PATCH`
- **Quyền yêu cầu:** `ADMIN` (Bearer Token)

HTTP status: `200 OK`

# DELETE /api/v1/places/:placeId [Kế hoạch]

Xóa một địa điểm du lịch khỏi hệ thống.

- **Phương thức:** `DELETE`
- **Quyền yêu cầu:** `ADMIN` (Bearer Token)

HTTP status: `200 OK`

# POST /api/v1/zones [Kế hoạch]

Tạo một phân vùng địa lý mới tại thành phố du lịch.

- **Phương thức:** `POST`
- **Quyền yêu cầu:** `ADMIN` (Bearer Token)
- **Request body:** `{ "code": "Z6", "name": "Bà Nà Hills", "description": "...", "centerLat": 15.998, "centerLng": 107.996 }`

HTTP status: `201 Created`

# PATCH /api/v1/zones/:zoneId [Kế hoạch]

Cập nhật thông tin phân vùng địa lý.

- **Phương thức:** `PATCH`
- **Quyền yêu cầu:** `ADMIN` (Bearer Token)

HTTP status: `200 OK`

# DELETE /api/v1/zones/:zoneId [Kế hoạch]

Xóa phân vùng địa lý (chỉ xóa được nếu Zone không còn chứa địa điểm nào).

- **Phương thức:** `DELETE`
- **Quyền yêu cầu:** `ADMIN` (Bearer Token)

HTTP status: `200 OK`

---

# 11. RAG Knowledge Base Management [Kế hoạch]

Nhóm API quản trị các mẩu cẩm nang văn hóa, kinh nghiệm ẩm thực phục vụ tầng RAG.

# GET /api/v1/knowledge [Kế hoạch]

Truy vấn danh sách các đoạn tri thức cẩm nang (`knowledge_chunks`) theo địa điểm hoặc chuyên mục.

- **Phương thức:** `GET`
- **Quyền yêu cầu:** Public
- **Query params:** `?placeId=1&category=culinary`

HTTP status: `200 OK`

# POST /api/v1/knowledge [Kế hoạch]

Thêm mới một mẩu cẩm nang tri thức du lịch vào Database / Vector Store.

- **Phương thức:** `POST`
- **Quyền yêu cầu:** `ADMIN`
- **Request body:** `{ "placeId": 1, "title": "Mẹo đi chợ Cồn", "content": "...", "category": "culinary" }`

HTTP status: `201 Created`

# DELETE /api/v1/knowledge/:id [Kế hoạch]

Xóa một mẩu cẩm nang tri thức.

- **Phương thức:** `DELETE`
- **Quyền yêu cầu:** `ADMIN`

HTTP status: `200 OK`

---

# 12. Tổng Hợp Trạng Thái Triển Khai API

| Module | Endpoint | Method | Trạng thái kỹ thuật | Quyền hạn |
|---|---|---|:---:|---|
| **Health** | `/api/v1/health` | `GET` | ✅ **Đã hoàn thiện** | Public |
| **Auth** | `/api/v1/auth/register` | `POST` | ✅ **Đã hoàn thiện** | Public |
| **Auth** | `/api/v1/auth/login` | `POST` | ✅ **Đã hoàn thiện** | Public |
| **Auth** | `/api/v1/auth/change-password` | `PATCH` | ✅ **Đã hoàn thiện** | Logged-in User |
| **Auth** | `/api/v1/auth/refresh-token` | `POST` | ✅ **Đã hoàn thiện** | Public (Cookie) |
| **Auth** | `/api/v1/auth/logout` | `POST` | ✅ **Đã hoàn thiện** | Public (Cookie) |
| **User** | `/api/v1/users/me` | `GET` | ✅ **Đã hoàn thiện** | Logged-in User |
| **User** | `/api/v1/users/me` | `PATCH` | ✅ **Đã hoàn thiện** | Logged-in User |
| **User** | `/api/v1/users` | `GET` | ✅ **Đã hoàn thiện** | `ADMIN` |
| **User** | `/api/v1/users/:userId` | `GET` | ✅ **Đã hoàn thiện** | Owner / `ADMIN` |
| **User** | `/api/v1/users/:userId` | `PATCH` | ✅ **Đã hoàn thiện** | Owner / `ADMIN` |
| **User** | `/api/v1/users/:userId/status` | `PATCH` | ✅ **Đã hoàn thiện** | `ADMIN` |
| **Zones** | `/api/v1/zones` | `GET` | ✅ **Đã hoàn thiện** | Public |
| **Places** | `/api/v1/places` | `GET` | ✅ **Đã hoàn thiện** | Public (Filter query) |
| **Places** | `/api/v1/places/:placeId` | `GET` | ⏳ *Kế hoạch Tuần 3* | Public |
| **Tags** | `/api/v1/tags` | `GET` | ✅ **Đã hoàn thiện** | Public |
| **AI Engine** | `/api/v1/ai/generate-plan` | `POST` | ✅ **Đã hoàn thiện** | Public / Guest |
| **AI Engine** | `/api/v1/ai/swap-place` | `POST` | ✅ **Đã hoàn thiện** | Public / Guest |
| **Plans** | `/api/v1/plans` | `POST` | ⏳ *Kế hoạch Tuần 3* | Logged-in User |
| **Plans** | `/api/v1/plans` | `GET` | ⏳ *Kế hoạch Tuần 3* | Logged-in User |
| **Plans** | `/api/v1/plans/:planId` | `GET` | ⏳ *Kế hoạch Tuần 3* | Owner / `ADMIN` |
| **Plans** | `/api/v1/plans/:planId` | `DELETE` | ⏳ *Kế hoạch Tuần 3* | Owner / `ADMIN` |
| **Plans** | `/api/v1/plans/share/:shareToken` | `GET` | ⏳ *Kế hoạch Tuần 4* | Public |
| **Favorites**| `/api/v1/users/me/favorites` | `GET` | ⏳ *Kế hoạch Tuần 4* | Logged-in User |
| **Favorites**| `/api/v1/users/me/favorites` | `POST` | ⏳ *Kế hoạch Tuần 4* | Logged-in User |
| **Favorites**| `/api/v1/users/me/favorites/:placeId` | `DELETE` | ⏳ *Kế hoạch Tuần 4* | Logged-in User |
| **Admin** | `/api/v1/places` | `POST` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| **Admin** | `/api/v1/places/:placeId` | `PATCH` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| **Admin** | `/api/v1/places/:placeId` | `DELETE` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| **Admin** | `/api/v1/zones` | `POST` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| **Admin** | `/api/v1/zones/:zoneId` | `PATCH` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| **Admin** | `/api/v1/zones/:zoneId` | `DELETE` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| **RAG** | `/api/v1/knowledge` | `GET` | ⏳ *Kế hoạch Tuần 4* | Public |
| **RAG** | `/api/v1/knowledge` | `POST` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
| **RAG** | `/api/v1/knowledge/:id` | `DELETE` | ⏳ *Kế hoạch Tuần 4* | `ADMIN` |
