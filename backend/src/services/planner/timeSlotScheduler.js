import { calculateDistanceKm } from './zoneGrouper.js';

/**
 * Chuyển chuỗi "HH:mm" thành tổng số phút từ 00:00
 * @param {string | null | undefined} timeStr
 * @param {number} fallbackMins
 */
function timeToMinutes(timeStr, fallbackMins) {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
    return fallbackMins;
  }
  const [h, m] = timeStr.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallbackMins;
  return h * 60 + m;
}

/**
 * Chuyển tổng số phút thành chuỗi "HH:mm"
 * @param {number} totalMins
 */
function minutesToTime(totalMins) {
  const normalized = Math.max(0, Math.round(totalMins)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Tính thời gian di chuyển ước tính (phút) từ khoảng cách GPS (km)
 * Tốc độ nội đô 25 km/h + 5 phút gửi xe/di chuyển vào cổng (tối thiểu 10 phút)
 */
function estimateTravelMinutes(distanceKm) {
  return Math.max(10, Math.round((distanceKm / 25) * 60) + 5);
}

/**
 * Tính điểm thưởng/phạt khung giờ sinh hoạt Sáng - Trưa - Chiều - Tối
 * Điểm càng thấp càng tốt (hàm chi phí cần tối thiểu hóa)
 */
function calculateTimeWindowPenalty(place, arrivalMins) {
  const tags = Array.isArray(place.tags) ? place.tags.map(t => String(t).toLowerCase()) : [];
  let penalty = 0;

  const isFood = tags.includes('food');
  const isNightlife = tags.includes('nightlife');

  // Ăn uống lý tưởng vào Trưa (11:00 - 13:30) hoặc Tối (17:30 - 20:30)
  if (isFood) {
    const inLunch = arrivalMins >= 11 * 60 && arrivalMins <= 13 * 60 + 30;
    const inDinner = arrivalMins >= 17 * 60 + 30 && arrivalMins <= 20 * 60 + 30;
    if (inLunch || inDinner) {
      penalty -= 3.0; // Thưởng vì khớp đúng bữa ăn
    } else {
      penalty += 4.0; // Phạt nhẹ nếu xếp quán ăn vào giữa sáng/chiều
    }
  }

  // Hoạt động về đêm lý tưởng từ 17:30 trở đi
  if (isNightlife) {
    if (arrivalMins >= 17 * 60 + 30) {
      penalty -= 4.0;
    } else {
      penalty += 8.0; // Tránh xếp nightlife vào ban ngày
    }
  }

  return penalty;
}

/**
 * Thuật toán Sinh Hoán Vị có Cắt tỉa nhánh (Backtracking with Pruning) cho N <= 7 điểm/ngày
 * Tìm thứ tự đi sao cho:
 * 1. Tổng quãng đường di chuyển (km) ngắn nhất
 * 2. Không vi phạm giờ đóng cửa (closingTime) và tổng thời lượng ngày
 * 3. Khớp khung giờ ăn uống / nightlife và hạn chế nhảy qua lại giữa các Zone
 */
function findOptimalOrderByPermutation(places, startMins, endMins, strictTimeWindow = true) {
  const n = places.length;
  if (n <= 1) return places;

  let bestOrder = null;
  let bestCost = Infinity;
  const used = new Array(n).fill(false);
  const currentOrder = [];

  function backtrack(currentMins, totalDist, totalPenalty, lastPlace) {
    // Cắt tỉa nhánh nếu chi phí hiện tại đã tệ hơn phương án tốt nhất
    const currentScore = totalDist + totalPenalty;
    if (bestOrder && currentScore >= bestCost && totalPenalty >= 0) {
      // Vẫn có thể được thưởng âm từ các điểm food/nightlife phía sau nếu chưa đi hết,
      // nhưng nếu totalDist đơn thuần đã vượt quá xa thì cắt sớm
      if (totalDist - 12 >= bestCost) return;
    }

    if (currentOrder.length === n) {
      if (currentScore < bestCost) {
        bestCost = currentScore;
        bestOrder = [...currentOrder];
      }
      return;
    }

    for (let i = 0; i < n; i++) {
      if (used[i]) continue;

      const candidate = places[i];
      const dist = lastPlace
        ? calculateDistanceKm(lastPlace.latitude, lastPlace.longitude, candidate.latitude, candidate.longitude)
        : 0;
      const travelMins = lastPlace ? estimateTravelMinutes(dist) : 0;

      let arrivalMins = currentMins + travelMins;
      const openMins = timeToMinutes(candidate.openingTime, 6 * 60);
      const closeMins = timeToMinutes(candidate.closingTime, 23 * 60);
      const duration = candidate.duration || 60;

      // Nếu đến sớm hơn giờ mở cửa: đợi đến giờ mở cửa
      // Ở chế độ strict: chỉ cắt tỉa nếu là điểm ban ngày nhưng phải đợi quá lâu (> 2 tiếng)
      // Còn điểm buổi tối (mở từ 16:00 trở đi) được phép có khoảng nghỉ chiều trước khi vào ca tối
      if (arrivalMins < openMins) {
        if (strictTimeWindow && openMins < 16 * 60 && openMins - arrivalMins > 120) {
          continue;
        }
        arrivalMins = openMins;
      }

      const finishMins = arrivalMins + duration;

      // Cắt tỉa nếu vượt giờ đóng cửa hoặc quá trễ so với giờ kết thúc ngày
      if (strictTimeWindow) {
        if (finishMins > closeMins + 15) continue;
        if (finishMins > endMins + 60) continue;
      }

      const timePenalty = calculateTimeWindowPenalty(candidate, arrivalMins);
      const zoneSwitchPenalty = lastPlace && lastPlace.zoneId !== candidate.zoneId ? 1.5 : 0;

      used[i] = true;
      currentOrder.push(candidate);

      backtrack(
        finishMins,
        totalDist + dist,
        totalPenalty + timePenalty + zoneSwitchPenalty,
        candidate
      );

      currentOrder.pop();
      used[i] = false;
    }
  }

  backtrack(startMins, 0, 0, null);
  return bestOrder;
}

/**
 * Fallback Nearest Neighbor khi số điểm > 7
 */
function findOrderByNearestNeighbor(places) {
  if (places.length <= 1) return places;
  const remaining = [...places];
  const ordered = [remaining.shift()];

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let minDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistanceKm(
        last.latitude,
        last.longitude,
        remaining[i].latitude,
        remaining[i].longitude
      );
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return ordered;
}

/**
 * Kiểm tra xem tập địa điểm của 1 ngày có xếp được lịch hợp lệ hoàn toàn (strict = true) hay không.
 * Nếu không xếp được, chỉ định ID của địa điểm gây xung đột giờ lớn nhất (culpritPlaceId)
 * để Bước 4 cộng Penalty và chọn lại.
 *
 * @param {any[]} places
 * @param {string} [startTime='08:00']
 * @param {string} [endTime='21:00']
 * @returns {{ valid: boolean, culpritPlaceId: number | null }}
 */
export function validateDaySchedule(places, startTime = '08:00', endTime = '21:00') {
  if (!Array.isArray(places) || places.length <= 1 || places.length > 7) {
    return { valid: true, culpritPlaceId: null };
  }

  const startMins = timeToMinutes(startTime, 8 * 60);
  const endMins = timeToMinutes(endTime, 21 * 60);

  const validOrder = findOptimalOrderByPermutation(places, startMins, endMins, true);
  if (validOrder) {
    return { valid: true, culpritPlaceId: null };
  }

  // Xác định "thủ phạm" gây kẹt giờ (ưu tiên giữ lại Anchor places[0] nếu có thể)
  const pool = places.length > 1 ? places.slice(1) : places;

  // 1. Nếu có >= 2 điểm mở muộn (>= 16:00 hoặc nightlife) trong ngày -> chọn điểm mở muộn có điểm thấp nhất
  const latePlaces = places.filter(p => {
    const openMins = timeToMinutes(p.openingTime, 6 * 60);
    const tags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase()) : [];
    return openMins >= 16 * 60 || tags.includes('nightlife');
  });

  if (latePlaces.length >= 2) {
    const sortedLate = [...latePlaces].sort(
      (a, b) => (a.weatherAdjustedScore ?? a.totalScore ?? 0) - (b.weatherAdjustedScore ?? b.totalScore ?? 0)
    );
    return { valid: false, culpritPlaceId: sortedLate[0].id };
  }

  // 2. Nếu không phải kẹt ca tối -> ưu tiên loại điểm đóng cửa sớm nhất hoặc thời lượng quá dài trong nhóm non-anchor
  const sortedPool = [...pool].sort((a, b) => {
    const closeA = timeToMinutes(a.closingTime, 23 * 60);
    const closeB = timeToMinutes(b.closingTime, 23 * 60);
    if (closeA !== closeB) return closeA - closeB;
    return (b.duration || 60) - (a.duration || 60);
  });

  return { valid: false, culpritPlaceId: sortedPool[0]?.id ?? null };
}

/**
 * Bước 5: Tối ưu lộ trình và lập thời gian chi tiết (Timeline Scheduling)
 * - Dùng Thuật toán Sinh Hoán Vị có cắt tỉa (N <= 7) để tối ưu quãng đường + khớp giờ mở cửa & Sáng/Trưa/Chiều/Tối.
 * - Tính thời gian di chuyển động theo khoảng cách GPS Haversine.
 *
 * @param {any[]} dayBundles
 * @param {string} [startTime='08:00']
 * @param {string} [endTime='21:00']
 */
export function scheduleTimeSlots(dayBundles, startTime = '08:00', endTime = '21:00') {
  const startMins = timeToMinutes(startTime, 8 * 60);
  const endMins = timeToMinutes(endTime, 21 * 60);

  return dayBundles.map(bundle => {
    const places = Array.isArray(bundle.places) ? bundle.places : [];

    // Tìm thứ tự tối ưu: thử Sinh hoán vị có kiểm tra giờ mở cửa -> nới lỏng -> Nearest Neighbor nếu > 7 điểm
    let orderedPlaces = places;
    if (places.length > 1 && places.length <= 7) {
      orderedPlaces =
        findOptimalOrderByPermutation(places, startMins, endMins, true) ||
        findOptimalOrderByPermutation(places, startMins, endMins, false) ||
        places;
    } else if (places.length > 7) {
      orderedPlaces = findOrderByNearestNeighbor(places);
    }

    let currentMins = startMins;
    const activities = [];
    let dayTotalCost = 0;
    let dayTotalDuration = 0;
    let dayTotalDistanceKm = 0;

    orderedPlaces.forEach((place, index) => {
      const prevPlace = index > 0 ? orderedPlaces[index - 1] : null;
      const distKm = prevPlace
        ? calculateDistanceKm(prevPlace.latitude, prevPlace.longitude, place.latitude, place.longitude)
        : 0;
      const travelTime = index === 0 ? 0 : estimateTravelMinutes(distKm);

      currentMins += travelTime;

      // Nếu đến trước giờ mở cửa của địa điểm, đợi đến lúc mở cửa để không xếp sai giờ
      const openMins = timeToMinutes(place.openingTime, 0);
      if (openMins > currentMins) {
        currentMins = openMins;
      }

      const duration = place.duration || 60;
      const slotStartMins = currentMins;
      const slotEndMins = slotStartMins + duration;
      currentMins = slotEndMins;

      const slotStart = minutesToTime(slotStartMins);
      const slotEnd = minutesToTime(slotEndMins);

      activities.push({
        placeId: place.id,
        placeName: place.name,
        zoneId: place.zoneId,
        zoneName: place.zoneName || bundle.zoneName,
        timeSlot: `${slotStart} - ${slotEnd}`,
        startTime: slotStart,
        endTime: slotEnd,
        duration,
        estimatedCost: place.estimatedCost || 0,
        travelTimeFromPrev: travelTime,
        distanceFromPrevKm: distKm,
        latitude: place.latitude,
        longitude: place.longitude
      });

      dayTotalCost += place.estimatedCost || 0;
      dayTotalDuration += duration + travelTime;
      dayTotalDistanceKm += distKm;
    });

    return {
      dayNumber: bundle.dayNumber,
      zoneId: bundle.zoneId,
      zoneName: bundle.zoneName,
      title: `Ngày ${bundle.dayNumber}: Khám phá ${bundle.zoneName}`,
      weather: bundle.weather || null,
      totalDistanceKm: Number(dayTotalDistanceKm.toFixed(2)),
      totalEstimatedCost: dayTotalCost,
      totalDurationMin: dayTotalDuration,
      activities
    };
  });
}
