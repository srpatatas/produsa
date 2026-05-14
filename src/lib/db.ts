import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let cachedDb: NeonQueryFunction<false, false> | null = null;

export function getDb() {
  if (!cachedDb) {
    cachedDb = neon(process.env.DATABASE_URL!);
  }
  return cachedDb;
}
