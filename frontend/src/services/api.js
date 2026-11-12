const API_BASE = '/api/v1';

// Token & User LocalStorage Helpers
export const getToken = () => localStorage.getItem('geozone_token');
export const setToken = (token) => localStorage.setItem('geozone_token', token);
export const removeToken = () => localStorage.removeItem('geozone_token');

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

// Helper gắn token vào headers
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/* ================= AUTH APIS ================= */

/**
 * Đăng ký tài khoản
 */
export async function registerApi({ email, password, name }) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Đăng ký thất bại');
  }

  setToken(json.data.token);
  setStoredUser(json.data.user);
  return json.data;
}

/**
 * Đăng nhập
 */
export async function loginApi({ email, password }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Đăng nhập thất bại');
  }

  setToken(json.data.token);
  setStoredUser(json.data.user);
  return json.data;
}

/**
 * Lấy thông tin user hiện tại (chuẩn RESTful /users/me)
 */
export async function getMeApi() {
  const response = await fetch(`${API_BASE}/users/me`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const json = await response.json();
  if (!json.success) {
    removeToken();
    removeStoredUser();
    throw new Error(json.error?.message || json.message || 'Phiên đăng nhập hết hạn');
  }

  setStoredUser(json.data);
  return json.data;
}

export function logout() {
  removeToken();
  removeStoredUser();
}

/* ================= CATALOG APIS (ZONES, PLACES, TAGS) ================= */

/**
 * Lấy danh sách 5 phân vùng địa lý
 */
export async function getZonesApi() {
  const response = await fetch(`${API_BASE}/zones`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const json = await response.json();
  if (!json.success) throw new Error('Không thể tải danh sách khu vực');
  return json.data;
}

/**
 * Tìm kiếm và lọc danh sách địa điểm
 */
export async function getPlacesApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_BASE}/places?${query}` : `${API_BASE}/places`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const json = await response.json();
  if (!json.success) throw new Error('Không thể tải danh sách địa điểm');
  return json.data;
}

/**
 * Lấy danh mục 7 tags sở thích
 */
export async function getTagsApi() {
  const response = await fetch(`${API_BASE}/tags`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const json = await response.json();
  if (!json.success) throw new Error('Không thể tải danh mục tags');
  return json.data;
}

/* ================= AI PLANNER & DYNAMIC SWAP APIS ================= */

/**
 * Gọi API sinh lịch trình tự động (AI Travel Engine)
 */
export async function generateItineraryApi(payload) {
  const response = await fetch(`${API_BASE}/ai/generate-plan`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể tạo lịch trình');
  }

  return json.data;
}

/**
 * Gọi API hoán đổi địa điểm (Dynamic Swap Engine)
 */
export async function swapPlaceApi(payload) {
  const response = await fetch(`${API_BASE}/ai/swap-place`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'Không thể hoán đổi địa điểm');
  }

  return json.data;
}

/* ================= ITINERARIES MANAGEMENT APIS (/plans) ================= */

/**
 * Lưu lịch trình vào tài khoản người dùng (POST /api/v1/plans)
 */
export async function savePlanApi(payload) {
  const response = await fetch(`${API_BASE}/plans`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể lưu lịch trình');
  }

  return json.data;
}

/**
 * Lấy danh sách lịch trình đã lưu của người dùng hiện tại (GET /api/v1/plans)
 */
export async function getMyPlansApi() {
  const response = await fetch(`${API_BASE}/plans`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể lấy danh sách lịch trình');
  }

  return json.data;
}

/**
 * Xem chi tiết 1 lịch trình đã lưu (GET /api/v1/plans/:id)
 */
export async function getPlanByIdApi(id) {
  const response = await fetch(`${API_BASE}/plans/${id}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể tải chi tiết lịch trình');
  }

  return json.data;
}

/**
 * Xóa 1 lịch trình đã lưu (DELETE /api/v1/plans/:id)
 */
export async function deletePlanApi(id) {
  const response = await fetch(`${API_BASE}/plans/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể xóa lịch trình');
  }

  return json;
}

/* ================= USER FAVORITES APIS (/users/me/favorites) ================= */

/**
 * Lấy danh sách địa điểm yêu thích của user hiện tại
 */
export async function getMyFavoritesApi() {
  const response = await fetch(`${API_BASE}/users/me/favorites`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  const json = await response.json();
  if (!json.success) throw new Error('Không thể tải danh sách yêu thích');
  return json.data;
}

/**
 * Thêm một địa điểm vào danh sách yêu thích
 */
export async function addFavoriteApi(placeId) {
  const response = await fetch(`${API_BASE}/users/me/favorites`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ placeId })
  });
  const json = await response.json();
  if (!json.success) throw new Error(json.message || 'Không thể thêm yêu thích');
  return json.data;
}

/**
 * Xóa địa điểm khỏi danh sách yêu thích
 */
export async function removeFavoriteApi(placeId) {
  const response = await fetch(`${API_BASE}/users/me/favorites/${placeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const json = await response.json();
  if (!json.success) throw new Error(json.message || 'Không thể xóa yêu thích');
  return json;
}
