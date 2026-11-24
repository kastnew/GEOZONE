/**
 * GeoZone AI - Unified API Service Layer
 * Fully mapped to backend contracts documented in API_DOCUMENTATION.md
 */

import {
  CITIES,
  TAGS,
  PLACES_BY_CITY,
  getCityZones
} from '../data/mockData';

const API_BASE = '/api/v1';
export const AUTH_INVALIDATED_EVENT = 'geozone:auth-invalidated';
export const AUTH_EXPIRED_EVENT = 'geozone:auth-expired';
const AUTH_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';

let refreshPromise = null;
let authExpiredEventDispatched = false;

function getCityKey(cityValue) {
  const cityName = String(cityValue || '').trim().toLocaleLowerCase();
  const match = Object.entries(CITIES).find(([key, city]) =>
    [key, city.name, city.api].some((value) => String(value).toLocaleLowerCase() === cityName)
  );
  return match ? match[0] : cityValue;
}

function normalizeSavedPlan(plan) {
  const cityKey = getCityKey(plan.city);
  const cityConfig = CITIES[cityKey];
  return {
    ...plan,
    name: plan.name || plan.title,
    city: cityKey,
    cityName: plan.cityName || cityConfig?.name || plan.city,
    daysCount: Number(plan.daysCount ?? plan.total_days ?? plan.totalDays ?? 0),
    totalCost: Number(plan.totalCost ?? plan.actual_cost ?? plan.actualCost ?? plan.total_budget ?? 0),
    createdAt: plan.createdAt || plan.created_at,
    shareToken: plan.shareToken || plan.share_token
  };
}

// Token & User LocalStorage Helpers
export const getToken = () => localStorage.getItem('geozone_token');
export const setToken = (token) => {
  authExpiredEventDispatched = false;
  localStorage.setItem('geozone_token', token);
};
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

function handleInactiveAccount(response, payload) {
  const message = String(payload?.error?.message || payload?.message || '');
  if (response.status !== 403 || !message.toLocaleLowerCase().includes('vô hiệu hóa')) return;

  removeToken();
  removeRefreshToken();
  removeStoredUser();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_INVALIDATED_EVENT, { detail: { message } }));
  }
}

function expireAuthSession() {
  removeToken();
  removeRefreshToken();
  removeStoredUser();
  if (typeof window !== 'undefined' && !authExpiredEventDispatched) {
    authExpiredEventDispatched = true;
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

function isAuthEndpoint(url) {
  const path = String(url).split('?')[0].replace(/\/+$/, '');
  return ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/logout']
    .some((endpoint) => path.endsWith(endpoint));
}

function getAuthorizationToken(options) {
  const value = new Headers(options.headers || {}).get('Authorization') || '';
  return value.replace(/^Bearer\s+/i, '');
}

async function requestNewAccessToken() {
  const response = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: 'POST',
    credentials: 'include'
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    if (response.ok) throw new Error('Backend trả về dữ liệu làm mới phiên không hợp lệ.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      expireAuthSession();
      throw new Error(AUTH_EXPIRED_MESSAGE);
    }
    throw new Error(payload.error?.message || payload.message || `Lỗi HTTP ${response.status}`);
  }

  if (!payload.accessToken) {
    throw new Error('Backend không trả về access token mới.');
  }

  setToken(payload.accessToken);
  return payload.accessToken;
}

async function getNewAccessTokenSingleFlight() {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken();
  }

  const currentPromise = refreshPromise;
  try {
    return await currentPromise;
  } finally {
    if (refreshPromise === currentPromise) refreshPromise = null;
  }
}

async function fetchWithAuthRetry(url, options = {}, retried = false) {
  const requestOptions = { ...options, credentials: 'include' };
  const response = await fetch(url, requestOptions);
  if (response.status !== 401 || isAuthEndpoint(url) || !getAuthorizationToken(options)) {
    return response;
  }

  if (retried) {
    expireAuthSession();
    throw new Error(AUTH_EXPIRED_MESSAGE);
  }

  const requestToken = getAuthorizationToken(options);
  const currentToken = getToken();
  if (!currentToken) return response;

  const accessToken = requestToken !== currentToken
    ? currentToken
    : await getNewAccessTokenSingleFlight();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);

  return fetchWithAuthRetry(url, { ...options, headers }, true);
}

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
    const res = await fetchWithAuthRetry(url, options);
    if (!res.ok) {
      let errData = {};
      try {
        errData = await res.json();
      } catch {
        // Response không phải JSON
      }
      handleInactiveAccount(res, errData);
      throw new Error(errData.error?.message || errData.message || `Lỗi HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    const isNetworkError = err.name === 'TypeError'
      || /Failed to fetch|NetworkError/i.test(err.message || '');
    if (mockFallback !== null && !getAuthorizationToken(options) && !isAuthEndpoint(url) && isNetworkError) {
      console.warn(`[GeoZone API] Backend chưa khả dụng (${url}), sử dụng dữ liệu cục bộ giả lập.`, err.message);
      await new Promise((r) => setTimeout(r, 250)); // Simulating network latency
      return typeof mockFallback === 'function' ? mockFallback() : mockFallback;
    }
    throw err;
  }
}

async function safeFetchEnvelope(url, options = {}) {
  const res = await fetchWithAuthRetry(url, options);
  let json = {};
  try {
    json = await res.json();
  } catch {
    if (res.ok) throw new Error('Backend trả về dữ liệu không hợp lệ.');
  }
  if (!res.ok) {
    handleInactiveAccount(res, json);
    throw new Error(json.error?.message || json.message || `Lỗi HTTP ${res.status}`);
  }
  return json;
}

/* ==========================================================================
   1. AUTHENTICATION & PROFILE APIS (API_DOCUMENTATION.md #2 & #3)
   ========================================================================== */

export async function getAdminUsersApi({
  page = 1,
  limit = 10,
  search = '',
  is_active,
  role
} = {}) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });
  if (search.trim()) query.set('search', search.trim());
  if (is_active !== undefined && is_active !== null) {
    query.set('is_active', String(is_active));
    query.set('status', is_active ? 'active' : 'inactive');
  }
  if (role) query.set('role', String(role).toUpperCase());

  const response = await safeFetchEnvelope(`${API_BASE}/users?${query}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const pagination = response.pagination || response.meta || {};
  return {
    users: Array.isArray(response.data) ? response.data : [],
    pagination: {
      page: Number(pagination.page) || page,
      limit: Number(pagination.limit) || limit,
      total: Number(pagination.total) || 0,
      totalPages: Number(pagination.totalPages) || 0
    }
  };
}

export async function getAdminUserApi(userId) {
  return safeFetch(`${API_BASE}/users/${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
}

export async function updateAdminUserApi(userId, { name, role, is_active }) {
  return safeFetch(`${API_BASE}/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, role, is_active })
  });
}

export async function setAdminUserStatusApi(userId, is_active) {
  return safeFetch(`${API_BASE}/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active })
  });
}

export async function getAdminHealthApi() {
  return safeFetch(`${API_BASE}/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function getAdminPlacesApi(params = {}) {
  const query = new URLSearchParams(params);
  return safeFetch(`${API_BASE}/places?${query}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function getAdminZonesApi() {
  return safeFetch(`${API_BASE}/zones`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function getAdminTagsApi() {
  return safeFetch(`${API_BASE}/tags`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Đăng ký tài khoản mới (POST /api/v1/auth/register)
 * Body: { email, password, name }
 */
export async function registerApi({ username, email, password, name }) {
  const targetEmail = String(email || username || '').trim().toLowerCase();
  const targetName = String(name || username || targetEmail.split('@')[0]).trim();

  try {
    await safeFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        password: String(password || ''),
        name: targetName
      })
    });

    return await loginApi({ email: targetEmail, password });
  } catch (err) {
    if (err.name === 'TypeError' || /Failed to fetch|NetworkError/i.test(err.message || '')) {
      throw new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
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
    if (!token) throw new Error('Backend không trả về access token.');
    setToken(token);
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
    if (err.name === 'TypeError' || /Failed to fetch|NetworkError/i.test(err.message || '')) {
      throw new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
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
    }
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
  try {
    await fetchWithAuthRetry(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
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
  return safeFetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
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
 * Gửi skipAi: true để chạy trực tiếp bằng thuật toán Planner (chưa cần gọi LLM AI)
 * Body: { city, days, budget, tags }
 */
export async function generateItineraryApi(payload) {
  const cityKey = payload.city || 'hue';
  const cityConfig = CITIES[cityKey] || CITIES.hue;

  const backendBody = {
    city: cityConfig.api || cityKey,
    days: Number(payload.days) || 2,
    totalBudget: Number(payload.budget ?? payload.totalBudget) || 1500000,
    preferences: payload.tags || payload.preferences || [],
    skipAi: true
  };

  const rawResult = await safeFetch(
    `${API_BASE}/ai/generate-plan`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendBody)
    },
    () => {
      // Fallback khi backend chưa chạy
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

  // Chuẩn hóa dữ liệu trả về từ Backend Planner sang định dạng hiển thị của Frontend
  const normalizedDays = (rawResult.days || []).map((day) => {
    const rawItems = day.activities || day.places || [];
    return {
      ...day,
      totalCost: day.totalEstimatedCost ?? day.totalCost ?? 0,
      places: rawItems.map((act) => ({
        ...act,
        id: act.placeId ?? act.id,
        name: act.placeName ?? act.name,
        time: act.timeSlot ?? act.time
      }))
    };
  });

  return {
    ...rawResult,
    name: rawResult.name || `Lịch trình du lịch ${cityConfig.name} ${rawResult.totalDays || normalizedDays.length} ngày`,
    city: cityKey,
    cityName: cityConfig.name,
    daysCount: rawResult.totalDays || normalizedDays.length,
    totalCost: rawResult.actualCost ?? rawResult.totalCost ?? 0,
    days: normalizedDays
  };
}

/**
 * Hoán đổi địa điểm thông minh (POST /api/v1/ai/swap-place)
 * Body: { currentPlaceId, zoneId, dayNumber, itinerary }
 */
export async function swapPlaceApi(payload) {
  const cityKey = getCityKey(payload.city || 'hue');
  const cityConfig = CITIES[cityKey] || CITIES.hue;
  const backendPayload = {
    ...payload,
    city: cityConfig.api || payload.city,
    zoneCode: payload.zoneDbCode || payload.zoneCode
  };

  return safeFetch(
    `${API_BASE}/ai/swap-place`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendPayload)
    },
    () => {
      // Local smart alternative: chọn địa điểm khác trong cùng zone
      const localCityKey = getCityKey(payload.city || 'hue');
      const allCityPlaces = PLACES_BY_CITY[localCityKey] || [];
      const localZoneCode = String(payload.zoneCode || '').replace(/^(?:HUE|NINHBINH)-/i, '');
      const alternatives = allCityPlaces.filter(
        (p) => p.id !== payload.currentPlaceId && (p.zoneCode === localZoneCode || !localZoneCode)
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
  if (!planPayload || typeof planPayload !== 'object' || Array.isArray(planPayload)) {
    throw new Error('Dữ liệu lịch trình (planData) không được để trống');
  }

  const hasPlanData = Object.prototype.hasOwnProperty.call(planPayload, 'planData');
  const hasSnakePlanData = Object.prototype.hasOwnProperty.call(planPayload, 'plan_data');
  const planData = hasPlanData
    ? planPayload.planData
    : hasSnakePlanData
      ? planPayload.plan_data
      : planPayload;
  if (!planData || typeof planData !== 'object' || Array.isArray(planData)) {
    throw new Error('Dữ liệu lịch trình (planData) không được để trống');
  }

  const planTitle = planPayload.title || planPayload.planTitle || planPayload.name
    || planData.title || planData.name;
  const days = Array.isArray(planData.days) ? planData.days : [];
  const cityValue = planPayload.city ?? planData.city;
  const city = CITIES[cityValue]?.api || cityValue || 'Da Nang';
  const totalDays = planPayload.totalDays
    ?? planPayload.total_days
    ?? planData.totalDays
    ?? planData.total_days
    ?? planData.daysCount
    ?? (days.length || 2);
  const totalBudget = planPayload.totalBudget
    ?? planPayload.total_budget
    ?? planData.totalBudget
    ?? planData.total_budget
    ?? planData.budget
    ?? 0;
  const actualCost = planPayload.actualCost
    ?? planPayload.actual_cost
    ?? planData.actualCost
    ?? planData.actual_cost
    ?? planData.totalCost
    ?? planPayload.totalCost
    ?? days.reduce((sum, day) => sum + Number(day.totalCost ?? day.totalEstimatedCost ?? 0), 0);
  const requestPayload = {
    title: planTitle,
    city,
    totalDays,
    totalBudget,
    actualCost,
    strategyUsed: planPayload.strategyUsed
      || planPayload.strategy_used
      || planData.strategyUsed
      || planData.strategy_used
      || 'DIRECT_JSON',
    status: planPayload.status,
    is_public: planPayload.is_public ?? planPayload.isPublic ?? false,
    shareToken: planPayload.shareToken ?? planPayload.share_token,
    planData
  };

  const savedPlan = await safeFetch(
    `${API_BASE}/plans`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestPayload)
    }
  );
  return savedPlan && typeof savedPlan === 'object' ? normalizeSavedPlan(savedPlan) : savedPlan;
}

/**
 * Lấy danh sách lịch trình đã lưu của người dùng (GET /api/v1/plans)
 */
export async function getMyPlansApi() {
  const plans = await safeFetch(
    `${API_BASE}/plans`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );
  return Array.isArray(plans) ? plans.map(normalizeSavedPlan) : [];
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
    }
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
    }
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
    }
  );
}

/* ==========================================================================
   5. FAVORITES APIS (API_DOCUMENTATION.md #9)
   ========================================================================== */

/**
 * Lấy danh sách địa điểm yêu thích (GET /api/v1/users/me/favorites)
 */
export async function getMyFavoritesApi() {
  const favorites = await safeFetch(
    `${API_BASE}/users/me/favorites`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );
  return Array.isArray(favorites)
    ? favorites.map((favorite) => {
        const place = favorite.place || {};
        const city = place.city ?? favorite.city;
        const tags = Array.isArray(place.tags)
          ? place.tags
          : (place.placeTags || [])
              .map((placeTag) => placeTag.tag?.name || placeTag.tag?.code)
              .filter(Boolean);

        return {
          ...place,
          id: place.id ?? favorite.place_id,
          favoriteId: favorite.id,
          city: getCityKey(city),
          zoneName: place.zoneName || place.zone?.name,
          estimatedCost: Number(
            place.estimatedCost ?? place.estimated_cost ?? place.cost ?? 0
          ),
          tags
        };
      })
    : [];
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
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
