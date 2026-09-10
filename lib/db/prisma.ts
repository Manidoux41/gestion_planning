import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { Pool } from "pg";

// Sécurité redondante : garantit le fuseau du Cambodge (UTC+7) même si next.config.ts
// n'est pas exécuté par la fonction serverless (ex. Vercel).
process.env.TZ = "Asia/Phnom_Penh";

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

function getPrismaClient(): PrismaClient {
  if (globalThis.prisma) return globalThis.prisma;
  const resources = createPrismaClient();
  globalThis.prisma = resources.client;
  globalThis.prismaPool = resources.pool;
  return resources.client;
}

// Instanciation paresseuse : la collecte des pages au build ne dispose pas de DATABASE_URL.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

