import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
    console.log('[Prisma] Client disconnected gracefully.');
    process.exit(0);
  } catch (error) {
    console.error('[Prisma] Error during disconnection:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default prisma;
export { prisma };
