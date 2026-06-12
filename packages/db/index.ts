import { PrismaClient } from "@prisma/client";

// Singleton pattern — reuse one PrismaClient across hot-reloads in dev
// and across module imports in production.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Verifies the DATABASE_URL is set and the DB is reachable.
 * Call this once at startup — mirrors the old connectToDatabase(mongoUri) API.
 */
export const connectToDatabase = async (databaseUrl: string): Promise<void> => {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  // Run a lightweight query to verify the connection
  await prisma.$queryRaw`SELECT 1`;
};

// Re-export Prisma-generated types so callers don't need to import from @prisma/client directly
export type { User, Workflow, Execution } from "@prisma/client";
export { WorkflowStatus, ExecutionStatus } from "@prisma/client";