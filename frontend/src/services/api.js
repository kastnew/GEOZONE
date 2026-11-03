const API_BASE = '/api/v1';

/**
 * Gọi API sinh lịch trình tự động
 * @param {import('../types/index.js').TripInputState} payload
 */
export async function generateItineraryApi(payload) {
  const response = await fetch(`${API_BASE}/plans/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
 * @param {Object} payload
 */
export async function swapPlaceApi(payload) {
  const response = await fetch(`${API_BASE}/plans/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'Không thể hoán đổi địa điểm');
  }

  return json.data;
}
