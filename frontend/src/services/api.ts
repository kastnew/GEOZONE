import { TripInputState, GeneratedPlanResponse, ActivityItem } from '../types/index.js';

const API_BASE = '/api/v1';

export async function generateItineraryApi(
  payload: TripInputState
): Promise<GeneratedPlanResponse> {
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

export async function swapPlaceApi(payload: {
  currentPlaceId: number;
  dayNumber: number;
  targetZoneId: number;
  remainingBudget: number;
  excludedPlaceIds: number[];
  userPreferences: string[];
}): Promise<ActivityItem> {
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
