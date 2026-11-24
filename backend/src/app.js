import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { ENV } from './config/env.config.js';

const app = express();
const allowedOrigins = new Set(
  ENV.FRONTEND_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins.has(origin));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API versioning prefix
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
