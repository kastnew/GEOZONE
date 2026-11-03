import { DayItinerary } from '../../types/plan.types.js';
import { logger } from '../../utils/logger.js';

interface AiOutputSchema {
  overallSummary?: string;
  days?: Array<{
    dayNumber: number;
    title?: string;
    activities?: Array<{
      placeId: number;
      aiDescription?: string;
      aiTravelTip?: string;
    }>;
  }>;
}

/**
 * Output Validation & Merging (Lớp phòng thủ chống Hallucination):
 * Đảm bảo LLM KHÔNG THỂ thay đổi giá tiền, thời gian, thứ tự địa điểm.
 * Backend chỉ lấy title, aiDescription, aiTravelTip từ LLM và ghép vào dữ liệu gốc của DB.
 */
export function validateAndMergeNarrative(
  originalDays: DayItinerary[],
  rawAiJsonString: string
): DayItinerary[] {
  try {
    const cleaned = rawAiJsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: AiOutputSchema = JSON.parse(cleaned);

    if (!parsed.days || !Array.isArray(parsed.days)) {
      logger.warn('[OutputValidator] LLM không trả về mảng days đúng định dạng, giữ nguyên draft gốc');
      return originalDays;
    }

    const aiDaysMap = new Map(parsed.days.map(d => [d.dayNumber, d]));

    return originalDays.map(originalDay => {
      const matchedAiDay = aiDaysMap.get(originalDay.dayNumber);
      const aiActivityMap = new Map(
        matchedAiDay?.activities?.map(a => [a.placeId, a]) || []
      );

      return {
        ...originalDay,
        title: matchedAiDay?.title || originalDay.title,
        activities: originalDay.activities.map(act => {
          const matchedAiAct = aiActivityMap.get(act.placeId);
          return {
            ...act, // GIỮ NGUYÊN 100% cost, duration, timeSlot từ DB & Thuật toán
            aiDescription: matchedAiAct?.aiDescription || `${act.placeName} - Địa điểm lý tưởng trong khu vực ${act.zoneName}.`,
            aiTravelTip: matchedAiAct?.aiTravelTip || undefined
          };
        })
      };
    });
  } catch (err) {
    logger.error('[OutputValidator] Lỗi khi parse JSON từ LLM, fallback giữ nguyên dữ liệu Backend:', err);
    return originalDays;
  }
}
