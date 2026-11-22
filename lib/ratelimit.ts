// Fixed-window rate limiter backed by Postgres, so the limit holds across serverless
// instances (an in-memory Map would reset on every cold start / differ per instance).
// One atomic UPSERT per call.

import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Db, Tx } from "@/lib/db/client";

export const hashKey = (v: string): string => createHash("sha256").update(v).digest("hex").slice(0, 32);

/** Count one hit on `key`. `ok` is false once more than `limit` hits land inside `windowSeconds`. */
export async function consume(
  conn: Db | Tx, key: string, limit: number, windowSeconds: number,
): Promise<{ ok: boolean; count: number; retryAfterSeconds: number }> {
  const res = await conn.execute(sql`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE rate_limits.window_start END,
      count        = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN 1     ELSE rate_limits.count + 1 END
    RETURNING count, GREATEST(1, ceil(extract(epoch FROM (window_start + make_interval(secs => ${windowSeconds}) - now()))))::int AS retry
  `);
  const row = res.rows[0] as { count: number; retry: number };
  return { ok: row.count <= limit, count: row.count, retryAfterSeconds: row.retry };
}

/** Best-effort client IP behind Vercel / a proxy. */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
