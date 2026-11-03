import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  LLM_MODEL: process.env.LLM_MODEL || 'gemini-2.5-flash',
  AI_STRATEGY: (process.env.AI_STRATEGY || 'DIRECT_JSON') as 'DIRECT_JSON' | 'RAG_AUGMENTED',
  ENABLE_RAG: process.env.ENABLE_RAG === 'true'
};
