import { applyWeatherAdjustment } from './placeScorer.js';
import { calculateDistanceKm } from './zoneGrouper.js';
import { validateDaySchedule } from './timeSlotScheduler.js';

/**
 * Chọn ra bộ 4 điểm cho một ngày dựa trên điểm đã điều chỉnh thời tiết + điểm phạt xung đột (nếu có)
 */
function selectDayCandidateSet(
  weatherScored,
  usedPlaceIds,
  usedPrimaryZoneIds,
  penaltiesForDay,
  dailyCap,
  maxDailyMinutes
) {
  const getEffectiveScore = place =>
    (place.weatherAdjustedScore ?? place.totalScore ?? 0) + (penaltiesForDay.get(place.id) || 0);

  const dayUsed = new Set();

  // 1. Chọn điểm Mỏ Neo (Anchor) phù hợp nhất chưa đi
  const anchorCandidates = weatherScored.filter(
    p => !usedPlaceIds.has(p.id) && ((p.estimatedCost || 0) === 0 || (p.estimatedCost || 0) <= dailyCap)
  );
  const allAvailable = weatherScored.filter(p => !usedPlaceIds.has(p.id));
  const anchorPool = anchorCandidates.length > 0 ? [...anchorCandidates] : [...allAvailable];

  if (anchorPool.length === 0) {
    return { selectedPlaces: [], totalCost: 0, totalMinutes: 0 };
  }

  anchorPool.sort((a, b) => {
    const bonusA = usedPrimaryZoneIds.has(a.zoneId) ? 0 : 0.04;
    const bonusB = usedPrimaryZoneIds.has(b.zoneId) ? 0 : 0.04;
    return (getEffectiveScore(b) + bonusB) - (getEffectiveScore(a) + bonusA);
  });

  const anchor = anchorPool[0];
  const selectedPlaces = [anchor];
  dayUsed.add(anchor.id);

  let currentDayMinutes = anchor.duration || 60;
  let currentDayCost = anchor.estimatedCost || 0;

  // 2. Nhặt thêm tối đa 3 địa điểm quanh tâm dựa trên Điểm chất lượng (đã trừ Penalty) + Khoảng cách GPS
  const maxPlacesPerDay = 4;
  while (selectedPlaces.length < maxPlacesPerDay) {
    const remainingCandidates = weatherScored.filter(p => {
      if (usedPlaceIds.has(p.id) || dayUsed.has(p.id)) return false;
      const cost = p.estimatedCost || 0;
      const duration = p.duration || 60;
      const fitsTime = currentDayMinutes + duration + 15 <= maxDailyMinutes;
      const fitsBudget = cost === 0 || currentDayCost + cost <= dailyCap;
      return fitsTime && fitsBudget;
    });

    if (remainingCandidates.length === 0) break;

    let bestPlace = null;
    let bestPickScore = -Infinity;

    for (const candidate of remainingCandidates) {
      const distKm = calculateDistanceKm(
        anchor.latitude,
        anchor.longitude,
        candidate.latitude,
        candidate.longitude
      );

      let proximityScore = 0;
      if (distKm <= 5) {
        proximityScore = 1 - distKm / 10; // 0.5 -> 1.0
      } else if (distKm <= 10) {
        proximityScore = Math.max(0, 0.5 - (distKm - 5) / 10); // 0.0 -> 0.5
      } else {
        proximityScore = -0.3;
      }

      const sameZoneBonus = candidate.zoneId === anchor.zoneId ? 0.05 : 0;
      const pickScore =
        getEffectiveScore(candidate) * 0.7 +
        proximityScore * 0.3 +
        sameZoneBonus;

      if (pickScore > bestPickScore) {
        bestPickScore = pickScore;
        bestPlace = candidate;
      }
    }

    if (!bestPlace) break;

    selectedPlaces.push(bestPlace);
    dayUsed.add(bestPlace.id);
    currentDayMinutes += (bestPlace.duration || 60) + 15;
    currentDayCost += bestPlace.estimatedCost || 0;
  }

  return {
    selectedPlaces,
    totalCost: currentDayCost,
    totalMinutes: currentDayMinutes
  };
}

/**
 * Bước 4: Phân bổ địa điểm cho từng ngày theo Cụm Tọa độ GPS, Thời tiết và Ngân sách Cân bằng
 * Tích hợp Vòng lặp Phản hồi (Feedback Loop với Bước 5):
 * - Nếu bộ điểm chọn ra bị kẹt giờ mở/đóng cửa ở Bước 5, tự động cộng Penalty cho điểm gây hỏng và chọn lại (tối đa 2 lần thử lại).
 *
 * @param {Map<number, any> | any[]} zoneMapOrPlaces
 * @param {number} totalDays
 * @param {number} totalBudget
 * @param {number} [maxDailyHours=8]
 * @param {Array<{ dayNumber: number, condition: 'SUNNY' | 'CLOUDY' | 'RAINY', tempMax?: number, rainProb?: number, advice?: string }>} [dailyWeather=[]]
 * @param {string} [startTime='08:00']
 * @param {string} [endTime='21:00']
 */
export function allocateDays(
  zoneMapOrPlaces,
  totalDays,
  totalBudget,
  maxDailyHours = 8,
  dailyWeather = [],
  startTime = '08:00',
  endTime = '21:00'
) {
  const days = Math.max(1, Number(totalDays) || 2);
  const budget = Math.max(0, Number(totalBudget) || 1500000);
  const maxDailyMinutes = (Number(maxDailyHours) || 8) * 60;

  const allPlaces = [];
  if (zoneMapOrPlaces instanceof Map) {
    for (const cluster of zoneMapOrPlaces.values()) {
      if (Array.isArray(cluster.places)) {
        allPlaces.push(...cluster.places);
      }
    }
  } else if (Array.isArray(zoneMapOrPlaces)) {
    allPlaces.push(...zoneMapOrPlaces);
  }

  const usedPlaceIds = new Set();
  const usedPrimaryZoneIds = new Set();
  const allocatedDays = [];
  let remainingBudget = budget;

  for (let day = 1; day <= days; day++) {
    const remainingDays = days - day + 1;
    const dailyTarget = remainingBudget / remainingDays;
    const dailyCap = dailyTarget * 1.2;

    const weatherOfDay = dailyWeather[day - 1] || {
      dayNumber: day,
      condition: 'CLOUDY',
      tempMax: 28,
      rainProb: 20,
      advice: 'Thời tiết mát mẻ dễ chịu, phù hợp cho cả tham quan ngoài trời lẫn trong nhà.'
    };

    const availablePlaces = allPlaces.filter(p => !usedPlaceIds.has(p.id));
    if (availablePlaces.length === 0) {
      allocatedDays.push({
        dayNumber: day,
        zoneId: 0,
        zoneName: 'Tự do khám phá',
        weather: weatherOfDay,
        places: [],
        estimatedTotalCost: 0,
        estimatedTotalDurationMin: 0
      });
      continue;
    }

    // Chấm điểm theo thời tiết của ngày hôm đó (1 lần duy nhất cho ngày)
    const weatherScored = applyWeatherAdjustment(availablePlaces, weatherOfDay.condition);

    // Vòng lặp Phản hồi (Iterative Feedback Loop với Bước 5): Tối đa thử lại 2 lần nếu kẹt giờ
    const penaltiesForDay = new Map();
    const MAX_RETRIES = 2;
    let bestPick = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const pick = selectDayCandidateSet(
        weatherScored,
        usedPlaceIds,
        usedPrimaryZoneIds,
        penaltiesForDay,
        dailyCap,
        maxDailyMinutes
      );

      bestPick = pick;
      if (pick.selectedPlaces.length <= 1) break;

      const check = validateDaySchedule(pick.selectedPlaces, startTime, endTime);
      if (check.valid || !check.culpritPlaceId) {
        break; // Lộ trình hợp lệ hoàn toàn!
      }

      // Cộng Penalty (-0.6) cho điểm gây xung đột để lần lặp kế tiếp tự chọn điểm khác hợp giờ hơn
      penaltiesForDay.set(
        check.culpritPlaceId,
        (penaltiesForDay.get(check.culpritPlaceId) || 0) - 0.6
      );
    }

    const selectedPlaces = bestPick?.selectedPlaces || [];
    const currentDayCost = bestPick?.totalCost || 0;
    const currentDayMinutes = bestPick?.totalMinutes || 0;

    for (const p of selectedPlaces) {
      usedPlaceIds.add(p.id);
    }

    remainingBudget = Math.max(0, remainingBudget - currentDayCost);

    // Gắn nhãn Zone đại diện theo đa số các điểm đã chọn trong ngày
    const zoneCounts = new Map();
    for (const p of selectedPlaces) {
      zoneCounts.set(p.zoneId, (zoneCounts.get(p.zoneId) || 0) + 1);
    }

    let majorityZoneId = selectedPlaces[0]?.zoneId ?? 0;
    let majorityZoneName = selectedPlaces[0]?.zoneName || `Zone ${majorityZoneId}`;
    let maxZoneCount = 0;

    for (const p of selectedPlaces) {
      const count = zoneCounts.get(p.zoneId) || 0;
      if (count > maxZoneCount) {
        maxZoneCount = count;
        majorityZoneId = p.zoneId;
        majorityZoneName = p.zoneName || `Zone ${p.zoneId}`;
      }
    }

    usedPrimaryZoneIds.add(majorityZoneId);

    allocatedDays.push({
      dayNumber: day,
      zoneId: majorityZoneId,
      zoneName: majorityZoneName,
      weather: weatherOfDay,
      places: selectedPlaces,
      estimatedTotalCost: currentDayCost,
      estimatedTotalDurationMin: currentDayMinutes
    });
  }

  return allocatedDays;
}
