import { GoogleGenAI } from '@google/genai';
import { ENV } from '../../config/env.config.js';
import { logger } from '../../utils/logger.js';

let aiInstance: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI {
  if (!aiInstance) {
    if (!ENV.GEMINI_API_KEY) {
      logger.warn('CẢNH BÁO: Chưa thiết lập GEMINI_API_KEY trong file .env');
    }
    aiInstance = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY || 'MOCK_KEY' });
  }
  return aiInstance;
}
