/**
 * GeoZone AI - Unified API Service Layer
 * Fully mapped to backend contracts documented in API_DOCUMENTATION.md
 */

import {
  CITIES,
  TAGS,
  PLACES_BY_CITY,
  MOCK_SAVED_PLANS,
  MOCK_SAMPLE_FAVORITES,
  getCityZones
} from '../data/mockData';

const API_BASE = '/api/v1';

// Token & User LocalStorage Helpers
export const getToken = () => localStorage.getItem('geozone_token');
export const setToken = (token) => localStorage.setItem('geozone_token', token);
export const removeToken = () => localStorage.removeItem('geozone_token');

export const getRefreshToken = () => localStorage.getItem('geozone_refresh_token');
export const setRefreshToken = (token) => localStorage.setItem('geozone_refresh_token', token);
export const removeRefreshToken = () => localStorage.removeItem('geozone_refresh_token');

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('geozone_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const setStoredUser = (user) => localStorage.setItem('geozone_user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('geozone_user');

// Helper gắn token vào Authorization Header
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Helper xử lý fetch có fallback mock an toàn khi Backend chưa chạy
async function safeFetch(url, options = {}, mockFallback = null) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let errData = {};
      try {
        errData = await res.json();
      } catch {
        // Response không phải JSON
      }
      throw new Error(errData.error?.message || errData.message || `Lỗi HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    if (mockFallback !== null && (err.name === 'TypeError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      console.warn(`[GeoZone API] Backend chưa khả dụng (${url}), sử dụng dữ liệu cục bộ giả lập.`, err.message);
      await new Promise((r) => setTimeout(r, 250)); // Simulating network latency
      return typeof mockFallback === 'function' ? mockFallback() : mockFallback;
    }
    throw err;
  }
}

/* ==========================================================================
   1. AUTHENTICATION & PROFILE APIS (API_DOCUMENTATION.md #2 & #3)
   ========================================================================== */

/**
 * Đăng ký tài khoản mới (POST /api/v1/auth/register)
 * Body: { email, password, name }
 */
export async function registerApi({ username, email, password, name }) {
  const targetEmail = String(email || username || '').trim().toLowerCase();
  const targetName = String(name || username || targetEmail.split('@')[0]).trim();

  try {
    const data = await safeFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        password: String(password || ''),
        name: targetName
      })
    });

    // Sau khi đăng ký thành công, tự động gọi login để lấy accessToken và đồng bộ phiên
    try {
      const loggedUser = await loginApi({ email: targetEmail, password });
      return loggedUser;
    } catch {
      const rawUser = data.user || {};
      const userObj = {
        id: rawUser.id,
        name: rawUser.name || targetName,
        email: rawUser.email || targetEmail,
        role: (rawUser.role || 'USER').toLowerCase()
      };
      setStoredUser(userObj);
      return userObj;
    }
  } catch (err) {
    // Mock fallback nếu backend offline
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      const mockUser = {
        name: targetName,
        email: targetEmail,
        role: 'user'
      };
      setToken('mock_jwt_token_' + Date.now());
      setStoredUser(mockUser);
      return mockUser;
    }
    throw err;
  }
}

/**
 * Đăng nhập tài khoản (POST /api/v1/auth/login)
 * Body: { email, password }
 */
export async function loginApi({ username, email, password }) {
  let targetEmail = String(email || username || '').trim();

  // Tự động nhận diện shortcut tiện ích
  if (targetEmail.toLowerCase() === 'admin') {
    targetEmail = 'admin@geozone.vn';
  } else if (targetEmail.toLowerCase() === 'user' || targetEmail.toLowerCase() === 'demo') {
    targetEmail = 'demo@geozone.vn';
  } else if (targetEmail.toLowerCase() === 'hieuct26.py') {
    targetEmail = 'hieuct26.py@gmail.com';
  }

  try {
    const data = await safeFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        password: String(password || '')
      })
    });

    // Backend trả về accessToken (JWT 15m)
    const token = data.accessToken || data.token;
    if (token) setToken(token);
    if (data.refreshToken) setRefreshToken(data.refreshToken);

    const rawUser = data.user || {};
    const userObj = {
      id: rawUser.id,
      name: rawUser.name || (rawUser.email ? rawUser.email.split('@')[0] : targetEmail),
      email: rawUser.email || targetEmail,
      role: (rawUser.role || 'USER').toLowerCase(),
      avatar_url: rawUser.avatar_url
    };
    setStoredUser(userObj);
    return userObj;
  } catch (err) {
    // Mock fallback khi backend chưa chạy
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      const mockUser = {
        name: targetEmail.includes('admin') ? 'Quản trị viên GeoZone' : (targetEmail.split('@')[0] || 'Người dùng'),
        email: targetEmail.includes('@') ? targetEmail : `${targetEmail}@geozone.vn`,
        role: targetEmail.includes('admin') ? 'admin' : 'user'
      };
      setToken('mock_jwt_token_' + Date.now());
      setStoredUser(mockUser);
      return mockUser;
    }
    throw err;
  }
}

/**
 * Lấy thông tin người dùng hiện tại (GET /api/v1/users/me)
 */
export async function getMeApi() {
  const data = await safeFetch(
    `${API_BASE}/users/me`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    },
    () => getStoredUser()
  );

  if (data) {
    if (data.role) data.role = String(data.role).toLowerCase();
    const cur = getStoredUser() || {};
    setStoredUser({ ...cur, ...data });
  }
  return data;
}

/**
 * Cập nhật thông tin tài khoản (PATCH /api/v1/users/me)
 * Body: { name, avatar_url }
 */
export async function updateProfileApi({ name, avatarUrl }) {
  const data = await safeFetch(
    `${API_BASE}/users/me`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, avatar_url: avatarUrl })
    },
    () => {
      const cur = getStoredUser() || {};
      const updated = { ...cur, name: name || cur.name };
      setStoredUser(updated);
      return updated;
    }
  );
  return data;
}

/**
 * Đổi mật khẩu (PATCH /api/v1/auth/change-password)
 * Body: { currentPassword, newPassword }
 */
export async function changePasswordApi({ oldPassword, newPassword }) {
  return safeFetch(
    `${API_BASE}/auth/change-password`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword: oldPassword, newPassword })
    },
    () => ({ message: 'Đổi mật khẩu thành công (Mock)' })
  );
}

/**
 * Đăng xuất tài khoản (POST /api/v1/auth/logout)
 */
export async function logoutApi() {
  const rt = getRefreshToken();
  try {
    if (rt) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ refreshToken: rt })
      });
    }
  } catch {
    // Bỏ qua lỗi mạng khi logout
  } finally {
    removeToken();
    removeRefreshToken();
    removeStoredUser();
  }
}

/* ==========================================================================
   2. CATALOG APIS: ZONES, PLACES, TAGS (API_DOCUMENTATION.md #5 & #6)
   ========================================================================== */

/**
 * Lấy danh sách khu vực (GET /api/v1/zones?city=...)
 */
export async function getZonesApi(cityKey) {
  const query = cityKey ? `?city=${encodeURIComponent(CITIES[cityKey]?.api || cityKey)}` : '';
  return safeFetch(
    `${API_BASE}/zones${query}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    () => getCityZones(cityKey || 'hue')
  );
}

/**
 * Lấy danh sách địa điểm theo bộ lọc (GET /api/v1/places)
 */
export async function getPlacesApi(params = {}) {
  const q = new URLSearchParams(params).toString();
  const url = q ? `${API_BASE}/places?${q}` : `${API_BASE}/places`;
  return safeFetch(
    url,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    () => PLACES_BY_CITY[params.city || 'hue'] || []
  );
}

/**
 * Lấy danh mục taxonomy tags (GET /api/v1/tags)
 */
export async function getTagsApi() {
  return safeFetch(
    `${API_BASE}/tags`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    () => TAGS
  );
}

/* ==========================================================================
   3. AI TRAVEL ENGINE: GENERATE & DYNAMIC SWAP (API_DOCUMENTATION.md #7)
   ========================================================================== */

/**
 * Sinh lịch trình tự động (POST /api/v1/ai/generate-plan)
 * Body: { city, days, budget, tags }
 */
export async function generateItineraryApi(payload) {
  return safeFetch(
    `${API_BASE}/ai/generate-plan`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    },
    () => {
      // Mock AI Partition Algorithm
      const cityKey = payload.city || 'hue';
      const cityConfig = CITIES[cityKey] || CITIES.hue;
      const allCityPlaces = PLACES_BY_CITY[cityKey] || [];
      const daysCount = parseInt(payload.days || 2, 10);
      const placesToPick = allCityPlaces.slice(0, daysCount * 3);

      const days = [];
      for (let d = 1; d <= daysCount; d++) {
        const slice = placesToPick.slice((d - 1) * 3, d * 3);
        days.push({
          dayNumber: d,
          title: slice[0] ? slice[0].zoneName : `Khám phá khu vực ngày ${d}`,
          totalCost: slice.reduce((sum, p) => sum + (p.estimatedCost || 0), 0),
          places: slice.map((p, idx) => ({
            ...p,
            time: `${8 + idx * 3}:00 - ${10 + idx * 3}:30`
          }))
        });
      }

      return {
        name: `Lịch trình du lịch ${cityConfig.name} ${daysCount} ngày`,
        city: cityKey,
        cityName: cityConfig.name,
        daysCount,
        totalCost: days.reduce((sum, d) => sum + d.totalCost, 0),
        days
      };
    }
  );
}

/**
 * Hoán đổi địa điểm thông minh (POST /api/v1/ai/swap-place)
 * Body: { currentPlaceId, zoneId, dayNumber, itinerary }
 */
export async function swapPlaceApi(payload) {
  return safeFetch(
    `${API_BASE}/ai/swap-place`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    },
    () => {
      // Local smart alternative: chọn địa điểm khác trong cùng zone
      const cityKey = payload.city || 'hue';
      const allCityPlaces = PLACES_BY_CITY[cityKey] || [];
      const alternatives = allCityPlaces.filter(
        (p) => p.id !== payload.currentPlaceId && (p.zoneCode === payload.zoneCode || !payload.zoneCode)
      );
      const replacement = alternatives[Math.floor(Math.random() * alternatives.length)] || allCityPlaces[0];
      return {
        replacementPlace: replacement,
        message: 'Hoán đổi thành công (Mock AI)'
      };
    }
  );
}

/* ==========================================================================
   4. SAVED ITINERARIES APIS (API_DOCUMENTATION.md #8)
   ========================================================================== */

/**
 * Lưu lịch trình chính thức vào saved_plans (POST /api/v1/plans)
 */
export async function savePlanApi(planPayload) {
  return safeFetch(
    `${API_BASE}/plans`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(planPayload)
    },
    () => {
      const newPlan = {
        ...planPayload,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        shareToken: `gz-${Math.random().toString(36).substring(2, 9)}`
      };
      return newPlan;
    }
  );
}

/**
 * Lấy danh sách lịch trình đã lưu của người dùng (GET /api/v1/plans)
 */
export async function getMyPlansApi() {
  return safeFetch(
    `${API_BASE}/plans`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    },
    () => MOCK_SAVED_PLANS
  );
}

/**
 * Xem chi tiết 1 lịch trình đã lưu (GET /api/v1/plans/:planId)
 */
export async function getPlanByIdApi(planId) {
  return safeFetch(
    `${API_BASE}/plans/${planId}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    },
    () => MOCK_SAVED_PLANS.find((p) => p.id === planId) || MOCK_SAVED_PLANS[0]
  );
}

/**
 * Xóa lịch trình đã lưu (DELETE /api/v1/plans/:planId)
 */
export async function deletePlanApi(planId) {
  return safeFetch(
    `${API_BASE}/plans/${planId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    },
    () => ({ success: true, message: 'Đã xóa lịch trình' })
  );
}

/**
 * Xem lịch trình công khai qua liên kết chia sẻ (GET /api/v1/plans/share/:shareToken)
 */
export async function getSharedPlanApi(shareToken) {
  return safeFetch(
    `${API_BASE}/plans/share/${shareToken}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    },
    () => MOCK_SAVED_PLANS.find((p) => p.shareToken === shareToken) || MOCK_SAVED_PLANS[0]
  );
}

/* ==========================================================================
   5. FAVORITES APIS (API_DOCUMENTATION.md #9)
   ========================================================================== */

/**
 * Lấy danh sách địa điểm yêu thích (GET /api/v1/users/me/favorites)
 */
export async function getMyFavoritesApi() {
  return safeFetch(
    `${API_BASE}/users/me/favorites`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    },
    () => MOCK_SAMPLE_FAVORITES
  );
}

/**
 * Thêm địa điểm vào danh sách yêu thích (POST /api/v1/users/me/favorites)
 * Body: { placeId: 1 }
 */
export async function addFavoriteApi(placeId) {
  return safeFetch(
    `${API_BASE}/users/me/favorites`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ placeId })
    },
    () => ({ placeId, success: true })
  );
}

/**
 * Xóa địa điểm khỏi danh sách yêu thích (DELETE /api/v1/users/me/favorites/:placeId)
 */
export async function removeFavoriteApi(placeId) {
  return safeFetch(
    `${API_BASE}/users/me/favorites/${placeId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    },
    () => ({ success: true })
  );
}

/* ==========================================================================
   6. ADMIN CATALOG CRUD APIS (API_DOCUMENTATION.md #10)
   ========================================================================== */

/**
 * Admin: Tạo địa điểm mới (POST /api/v1/places)
 */
export async function adminCreatePlaceApi(placeData) {
  return safeFetch(
    `${API_BASE}/places`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(placeData)
    },
    () => ({ ...placeData, id: Date.now() })
  );
}

/**
 * Admin: Cập nhật địa điểm (PATCH /api/v1/places/:placeId)
 */
export async function adminUpdatePlaceApi(placeId, placeData) {
  return safeFetch(
    `${API_BASE}/places/${placeId}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(placeData)
    },
    () => ({ ...placeData, id: placeId })
  );
}

/**
 * Admin: Xóa địa điểm (DELETE /api/v1/places/:placeId)
 */
export async function adminDeletePlaceApi(placeId) {
  return safeFetch(
    `${API_BASE}/places/${placeId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    },
    () => ({ success: true })
  );
}

/**
 * Admin: Tạo khu vực mới (POST /api/v1/zones)
 */
export async function adminCreateZoneApi(zoneData) {
  return safeFetch(
    `${API_BASE}/zones`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(zoneData)
    },
    () => ({ ...zoneData, id: Date.now() })
  );
}

/**
 * Admin: Cập nhật khu vực (PATCH /api/v1/zones/:zoneId)
 */
export async function adminUpdateZoneApi(zoneId, zoneData) {
  return safeFetch(
    `${API_BASE}/zones/${zoneId}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(zoneData)
    },
    () => ({ ...zoneData, id: zoneId })
  );
}

/**
 * Admin: Xóa khu vực (DELETE /api/v1/zones/:zoneId)
 */
export async function adminDeleteZoneApi(zoneId) {
  return safeFetch(
    `${API_BASE}/zones/${zoneId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders()
    },
    () => ({ success: true })
  );
}

/* ==========================================================================
   7. TÍNH NĂNG FRONTEND CHƯA CÓ TRÊN BACKEND (Báo lỗi để sau này bổ sung)
   ========================================================================== */

/**
 * Xóa tài khoản vĩnh viễn (Chưa có API Backend: Hiện backend chỉ có PATCH /users/:id/status của Admin)
 */
export async function deleteAccountApi() {
  throw new Error(
    'Tính năng Xóa tài khoản chưa được hỗ trợ bởi Backend API. Hiện tại hệ thống chỉ cho phép Quản trị viên khóa/mở tài khoản.'
  );
}

/**
 * Xuất dữ liệu JSON danh mục (Chưa có API Backend: Tính năng Admin Export)
 */
export async function exportDataApi() {
  throw new Error('Tính năng Xuất dữ liệu JSON chưa có API Backend tương ứng.');
}

/**
 * Đặt lại CSDL ban đầu (Chưa có API Backend)
 */
export async function resetDatabaseApi() {
  throw new Error('Tính năng Khôi phục mặc định CSDL chưa có API Backend tương ứng.');
}

/**
 * Khôi phục 1 địa điểm về nguyên bản gốc (Chưa có API Backend)
 */
export async function revertPlaceApi(placeId) {
  throw new Error(`Tính năng Khôi phục địa điểm #${placeId} về bản gốc chưa có API Backend tương ứng.`);
}
