import { PrismaClient } from '@prisma/client';

// Khởi tạo instance kết nối Prisma Client dùng chung
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});
