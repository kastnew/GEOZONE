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
 * Lấy thông tin user hiện tại
 */
export async function getMeApi() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const json = await response.json();
  if (!json.success) {
    removeToken();
    removeStoredUser();
    throw new Error(json.error?.message || 'Phiên đăng nhập hết hạn');
  }

  setStoredUser(json.data);
  return json.data;
}

export function logout() {
  removeToken();
  removeStoredUser();
}

/* ================= PLANNER APIS ================= */

/**
 * Gọi API sinh lịch trình tự động
 */
export async function generateItineraryApi(payload) {
  const response = await fetch(`${API_BASE}/plans/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Không thể tạo lịch trình');
  }

  return json.data;
}

/**
 * Gọi API hoán đổi địa điểm (Dynamic Swap)
 */
export async function swapPlaceApi(payload) {
  const response = await fetch(`${API_BASE}/plans/swap`, {
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

/* ================= SAVED PLANS APIS ================= */

/**
 * Lưu lịch trình vào tài khoản
 */
export async function savePlanApi(payload) {
  const response = await fetch(`${API_BASE}/plans/save`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Không thể lưu lịch trình');
  }

  return json.data;
}

/**
 * Lấy danh sách lịch trình đã lưu của người dùng hiện tại
 */
export async function getMyPlansApi() {
  const response = await fetch(`${API_BASE}/plans/my-plans`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Không thể lấy danh sách lịch trình');
  }

  return json.data;
}

/**
 * Xem chi tiết 1 lịch trình đã lưu
 */
export async function getPlanByIdApi(id) {
  const response = await fetch(`${API_BASE}/plans/${id}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Không thể tải chi tiết lịch trình');
  }

  return json.data;
}

/**
 * Xóa 1 lịch trình đã lưu
 */
export async function deletePlanApi(id) {
  const response = await fetch(`${API_BASE}/plans/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Không thể xóa lịch trình');
  }

  return json;
}
