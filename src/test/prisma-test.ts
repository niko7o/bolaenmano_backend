import { PrismaClient } from "@prisma/client";

// Create a separate Prisma client for testing
// This uses the same database but helps isolate test data
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://localhost:5432/test",
    },
  },
});

// Override the prisma client used in tests
export { testPrisma as prisma };
