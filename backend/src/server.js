import app from './app.js';
import { ENV } from './config/env.config.js';
import { logger } from './utils/logger.js';

const PORT = ENV.PORT;

app.listen(PORT, () => {
  logger.info(`🚀 GeoZone AI Server đang chạy tại http://localhost:${PORT}`);
  logger.info(`📌 Chế độ AI mặc định: ${ENV.AI_STRATEGY} (RAG Enabled: ${ENV.ENABLE_RAG})`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
});
