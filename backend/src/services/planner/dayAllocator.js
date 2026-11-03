/**
 * Bước 4: Phân bổ các Zone vào từng ngày và lọc địa điểm theo ngân sách
 * Thuật toán Greedy: Chọn top Zones có averageScore cao nhất tương ứng với số ngày
 * 
 * @param {Map<number, any>} zoneMap
 * @param {number} totalDays
 * @param {number} totalBudget
 * @param {number} [maxDailyHours=8]
 */
export function allocateDays(
  zoneMap,
  totalDays,
  totalBudget,
  maxDailyHours = 8
) {
  // Sắp xếp các Zone theo averageScore giảm dần
  const sortedClusters = Array.from(zoneMap.values()).sort(
    (a, b) => b.averageScore - a.averageScore
  );

  const maxDailyMinutes = maxDailyHours * 60;
  const maxDailyBudget = totalBudget / totalDays;
  const allocatedDays = [];

  for (let day = 1; day <= totalDays; day++) {
    // Lấy cluster tương ứng với ngày (nếu thiếu zone thì quay vòng các zone còn chỗ)
    const clusterIndex = (day - 1) % sortedClusters.length;
    const currentCluster = sortedClusters[clusterIndex];

    const selectedPlaces = [];
    let currentDayMinutes = 0;
    let currentDayCost = 0;

    // Thuật toán tham lam (Greedy selection): chọn các địa điểm có điểm cao nhất
    for (const place of currentCluster.places) {
      if (
        currentDayMinutes + place.duration <= maxDailyMinutes &&
        currentDayCost + place.estimatedCost <= maxDailyBudget * 1.2 // Ngưỡng linh hoạt 20%
      ) {
        selectedPlaces.push(place);
        currentDayMinutes += place.duration;
        currentDayCost += place.estimatedCost;
      }

      // Giới hạn 3 - 5 địa điểm mỗi ngày để không bị quá tải
      if (selectedPlaces.length >= 4) break;
    }

    allocatedDays.push({
      dayNumber: day,
      zoneId: currentCluster.zoneId,
      zoneName: currentCluster.zoneName,
      places: selectedPlaces,
      estimatedTotalCost: currentDayCost,
      estimatedTotalDurationMin: currentDayMinutes
    });
  }

  return allocatedDays;
}
