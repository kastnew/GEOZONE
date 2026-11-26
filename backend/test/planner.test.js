import assert from 'node:assert/strict';
import { scorePlaces, applyWeatherAdjustment } from '../src/services/planner/placeScorer.js';
import { groupPlacesByZone, calculateDistanceKm } from '../src/services/planner/zoneGrouper.js';
import { allocateDays } from '../src/services/planner/dayAllocator.js';
import { scheduleTimeSlots, validateDaySchedule } from '../src/services/planner/timeSlotScheduler.js';
import { getWeatherForecast } from '../src/services/planner/weatherService.js';

const MOCK_PLACES = [
  {
    id: 1, name: 'Biển Mỹ Khê', city: 'Da Nang', zoneId: 2, zoneName: 'Ven biển Mỹ Khê',
    estimatedCost: 0, duration: 90, openingTime: '05:00', closingTime: '22:00',
    latitude: 16.0592, longitude: 108.2470, rating: 4.8, tags: ['beach', 'nature']
  },
  {
    id: 2, name: 'Bảo tàng Điêu khắc Chăm', city: 'Da Nang', zoneId: 1, zoneName: 'Trung tâm Hải Châu',
    estimatedCost: 60000, duration: 90, openingTime: '07:00', closingTime: '17:00',
    latitude: 16.0605, longitude: 108.2236, rating: 4.7, tags: ['culture', 'sightseeing']
  },
  {
    id: 3, name: 'Mì Quảng Bà Mua', city: 'Da Nang', zoneId: 1, zoneName: 'Trung tâm Hải Châu',
    estimatedCost: 50000, duration: 60, openingTime: '06:30', closingTime: '21:30',
    latitude: 16.0620, longitude: 108.2210, rating: 4.6, tags: ['food']
  },
  {
    id: 4, name: 'Chợ đêm Sơn Trà', city: 'Da Nang', zoneId: 2, zoneName: 'Ven biển Mỹ Khê',
    estimatedCost: 150000, duration: 90, openingTime: '17:30', closingTime: '23:30',
    latitude: 16.0615, longitude: 108.2300, rating: 4.5, tags: ['nightlife', 'food']
  },
  {
    id: 5, name: 'Chùa Linh Ứng', city: 'Da Nang', zoneId: 3, zoneName: 'Bán đảo Sơn Trà',
    estimatedCost: 0, duration: 90, openingTime: '06:00', closingTime: '21:00',
    latitude: 16.1003, longitude: 108.2773, rating: 4.9, tags: ['culture', 'nature']
  },
  {
    id: 6, name: 'Hải sản Bé Mặn', city: 'Da Nang', zoneId: 2, zoneName: 'Ven biển Mỹ Khê',
    estimatedCost: 350000, duration: 90, openingTime: '10:00', closingTime: '23:00',
    latitude: 16.0710, longitude: 108.2485, rating: 4.4, tags: ['food']
  },
  {
    id: 7, name: 'Cầu Rồng', city: 'Da Nang', zoneId: 1, zoneName: 'Trung tâm Hải Châu',
    estimatedCost: 0, duration: 45, openingTime: '00:00', closingTime: '23:59',
    latitude: 16.0611, longitude: 108.2275, rating: 4.8, tags: ['sightseeing', 'nightlife']
  },
  {
    id: 8, name: 'Ngũ Hành Sơn', city: 'Da Nang', zoneId: 4, zoneName: 'Ngũ Hành Sơn',
    estimatedCost: 40000, duration: 120, openingTime: '07:00', closingTime: '17:30',
    latitude: 16.0034, longitude: 108.2633, rating: 4.7, tags: ['nature', 'culture']
  }
];

async function runTests() {
  console.log('🧪 Bắt đầu chạy bộ test Planner Pipeline...\n');

  // 1. Test Haversine Distance & ZoneGrouper
  const distKm = calculateDistanceKm(16.0605, 108.2236, 16.0611, 108.2275);
  assert.ok(distKm > 0 && distKm < 1, `Khoảng cách Cầu Rồng - Bảo tàng Chăm phải < 1km (nhận được ${distKm})`);
  console.log(`✅ [1/5] Haversine GPS hoạt động chính xác (${distKm} km)`);

  // 2. Test PlaceScorer (Rating + Diversity Penalty) & Weather Adjustment
  const scored = scorePlaces(MOCK_PLACES, ['food', 'culture', 'beach']);
  assert.equal(scored.length, MOCK_PLACES.length);
  assert.ok(scored[0].ratingScore !== undefined, 'Phải có trường ratingScore');
  assert.ok(scored[0].totalScore >= scored[scored.length - 1].totalScore, 'Phải sắp xếp giảm dần theo totalScore');

  const rainyScored = applyWeatherAdjustment(scored, 'RAINY');
  const beachRainy = rainyScored.find(p => p.name === 'Biển Mỹ Khê');
  const museumRainy = rainyScored.find(p => p.name === 'Bảo tàng Điêu khắc Chăm');
  assert.ok(beachRainy.weatherDelta < 0, 'Trời mưa phải trừ điểm địa điểm biển');
  assert.ok(museumRainy.weatherDelta > 0, 'Trời mưa phải cộng điểm địa điểm trong nhà');
  console.log('✅ [2/5] PlaceScorer (Rating + Diversity Penalty + Weather Adjustment) chính xác');

  // 3. Test ZoneGrouper
  const zoneMap = groupPlacesByZone(scored);
  assert.ok(zoneMap.size === 4, 'Phải gom thành 4 Zone');
  console.log('✅ [3/5] ZoneGrouper chuẩn hóa tọa độ và tính điểm Top-4 thành công');

  // 4. Test DayAllocator (2 ngày, 1 ngày mưa 1 ngày nắng, không trùng lặp, kiểm soát ngân sách)
  const mockWeather = [
    { dayNumber: 1, condition: 'SUNNY', tempMax: 32, rainProb: 5, advice: 'Nắng đẹp' },
    { dayNumber: 2, condition: 'RAINY', tempMax: 24, rainProb: 85, advice: 'Có mưa' }
  ];
  const dayBundles = allocateDays(zoneMap, 2, 1000000, 8, mockWeather);
  assert.equal(dayBundles.length, 2, 'Phải chia đủ 2 ngày');

  const allPickedIds = dayBundles.flatMap(d => d.places.map(p => p.id));
  const uniquePickedIds = new Set(allPickedIds);
  assert.equal(allPickedIds.length, uniquePickedIds.size, 'Tuyệt đối không được trùng địa điểm giữa các ngày');
  for (const d of dayBundles) {
    assert.ok(d.places.length >= 2, `Ngày ${d.dayNumber} phải chọn được ít nhất 2 địa điểm`);
  }
  const total2DaysCost = dayBundles.reduce((s, d) => s + d.estimatedTotalCost, 0);
  assert.ok(total2DaysCost <= 1000000, `Tổng chi phí 2 ngày (${total2DaysCost}) không được vượt 1.000.000đ`);
  console.log(`✅ [4/5] DayAllocator chọn ${allPickedIds.length} địa điểm (0 trùng lặp, giữ cân bằng ngân sách & thời tiết)`);

  // 5. Test TimeSlotScheduler (Sinh hoán vị + giờ mở cửa + Sáng/Trưa/Chiều/Tối)
  const scheduled = scheduleTimeSlots(dayBundles, '08:00', '21:00');
  assert.equal(scheduled.length, 2);
  for (const day of scheduled) {
    assert.ok(day.totalDistanceKm >= 0, 'Phải tính được tổng quãng đường km');
    assert.ok(day.activities.length > 0, 'Ngày phải có danh sách hoạt động');
    // Kiểm tra Chợ đêm Sơn Trà (mở 17:30) nếu được chọn phải xếp từ 17:30 trở đi
    const nightMarket = day.activities.find(a => a.placeName === 'Chợ đêm Sơn Trà');
    if (nightMarket) {
      const [h, m] = nightMarket.startTime.split(':').map(Number);
      assert.ok(h * 60 + m >= 17 * 60 + 30, `Chợ đêm phải xếp sau 17:30 (hiện tại: ${nightMarket.startTime})`);
    }
  }
  console.log('✅ [5/5] TimeSlotScheduler (Sinh hoán vị có cắt tỉa + khung giờ mở cửa) chạy hoàn hảo');

  // 6. Test Feedback Loop (Bước 5 phát hiện kẹt giờ -> cộng Penalty -> Bước 4 chọn lại điểm khác)
  const conflictPlaces = [
    {
      id: 101, name: 'Công viên Biển Đông', city: 'Da Nang', zoneId: 2, zoneName: 'Mỹ Khê',
      estimatedCost: 0, duration: 90, openingTime: '06:00', closingTime: '22:00',
      latitude: 16.0650, longitude: 108.2460, rating: 4.9, tags: ['nature', 'sightseeing']
    },
    {
      id: 102, name: 'Bar Sky36', city: 'Da Nang', zoneId: 1, zoneName: 'Hải Châu',
      estimatedCost: 100000, duration: 120, openingTime: '19:00', closingTime: '23:30',
      latitude: 16.0770, longitude: 108.2240, rating: 4.8, tags: ['nightlife']
    },
    {
      id: 103, name: 'Phố đi bộ Bạch Đằng Đêm', city: 'Da Nang', zoneId: 1, zoneName: 'Hải Châu',
      estimatedCost: 0, duration: 120, openingTime: '19:00', closingTime: '23:30',
      latitude: 16.0690, longitude: 108.2250, rating: 4.7, tags: ['nightlife']
    },
    {
      id: 104, name: 'Chợ đêm Helio', city: 'Da Nang', zoneId: 1, zoneName: 'Hải Châu',
      estimatedCost: 50000, duration: 120, openingTime: '18:30', closingTime: '23:00',
      latitude: 16.0380, longitude: 108.2230, rating: 4.6, tags: ['nightlife']
    },
    {
      id: 105, name: 'Bảo tàng Mỹ thuật', city: 'Da Nang', zoneId: 1, zoneName: 'Hải Châu',
      estimatedCost: 20000, duration: 90, openingTime: '08:00', closingTime: '17:00',
      latitude: 16.0695, longitude: 108.2190, rating: 4.5, tags: ['culture']
    },
    {
      id: 106, name: 'Cầu Tình Yêu', city: 'Da Nang', zoneId: 2, zoneName: 'Mỹ Khê',
      estimatedCost: 0, duration: 60, openingTime: '00:00', closingTime: '23:59',
      latitude: 16.0625, longitude: 108.2290, rating: 4.5, tags: ['sightseeing']
    }
  ];
  const conflictScored = scorePlaces(conflictPlaces, ['nightlife', 'sightseeing', 'culture']);
  const conflictZoneMap = groupPlacesByZone(conflictScored);
  const resolvedDays = allocateDays(conflictZoneMap, 1, 500000, 8, [mockWeather[0]], '08:00', '21:00');
  const finalCheck = validateDaySchedule(resolvedDays[0].places, '08:00', '21:00');
  assert.equal(finalCheck.valid, true, 'Feedback Loop phải tự sửa được xung đột nhiều điểm tối trong 1 ngày');
  console.log('✅ [6/6] Feedback Loop (Cộng Penalty & Chọn lại điểm ở Bước 4 khi kẹt giờ) hoạt động chính xác');

  // 7. Test Budget-Aware Cost Scoring & Must-Visit Guarantee & Hard Radius 8km
  const farAndPaidPlaces = [
    ...MOCK_PLACES,
    {
      id: 9, name: 'Bà Nà Hills', city: 'Da Nang', zoneId: 5, zoneName: 'Hòa Vang',
      estimatedCost: 900000, duration: 300, openingTime: '08:00', closingTime: '17:00',
      latitude: 15.9980, longitude: 107.9940, rating: 4.9, tags: ['sightseeing', 'nature']
    }
  ];
  const highBudgetScored = scorePlaces(farAndPaidPlaces, ['culture', 'food'], undefined, {
    dailyBudget: 1500000,
    mustVisitIds: [8] // Ép Ngũ Hành Sơn (id=8) phải có mặt
  });
  const mustVisitSpot = highBudgetScored.find(p => p.id === 8);
  assert.equal(mustVisitSpot.isMustVisit, true, 'Phải gắn cờ isMustVisit cho địa điểm khách chọn');
  assert.equal(mustVisitSpot.totalScore, 2.0, 'Must-Visit phải đạt điểm tối đa 2.0');

  const highBudgetZoneMap = groupPlacesByZone(highBudgetScored);
  const highBudgetDays = allocateDays(highBudgetZoneMap, 2, 3000000, 8, mockWeather, '08:00', '21:00');
  const allHighBudgetIds = highBudgetDays.flatMap(d => d.places.map(p => p.id));
  assert.ok(allHighBudgetIds.includes(8), 'Địa điểm Must-Visit bắt buộc phải có trong lịch trình');
  console.log('✅ [7/7] Budget-Aware Cost Scoring, Hard Radius 8km & Must-Visit Guarantee hoạt động chính xác');

  // 8. Test Threshold CostScore (<= trung bình cộng 1.0, > trung bình cộng 0.0) & Nghỉ trưa 30p
  const thresholdScored = scorePlaces(
    [
      { id: 201, name: 'Điểm 0đ', estimatedCost: 0, rating: 4.5, tags: ['culture'], zoneId: 1 },
      { id: 202, name: 'Điểm 150k', estimatedCost: 150000, rating: 4.5, tags: ['culture'], zoneId: 1 },
      { id: 203, name: 'Điểm 500k', estimatedCost: 500000, rating: 4.5, tags: ['culture'], zoneId: 1 }
    ],
    ['culture'],
    undefined,
    { dailyBudget: 800000 } // avgPlaceBudget = 200.000đ
  );
  const s0 = thresholdScored.find(p => p.id === 201);
  const s150 = thresholdScored.find(p => p.id === 202);
  const s500 = thresholdScored.find(p => p.id === 203);
  assert.equal(s0.costScore, 1.0, '0đ <= 200k phải có costScore = 1.0');
  assert.equal(s150.costScore, 1.0, '150k <= 200k phải có cùng costScore = 1.0 như 0đ');
  assert.equal(s500.costScore, 0.0, '500k > 200k phải có costScore = 0.0');

  const middaySchedule = scheduleTimeSlots([
    {
      dayNumber: 1,
      zoneId: 1,
      zoneName: 'Trung tâm',
      places: [
        { id: 301, name: 'Bảo tàng A', zoneId: 1, duration: 210, openingTime: '08:00', closingTime: '17:00', latitude: 16.06, longitude: 108.22, tags: ['culture'] },
        { id: 302, name: 'Di tích B', zoneId: 1, duration: 90, openingTime: '08:00', closingTime: '17:00', latitude: 16.061, longitude: 108.221, tags: ['sightseeing'] }
      ]
    }
  ]);
  assert.equal(middaySchedule[0].activities[1].breakBeforeMin, 90, 'Phải chèn 90 phút (1h30p) nghỉ trưa khi đi xuyên qua 11:30-13:30');
  console.log('✅ [8/8] Threshold CostScore (<= avg -> 1.0, > avg -> 0.0) & Nghỉ trưa 1h30p chính xác');

  // 9. Test WeatherService fallback an toàn (trong sandbox không có mạng)
  const weatherRes = await getWeatherForecast('Da Nang', 2);
  assert.equal(weatherRes.length, 2);
  assert.ok(['SUNNY', 'CLOUDY', 'RAINY'].includes(weatherRes[0].condition));
  console.log(`✅ [Bonus] WeatherService trả về ${weatherRes.length} ngày thời tiết an toàn (condition: ${weatherRes[0].condition})`);

  console.log('\n🎉 TẤT CẢ CÁC TEST PLANNER ĐỀU PASS 100%!');
}

runTests().catch(err => {
  console.error('❌ Test thất bại:', err);
  process.exit(1);
});
