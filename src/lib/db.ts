import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL11}`;

const pool = new Pool({
  connectionString,
 
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

export { db };
