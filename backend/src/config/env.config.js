import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Auth / Dual-Token Security (Chuẩn Velora)
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || '893ed1911d358510bf890306d257e4b1a780ec4541cfa19dbcde402775810615',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || '06dd15db16ffde70578328fc6743e2ad2488bef8d1cbb90accbfba65386b18e8',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  // AI Configuration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  LLM_MODEL: process.env.LLM_MODEL || 'gemini-2.5-flash',
  AI_STRATEGY: process.env.AI_STRATEGY || 'DIRECT_JSON',
  ENABLE_RAG: process.env.ENABLE_RAG === 'true'
};
