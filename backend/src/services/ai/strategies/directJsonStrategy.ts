import { IAiNarrativeStrategy } from './ilpStrategy.js';
import { DayItinerary, GeneratedPlan, UserTripRequest } from '../../../types/plan.types.js';
import { getGenAIClient } from '../llmClient.js';
import { STRICT_PLANNER_SYSTEM_PROMPT } from '../prompts/systemPrompts.js';
import { buildDirectJsonPrompt } from '../prompts/narrativePrompt.js';
import { validateAndMergeNarrative } from '../outputValidator.js';
import { ENV } from '../../../config/env.config.js';
import { logger } from '../../../utils/logger.js';

/**
 * PHƯƠNG ÁN 1 (KHÔNG CÓ RAG):
 * - Đưa trực tiếp Draft JSON từ Backend vào LLM.
 * - Sử dụng System Prompt ràng buộc chống hallucination.
 * - LLM đóng vai trò thuần túy diễn đạt ngôn ngữ (Language Synthesizer).
 * - Ưu điểm: Tốc độ cao, không cần vector store, chi phí tối thiểu, không bịa đặt số liệu.
 */
export class DirectJsonStrategy implements IAiNarrativeStrategy {
  readonly strategyName = 'DIRECT_JSON';

  async generateNarrative(
    draftDays: DayItinerary[],
    request: UserTripRequest,
    totalActualCost: number
  ): Promise<GeneratedPlan> {
    logger.info('[AI Strategy] Đang thực thi Phương án 1: KHÔNG CÓ RAG (Direct JSON Synthesis)');

    const prompt = buildDirectJsonPrompt(draftDays, request.preferences);
    const aiClient = getGenAIClient();

    let rawAiResponse = '';
    try {
      const response = await aiClient.models.generateContent({
        model: ENV.LLM_MODEL,
        contents: prompt,
        config: {
          systemInstruction: STRICT_PLANNER_SYSTEM_PROMPT,
          responseMimeType: 'application/json'
        }
      });
      rawAiResponse = response.text || '{}';
    } catch (error) {
      logger.error('[AI Strategy] Lỗi khi gọi Gemini API, sử dụng fallback template mặc định', error);
      rawAiResponse = JSON.stringify({
        overallSummary: `Hành trình du lịch ${request.city} ${request.days} ngày tối ưu hóa theo phân vùng địa lý.`,
        days: draftDays.map(d => ({
          dayNumber: d.dayNumber,
          title: `Ngày ${d.dayNumber}: Trải nghiệm nét đặc trưng tại ${d.zoneName}`,
          activities: d.activities.map(a => ({
            placeId: a.placeId,
            aiDescription: `Khám phá địa điểm nổi bật ${a.placeName} với thời lượng dự kiến ${a.duration} phút.`
          }))
        }))
      });
    }

    // Kiểm tra và ghép dữ liệu gốc từ DB đảm bảo an toàn tuyệt đối
    const finalDays = validateAndMergeNarrative(draftDays, rawAiResponse);

    return {
      planId: `plan_${Date.now()}`,
      city: request.city,
      totalDays: request.days,
      totalBudget: request.totalBudget,
      actualCost: totalActualCost,
      strategyUsed: this.strategyName,
      overallSummary: `Chuyến đi ${request.city} được thiết kế tối ưu theo phân vùng địa lý và ngân sách của bạn.`,
      days: finalDays
    };
  }
}
