import { logger } from '../../utils/logger.js';

const CITY_COORDINATES = {
  'da nang': { lat: 16.0544, lng: 108.2022 },
  'đà nẵng': { lat: 16.0544, lng: 108.2022 },
  'ha noi': { lat: 21.0285, lng: 105.8542 },
  'hà nội': { lat: 21.0285, lng: 105.8542 },
  'ho chi minh': { lat: 10.8231, lng: 106.6297 },
  'hồ chí minh': { lat: 10.8231, lng: 106.6297 },
  'hoi an': { lat: 15.8801, lng: 108.3380 },
  'hội an': { lat: 15.8801, lng: 108.3380 },
  'hue': { lat: 16.4637, lng: 107.5909 },
  'huế': { lat: 16.4637, lng: 107.5909 },
  'nha trang': { lat: 12.2388, lng: 109.1967 },
  'da lat': { lat: 11.9404, lng: 108.4583 },
  'đà lạt': { lat: 11.9404, lng: 108.4583 },
  'phu quoc': { lat: 10.2899, lng: 103.9840 },
  'phú quốc': { lat: 10.2899, lng: 103.9840 }
};

/**
 * Chuyển mã WMO weather_code từ Open-Meteo sang trạng thái đơn giản cho Planner
 * @param {number} code
 * @returns {'SUNNY' | 'CLOUDY' | 'RAINY'}
 */
function mapWmoCodeToCondition(code) {
  if (code === 0 || code === 1) return 'SUNNY';
  if (code === 2 || code === 3 || code === 45 || code === 48) return 'CLOUDY';
  // Các mã từ 51 trở lên (mưa phùn, mưa rào, giông bão)
  return 'RAINY';
}

function buildAdvice(condition) {
  if (condition === 'RAINY') {
    return 'Dự báo có mưa, ưu tiên các điểm tham quan trong nhà, bảo tàng hoặc ẩm thực.';
  }
  if (condition === 'SUNNY') {
    return 'Thời tiết nắng đẹp, rất thích hợp cho các hoạt động ngoài trời và biển đảo.';
  }
  return 'Thời tiết mát mẻ dễ chịu, phù hợp cho cả tham quan ngoài trời lẫn trong nhà.';
}

function buildFallbackForecast(days) {
  const result = [];
  for (let i = 1; i <= days; i++) {
    result.push({
      dayNumber: i,
      condition: 'CLOUDY',
      tempMax: 28,
      rainProb: 20,
      advice: buildAdvice('CLOUDY'),
      isFallback: true
    });
  }
  return result;
}

/**
 * Lấy dự báo thời tiết theo thành phố và số ngày đi từ Open-Meteo (miễn phí, không cần API key).
 * Có cơ chế timeout 2 giây và fallback tự động nếu mất mạng.
 *
 * @param {string} city
 * @param {number} days
 * @returns {Promise<Array<{ dayNumber: number, condition: 'SUNNY' | 'CLOUDY' | 'RAINY', tempMax: number, rainProb: number, advice: string, isFallback?: boolean }>>}
 */
export async function getWeatherForecast(city = 'Da Nang', days = 2) {
  const totalDays = Math.max(1, Math.min(Number(days) || 2, 14));
  const normalizedCity = String(city || 'Da Nang').trim().toLowerCase();
  const coords = CITY_COORDINATES[normalizedCity] || CITY_COORDINATES['da nang'];
  const forecastDays = Math.min(totalDays, 7);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=weather_code,temperature_2m_max,precipitation_probability_max&timezone=Asia%2FHo_Chi_Minh&forecast_days=${forecastDays}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const data = await response.json();
    const codes = data?.daily?.weather_code || [];
    const temps = data?.daily?.temperature_2m_max || [];
    const probs = data?.daily?.precipitation_probability_max || [];

    if (!Array.isArray(codes) || codes.length === 0) {
      return buildFallbackForecast(totalDays);
    }

    const forecast = [];
    for (let i = 0; i < totalDays; i++) {
      const idx = i % codes.length;
      const condition = mapWmoCodeToCondition(Number(codes[idx]));
      forecast.push({
        dayNumber: i + 1,
        condition,
        tempMax: Number(temps[idx] ?? 28),
        rainProb: Number(probs[idx] ?? 0),
        advice: buildAdvice(condition),
        isFallback: false
      });
    }

    logger.info(`[WeatherService] Đã lấy dự báo thời tiết ${city}: ${forecast.map(f => `N${f.dayNumber}:${f.condition}`).join(', ')}`);
    return forecast;
  } catch (error) {
    clearTimeout(timer);
    logger.warn(`[WeatherService] Không thể lấy dự báo thời tiết (${error.message}), sử dụng fallback mặc định.`);
    return buildFallbackForecast(totalDays);
  }
}
