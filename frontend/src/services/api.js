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
    throw new Error(json?.message || 'Đăng ký thất bại');
  }

  setToken(json.accessToken);
  setStoredUser(json.user);
  return json;
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
    throw new Error(json?.message || 'Đăng nhập thất bại');
  }

  setToken(json.accessToken);
  setStoredUser(json.user);
  return json;
}

/**
 * Đổi mật khẩu (xóa cookie phiên hiện tại và thu hồi các refresh token khác)
 */
export async function changePasswordApi({ currentPassword, newPassword }) {
  const response = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Đổi mật khẩu thất bại');
  }

  return json;
}

/**
 * Làm mới Access Token thông qua HttpOnly Cookie refreshToken
 */
export async function refreshTokenApi() {
  const response = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  const json = await response.json();
  if (!json.success || !json.accessToken) {
    removeToken();
    removeStoredUser();
    throw new Error(json.error?.message || json.message || 'Không thể làm mới phiên đăng nhập');
  }

  setToken(json.accessToken);
  return json;
}

/**
 * Đăng xuất trên server (thu hồi refresh token & clear cookie) và xóa dữ liệu local
 */
export async function logoutServerApi() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
  } finally {
    logout();
  }
}

export function logout() {
  removeToken();
  removeStoredUser();
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

/**
 * Cập nhật thông tin hồ sơ của user hiện tại (name, avatar_url)
 */
export async function updateMeApi(payload) {
  const response = await fetch(`${API_BASE}/users/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Cập nhật hồ sơ thất bại');
  }

  setStoredUser(json.data);
  return json.data;
}

/**
 * Lấy danh sách người dùng (ADMIN)
 */
export async function getUsersApi(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_BASE}/users?${query}` : `${API_BASE}/users`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  const json = await response.json();	
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể tải danh sách người dùng');
  }

  return json;
}

/**
 * Cập nhật thông tin người dùng theo userId (ADMIN)
 */
export async function updateUserByIdApi(userId, payload) {
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Cập nhật người dùng thất bại');
  }

  return json.data;
}

/**
 * Khóa hoặc mở khóa tài khoản người dùng (ADMIN)
 */
export async function updateUserStatusApi(userId, is_active) {
  const response = await fetch(`${API_BASE}/users/${userId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active })
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Cập nhật trạng thái tài khoản thất bại');
  }

  return json.data;
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
 * Xem chi tiết một địa điểm theo placeId
 */
export async function getPlaceByIdApi(placeId) {
  const response = await fetch(`${API_BASE}/places/${placeId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể tải chi tiết địa điểm');
  }

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
 * Cập nhật thông tin lịch trình đã lưu (tiêu đề, trạng thái, bật/tắt chia sẻ công khai)
 */
export async function updatePlanApi(id, payload) {
  const response = await fetch(`${API_BASE}/plans/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể cập nhật lịch trình');
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

/**
 * Xem chi tiết lịch trình công khai qua shareToken (không cần đăng nhập)
 */
export async function getSharedPlanApi(shareToken) {
  const response = await fetch(`${API_BASE}/plans/share/${shareToken}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể tải lịch trình chia sẻ');
  }

  return json.data;
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

/* ================= CATALOG ADMINISTATION ================= */

/**
 * Thêm mới địa điểm du lịch (ADMIN)
 */
export async function createPlaceApi(payload) {
  const response = await fetch(`${API_BASE}/places`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể tạo địa điểm');
  }

  return json.data;
}

/**
 * Cập nhật thông tin địa điểm (ADMIN)
 */
export async function updatePlaceApi(placeId, payload) {
  const response = await fetch(`${API_BASE}/places/${placeId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể cập nhật địa điểm');
  }

  return json.data;
}

/**
 * Xóa địa điểm khỏi hệ thống (ADMIN)
 */
export async function deletePlaceApi(placeId) {
  const response = await fetch(`${API_BASE}/places/${placeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể xóa địa điểm');
  }

  return json;
}

/**
 * Xem chi tiết một phân vùng kèm danh sách địa điểm thuộc vùng đó
 */
export async function getZoneByIdApi(zoneId) {
  const response = await fetch(`${API_BASE}/zones/${zoneId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể tải chi tiết khu vực');
  }

  return json.data;
}

/**
 * Tạo phân vùng địa lý mới (ADMIN)
 */
export async function createZoneApi(payload) {
  const response = await fetch(`${API_BASE}/zones`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể tạo khu vực');
  }

  return json.data;
}

/**
 * Cập nhật phân vùng địa lý (ADMIN)
 */
export async function updateZoneApi(zoneId, payload) {
  const response = await fetch(`${API_BASE}/zones/${zoneId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể cập nhật khu vực');
  }

  return json.data;
}

/**
 * Xóa phân vùng địa lý (ADMIN)
 */
export async function deleteZoneApi(zoneId) {
  const response = await fetch(`${API_BASE}/zones/${zoneId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error?.message || json.message || 'Không thể xóa khu vực');
  }

  return json;
}