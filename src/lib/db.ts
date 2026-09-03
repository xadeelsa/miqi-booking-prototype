import { PrismaClient } from "@prisma/client";

// Single PrismaClient instance across hot reloads in dev.
// Without this, Next.js fast-refresh would open a new pool on every reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
