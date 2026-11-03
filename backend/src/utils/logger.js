export const logger = {
  info: (msg, meta) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta ? meta : '');
  },
  warn: (msg, meta) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta ? meta : '');
  },
  error: (msg, error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error ? error : '');
  }
};
