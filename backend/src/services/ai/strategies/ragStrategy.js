import { BaseAiNarrativeStrategy } from './ilpStrategy.js';
import { getGenAIClient } from '../llmClient.js';
import { RAG_ENRICHED_SYSTEM_PROMPT } from '../prompts/systemPrompts.js';
import { buildRagEnrichedPrompt } from '../prompts/narrativePrompt.js';
import { knowledgeRetriever } from '../rag/knowledgeRetriever.js';
import { validateAndMergeNarrative } from '../outputValidator.js';
import { ENV } from '../../../config/env.config.js';
import { logger } from '../../../utils/logger.js';

/**
 * PHƯƠNG ÁN 2 (CÓ RAG - Hybrid Knowledge-Augmented Generation):
 * - Backend chọn danh sách địa điểm theo Zone + Ràng buộc.
 * - Module Knowledge Retriever truy xuất các mẩu cẩm nang văn hóa, lưu ý ẩm thực, tips thực tế.
 * - Prompt được Augment thêm tri thức ngữ cảnh.
 * - LLM sinh ra lịch trình giàu chiều sâu (có travel tips, lưu ý trang phục, món ăn chuẩn vị...).
 * - Dữ liệu cốt lõi (ID, giá tiền, giờ giấc) vẫn được Backend hậu kiểm khóa cứng.
 */
export class RagStrategy extends BaseAiNarrativeStrategy {
  constructor() {
    super('RAG_AUGMENTED');
  }

  async generateNarrative(draftDays, request, totalActualCost) {
    logger.info('[AI Strategy] Đang thực thi Phương án 2: CÓ RAG (Hybrid Knowledge Augmented)');

    // Tập hợp toàn bộ places xuất hiện trong lịch trình
    const placesInPlan = draftDays.flatMap(d =>
      d.activities.map(a => ({
        id: a.placeId,
        name: a.placeName,
        city: request.city,
        zoneId: a.zoneId,
        estimatedCost: a.estimatedCost,
        duration: a.duration,
        popularity: 1,
        tags: []
      }))
    );

    // Bước RAG: Truy xuất tri thức bổ trợ từ Vector/Document Store
    const retrievedContexts = await knowledgeRetriever.retrieveContextForPlaces(placesInPlan);

    const prompt = buildRagEnrichedPrompt(draftDays, request.preferences, retrievedContexts);
    const aiClient = getGenAIClient();

    let rawAiResponse = '';
    try {
      const response = await aiClient.models.generateContent({
        model: ENV.LLM_MODEL,
        contents: prompt,
        config: {
          systemInstruction: RAG_ENRICHED_SYSTEM_PROMPT,
          responseMimeType: 'application/json'
        }
      });
      rawAiResponse = response.text || '{}';
    } catch (error) {
      logger.error('[AI Strategy] Lỗi khi gọi Gemini RAG, fallback sang template giàu thông tin', error);
      rawAiResponse = JSON.stringify({
        overallSummary: `Hành trình cẩm nang du lịch ${request.city} ${request.days} ngày kết hợp phân vùng địa lý và tri thức bản địa.`,
        days: draftDays.map(d => ({
          dayNumber: d.dayNumber,
          title: `Ngày ${d.dayNumber}: Trải nghiệm sâu sắc văn hóa và cảnh quan ${d.zoneName}`,
          activities: d.activities.map(a => ({
            placeId: a.placeId,
            aiDescription: `Trải nghiệm điểm đến đặc sắc ${a.placeName}.`,
            aiTravelTip: `Mẹo trải nghiệm: Nên ghé vào lúc thời tiết mát mẻ và chuẩn bị trang phục phù hợp.`
          }))
        }))
      });
    }

    // Kiểm tra và bảo vệ tính toàn vẹn dữ liệu
    const finalDays = validateAndMergeNarrative(draftDays, rawAiResponse);

    return {
      planId: `plan_rag_${Date.now()}`,
      city: request.city,
      totalDays: request.days,
      totalBudget: request.totalBudget,
      actualCost: totalActualCost,
      strategyUsed: this.strategyName,
      overallSummary: `Hành trình du lịch ${request.city} được làm giàu bằng cẩm nang thực tế và phân vùng hợp lý.`,
      days: finalDays
    };
  }
}
