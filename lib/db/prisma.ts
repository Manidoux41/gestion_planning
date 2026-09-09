import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaPool: Pool | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
  const pool = new Pool({ connectionString, max: 5 });
  const adapter = new PrismaPg(pool);
  return { client: new PrismaClient({ adapter }), pool };
}

const resources = globalThis.prisma && globalThis.prismaPool
  ? { client: globalThis.prisma, pool: globalThis.prismaPool }
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = resources.client;
  globalThis.prismaPool = resources.pool;
}

export const prisma = resources.client;
