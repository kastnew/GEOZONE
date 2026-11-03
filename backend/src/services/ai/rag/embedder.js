import { getGenAIClient } from '../llmClient.js';
import { logger } from '../../../utils/logger.js';

/**
 * Module sinh vector embedding cho văn bản (dùng text-embedding-004 hoặc fallback)
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function generateEmbedding(text) {
  try {
    const aiClient = getGenAIClient();
    const response = await aiClient.models.embedContent({
      model: 'text-embedding-004',
      contents: text
    });
    return response.embedding?.values || [];
  } catch (error) {
    logger.warn('[RAG Embedder] Không thể sinh embedding qua API, fallback vector giả lập', error);
    // Trả về vector mô phỏng kích thước 768 nếu chạy offline/test
    return new Array(768).fill(0).map(() => Math.random() - 0.5);
  }
}
