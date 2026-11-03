import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// API versioning prefix
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
