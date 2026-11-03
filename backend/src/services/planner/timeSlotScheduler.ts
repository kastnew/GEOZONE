import { DayCandidateBundle } from './dayAllocator.js';
import { DayItinerary, ScheduledActivity } from '../../types/plan.types.js';

/**
 * Helper cộng số phút vào mốc thời gian "HH:mm"
 */
function addMinutes(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

/**
 * Bước 5: Lập thời gian chi tiết (Timeline Scheduling)
 * Sắp xếp các mốc giờ sáng, chiều, tối kèm thời gian di chuyển ước tính
 */
export function scheduleTimeSlots(
  dayBundles: DayCandidateBundle[],
  startTime: string = '08:00'
): DayItinerary[] {
  return dayBundles.map(bundle => {
    let currentTime = startTime;
    const activities: ScheduledActivity[] = [];
    let dayTotalCost = 0;
    let dayTotalDuration = 0;

    bundle.places.forEach((place, index) => {
      // Ước lượng thời gian di chuyển trong cùng Zone (15 phút)
      const travelTime = index === 0 ? 0 : 15;
      if (travelTime > 0) {
        currentTime = addMinutes(currentTime, travelTime);
      }

      const slotStart = currentTime;
      const slotEnd = addMinutes(slotStart, place.duration);
      currentTime = slotEnd;

      activities.push({
        placeId: place.id,
        placeName: place.name,
        zoneId: place.zoneId,
        zoneName: bundle.zoneName,
        timeSlot: `${slotStart} - ${slotEnd}`,
        startTime: slotStart,
        endTime: slotEnd,
        duration: place.duration,
        estimatedCost: place.estimatedCost,
        travelTimeFromPrev: travelTime,
        latitude: place.latitude,
        longitude: place.longitude
      });

      dayTotalCost += place.estimatedCost;
      dayTotalDuration += place.duration + travelTime;
    });

    return {
      dayNumber: bundle.dayNumber,
      zoneId: bundle.zoneId,
      zoneName: bundle.zoneName,
      title: `Ngày ${bundle.dayNumber}: Khám phá ${bundle.zoneName}`,
      totalEstimatedCost: dayTotalCost,
      totalDurationMin: dayTotalDuration,
      activities
    };
  });
}
