import { PrismaClient } from "@prisma/client";

// Singleton Prisma client.
// In dev, Next.js hot-reload would otherwise spawn many clients and exhaust
// the connection pool — cache it on globalThis.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
