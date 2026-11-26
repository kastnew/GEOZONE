import { applyWeatherAdjustment } from './placeScorer.js';
import { calculateDistanceKm } from './zoneGrouper.js';
import { validateDaySchedule } from './timeSlotScheduler.js';

/**
 * Chọn ra bộ địa điểm cho một ngày:
 * - Ưu tiên tuyệt đối các địa điểm Must-Visit (khách tự thêm vào Chuyến đi).
 * - Siết bán kính cụm cứng (<= 8 km) và suy giảm mũ theo khoảng cách để không đi lòng vòng.
 */
function selectDayCandidateSet(
  weatherScored,
  usedPlaceIds,
  usedPrimaryZoneIds,
  penaltiesForDay,
  dailyCap,
  maxDailyMinutes,
  maxPlacesPerDay = 6
) {
  const getEffectiveScore = place => {
    if (place.isMustVisit) {
      // Must-Visit luôn giữ ưu tiên cao nhất (chỉ trừ nhẹ nếu bị phạt trực tiếp khi kẹt giờ)
      return 2.0 + (penaltiesForDay.get(place.id) || 0);
    }
    return (place.weatherAdjustedScore ?? place.totalScore ?? 0) + (penaltiesForDay.get(place.id) || 0);
  };

  const dayUsed = new Set();

  // 1. Chọn điểm Mỏ Neo (Anchor):
  // Nếu còn điểm Must-Visit chưa đi -> bắt buộc chọn làm Mỏ Neo của ngày (bất chấp dailyCap)
  const unvisitedMustVisits = weatherScored.filter(
    p => !usedPlaceIds.has(p.id) && p.isMustVisit
  );

  let anchor = null;
  if (unvisitedMustVisits.length > 0) {
    unvisitedMustVisits.sort((a, b) => getEffectiveScore(b) - getEffectiveScore(a));
    anchor = unvisitedMustVisits[0];
  } else {
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
    anchor = anchorPool[0];
  }

  const selectedPlaces = [anchor];
  dayUsed.add(anchor.id);

  let currentDayMinutes = anchor.duration || 60;
  let currentDayCost = anchor.estimatedCost || 0;

  // 2. Nhặt thêm các địa điểm quanh tâm Anchor:
  // - Ưu tiên các điểm Must-Visit khác nằm gần (<= 10 km)
  // - Các điểm gợi ý khác: siết bán kính cứng <= 8 km để lộ trình gọn, không đi lòng vòng
  while (selectedPlaces.length < maxPlacesPerDay) {
    const baseRemaining = weatherScored.filter(p => {
      if (usedPlaceIds.has(p.id) || dayUsed.has(p.id)) return false;
      const cost = p.estimatedCost || 0;
      const duration = p.duration || 60;
      const fitsTime = currentDayMinutes + duration + 15 <= maxDailyMinutes;
      const fitsBudget = p.isMustVisit || cost === 0 || currentDayCost + cost <= dailyCap;
      return fitsTime && fitsBudget;
    });

    if (baseRemaining.length === 0) break;

    // Lọc theo bán kính cứng 8 km (trừ khi là điểm Must-Visit trong vòng 10 km)
    const within8Km = baseRemaining.filter(p => {
      const dist = calculateDistanceKm(anchor.latitude, anchor.longitude, p.latitude, p.longitude);
      return p.isMustVisit ? dist <= 10.0 : dist <= 8.0;
    });

    let candidatePool = within8Km;
    // Nếu trong 8 km không còn điểm nào và ngày mới chỉ có 1 điểm đơn lẻ -> nới tối đa 15 km
    if (candidatePool.length === 0 && selectedPlaces.length < 2) {
      candidatePool = baseRemaining.filter(
        p => calculateDistanceKm(anchor.latitude, anchor.longitude, p.latitude, p.longitude) <= 15.0
      );
    }

    if (candidatePool.length === 0) break;

    let bestPlace = null;
    let bestPickScore = -Infinity;

    for (const candidate of candidatePool) {
      const distKm = calculateDistanceKm(
        anchor.latitude,
        anchor.longitude,
        candidate.latitude,
        candidate.longitude
      );

      // Hàm suy giảm mũ theo khoảng cách: 1km->0.78, 3km->0.47, 8km->0.13
      const proximityScore = Math.exp(-0.25 * distKm);
      const sameZoneBonus = candidate.zoneId === anchor.zoneId ? 0.05 : 0;

      const pickScore =
        getEffectiveScore(candidate) * 0.6 +
        proximityScore * 0.4 +
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
 * Bước 4: Phân bổ địa điểm cho từng ngày theo Cụm Tọa độ GPS (bán kính 8km), Thời tiết và Ngân sách Cân bằng
 * Tích hợp Vòng lặp Phản hồi 2 cấp với Bước 5 & Ưu tiên Must-Visit từ Giỏ chuyến đi.
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
    // Ngày cuối cùng khóa chặt trần = remainingBudget để tổng cả chuyến KHÔNG BAO GIỜ vượt totalBudget
    const dailyCap =
      remainingDays === 1
        ? remainingBudget
        : Math.min(remainingBudget, dailyTarget * 1.2);

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

    // Vòng lặp Phản hồi 2 cấp (Feedback Loop với Bước 5)
    const penaltiesForDay = new Map();
    const MAX_RETRIES = 2;
    let currentMaxPlaces = 6;
    let bestPick = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const pick = selectDayCandidateSet(
        weatherScored,
        usedPlaceIds,
        usedPrimaryZoneIds,
        penaltiesForDay,
        dailyCap,
        maxDailyMinutes,
        currentMaxPlaces
      );

      bestPick = pick;
      if (pick.selectedPlaces.length <= 1) break;

      const check = validateDaySchedule(pick.selectedPlaces, startTime, endTime);
      if (check.valid || !check.culpritPlaceId) {
        break;
      }

      // Bảo vệ điểm Must-Visit: nếu culprit là Must-Visit nhưng trong ngày vẫn còn điểm thường -> phạt điểm thường cuối cùng
      const culpritObj = pick.selectedPlaces.find(p => p.id === check.culpritPlaceId);
      let targetPenalizeId = check.culpritPlaceId;
      if (culpritObj?.isMustVisit) {
        const nonMustVisits = pick.selectedPlaces.filter(p => !p.isMustVisit);
        if (nonMustVisits.length > 0) {
          targetPenalizeId = nonMustVisits[nonMustVisits.length - 1].id;
        }
      }

      penaltiesForDay.set(
        targetPenalizeId,
        (penaltiesForDay.get(targetPenalizeId) || 0) - 0.6
      );

      if (attempt >= 1 && pick.selectedPlaces.length > 3) {
        currentMaxPlaces = pick.selectedPlaces.length - 1;
      }
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
