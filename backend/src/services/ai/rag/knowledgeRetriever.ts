import { globalVectorStore } from './vectorStore.js';
import { generateEmbedding } from './embedder.js';
import { PlaceEntity } from '../../../types/plan.types.js';
import { logger } from '../../../utils/logger.js';

export class KnowledgeRetriever {
  /**
   * Truy xuất tri thức cẩm nang liên quan đến danh sách địa điểm đã được Backend chọn
   */
  async retrieveContextForPlaces(places: PlaceEntity[]): Promise<string[]> {
    logger.info(`[RAG Retriever] Đang truy xuất tri thức bổ trợ cho ${places.length} địa điểm`);
    const contexts: string[] = [];

    for (const place of places) {
      // 1. Kiểm tra trực tiếp theo placeId
      const exactDocs = globalVectorStore.findKnowledgeByPlaceId(place.id);
      if (exactDocs.length > 0) {
        contexts.push(
          `[CẨM NANG ĐỊA ĐIỂM: ${place.name}]:\n${exactDocs.map(d => `- ${d.title}: ${d.content}`).join('\n')}`
        );
        continue;
      }

      // 2. Nếu chưa có exact match, truy xuất qua Semantic Search (Vector Embedding)
      const query = `Kinh nghiệm du lịch, lưu ý ẩm thực và văn hóa tại ${place.name} ${place.city}`;
      const queryVec = await generateEmbedding(query);
      const topDocs = globalVectorStore.similaritySearch(queryVec, 2);

      if (topDocs.length > 0) {
        contexts.push(
          `[GỢI Ý DU LỊCH CHO: ${place.name}]:\n${topDocs.map(d => `- ${d.title}: ${d.content}`).join('\n')}`
        );
      }
    }

    return contexts;
  }
}

export const knowledgeRetriever = new KnowledgeRetriever();
