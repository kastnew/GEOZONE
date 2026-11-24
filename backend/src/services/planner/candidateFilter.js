import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { placeService } from '../place.service.js';
import { logger } from '../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DATA_DIR = path.resolve(__dirname, '../../../../frontend/src/data');

const CITY_JSON_MAP = {
  'da nang': 'danang_places.json',
  'đà nẵng': 'danang_places.json',
  'danang': 'danang_places.json',
  'hue': 'hue_places.json',
  'huế': 'hue_places.json',
  'ha noi': 'hanoi_places.json',
  'hà nội': 'hanoi_places.json',
  'hanoi': 'hanoi_places.json',
  'ha long': 'halong_places.json',
  'hạ long': 'halong_places.json',
  'halong': 'halong_places.json',
  'ninh binh': 'ninhbinh_places.json',
  'ninh bình': 'ninhbinh_places.json',
  'ninhbinh': 'ninhbinh_places.json'
};

/**
 * Đọc dữ liệu địa điểm dự phòng từ bộ JSON của Frontend nếu DB chưa seed thành phố đó
 */
function loadLocalCityPlaces(city, tags = []) {
  const key = String(city || 'Da Nang').trim().toLowerCase();
  const fileName = CITY_JSON_MAP[key];
  if (!fileName) return [];

  const filePath = path.join(FRONTEND_DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return [];

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!Array.isArray(raw)) return [];

    const normalized = raw.map(p => ({
      id: p.id,
      name: p.name,
      city: p.city || city,
      zoneId: p.zoneId || (p.zoneCode ? parseInt(String(p.zoneCode).replace(/\D/g, ''), 10) || 1 : 1),
      zoneCode: p.zoneCode || 'Z1',
      zoneName: p.zoneName || 'Khu vực trung tâm',
      address: p.address || '',
      estimatedCost: Number(p.estimatedCost ?? p.cost) || 0,
      duration: Number(p.duration) || 60,
      openingTime: p.openingTime || '07:00',
      closingTime: p.closingTime || '22:00',
      latitude: p.latitude ? Number(p.latitude) : null,
      longitude: p.longitude ? Number(p.longitude) : null,
      popularity: p.popularity ? Number(p.popularity) : 0.7,
      rating: p.rating ? Number(p.rating) : 4.5,
      shortDesc: p.shortDesc || p.description || '',
      tags: Array.isArray(p.tags) ? p.tags : []
    }));

    if (Array.isArray(tags) && tags.length > 0) {
      return normalized.filter(p => p.tags.some(t => tags.includes(t)));
    }
    return normalized;
  } catch (err) {
    logger.warn(`[Planner] Không đọc được file JSON dự phòng (${fileName}): ${err.message}`);
    return [];
  }
}

async function fetchCityPlacesSafe(city, tags) {
  try {
    const dbPlaces = await placeService.findCandidates(city, tags);
    if (dbPlaces && dbPlaces.length > 0) {
      return dbPlaces;
    }
  } catch (err) {
    logger.warn(`[Planner] Truy vấn DB thất bại (${err.message}), chuyển sang dữ liệu JSON local.`);
  }
  return loadLocalCityPlaces(city, tags);
}

/**
 * Bước 1: Lọc danh sách địa điểm ứng viên với đa ràng buộc:
 * - Khớp sở thích (preferences/tags)
 * - Trần ngân sách đơn lẻ (bảo vệ các địa điểm miễn phí 0đ)
 * - Đảm bảo tính đa dạng phân vùng (Zone Diversity) theo số ngày đi
 * - Ngưỡng chất lượng tối thiểu (Rating >= 3.0, Duration <= 360 phút)
 * - Fallback bù đắp thông minh theo các Zone còn thiếu
 *
 * @param {import('../../types/plan.types.js').UserTripRequest} request
 * @returns {Promise<any[]>} Danh sách địa điểm ứng viên đã lọc
 */
export async function filterCandidatePlaces(request) {
  const city = request?.city || 'Da Nang';
  const days = Number(request?.days) || 2;
  const totalBudget = Number(request?.totalBudget) || 1500000;
  const preferences = Array.isArray(request?.preferences) ? request.preferences : [];

  logger.info(`[Planner] Lọc địa điểm ứng viên cho thành phố: ${city} (${days} ngày, ngân sách: ${totalBudget.toLocaleString('vi-VN')}đ)`);

  // 1. Tính toán các ngưỡng giới hạn
  const maxSinglePlaceCost = Math.max(totalBudget * 0.65, 300000);
  const minRequiredCandidates = Math.max(days * 6, 12);

  // 2. Lấy danh sách thô từ Database (hoặc JSON local nếu DB chưa có thành phố này)
  let initialPlaces = await fetchCityPlacesSafe(city, preferences);

  // 3. RÀNG BUỘC 1: Lọc theo ngân sách, rating và thời lượng tham quan khả thi
  let filteredPlaces = initialPlaces.filter(place => {
    const cost = place.estimatedCost || 0;
    const rating = place.rating || 4.0;
    const duration = place.duration || 60;

    if (cost === 0) return true;
    if (cost > maxSinglePlaceCost) {
      logger.info(`[Planner] Bỏ qua ${place.name} do chi phí vượt trần (${cost.toLocaleString()}đ > ${maxSinglePlaceCost.toLocaleString()}đ)`);
      return false;
    }
    if (rating < 3.0 || duration > 360) return false;
    return true;
  });

  // 4. RÀNG BUỘC 2: Kiểm tra Đa dạng Phân vùng (Zone Diversity)
  const presentZoneIds = new Set(filteredPlaces.map(p => p.zoneId));
  const existingPlaceIds = new Set(filteredPlaces.map(p => p.id));

  const isZoneDeficient = presentZoneIds.size < Math.min(days, 3);
  const isQuantityDeficient = filteredPlaces.length < minRequiredCandidates;

  // 5. Fallback thông minh: Nếu thiếu Zone hoặc thiếu số lượng địa điểm
  if (isZoneDeficient || isQuantityDeficient) {
    logger.warn(`[Planner] Cần bổ sung ứng viên: Hiện có ${filteredPlaces.length} điểm, ${presentZoneIds.size} Zones (Kỳ vọng: tối thiểu ${minRequiredCandidates} điểm, ${days} Zones)`);

    const fallbackPlaces = await fetchCityPlacesSafe(city, []);

    const sortedFallback = fallbackPlaces
      .filter(p => !existingPlaceIds.has(p.id))
      .filter(p => (p.estimatedCost || 0) <= maxSinglePlaceCost)
      .sort((a, b) => (b.popularity || 0) * (b.rating || 4) - (a.popularity || 0) * (a.rating || 4));

    // Ưu tiên 1: Bổ sung các địa điểm thuộc Zone chưa xuất hiện trong danh sách
    for (const place of sortedFallback) {
      if (!presentZoneIds.has(place.zoneId)) {
        filteredPlaces.push(place);
        existingPlaceIds.add(place.id);
        presentZoneIds.add(place.zoneId);
      }
      if (filteredPlaces.length >= minRequiredCandidates && presentZoneIds.size >= days) {
        break;
      }
    }

    // Ưu tiên 2: Nếu vẫn chưa đủ số lượng tối thiểu, nạp tiếp các điểm phổ biến còn lại
    if (filteredPlaces.length < minRequiredCandidates) {
      for (const place of sortedFallback) {
        if (!existingPlaceIds.has(place.id)) {
          filteredPlaces.push(place);
          existingPlaceIds.add(place.id);
        }
        if (filteredPlaces.length >= minRequiredCandidates) {
          break;
        }
      }
    }
  }

  logger.info(`[Planner] Hoàn tất lọc ứng viên: ${filteredPlaces.length} địa điểm trên ${presentZoneIds.size} Zones`);
  return filteredPlaces;
}
