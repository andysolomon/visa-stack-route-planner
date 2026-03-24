import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Provision Neon via `vercel integration add neon` then run `vercel env pull .env.local`"
  );
}

const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });
