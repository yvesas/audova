import "server-only";
import { and, eq, gte, sum } from "drizzle-orm";
import { getDb, usageEvents } from "@audova/db";
import { getServerEnv } from "@audova/shared";

export interface Quota {
  usedMinutes: number;
  limitMinutes: number;
  remainingMinutes: number;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Anonymous quota = sum of usage minutes since midnight, against the daily limit (honest). */
export async function getAnonQuota(anonSessionId: string): Promise<Quota> {
  const env = getServerEnv();
  const db = getDb();
  const rows = await db
    .select({ total: sum(usageEvents.minutes) })
    .from(usageEvents)
    .where(
      and(eq(usageEvents.anonSessionId, anonSessionId), gte(usageEvents.createdAt, startOfToday())),
    );

  const used = Number(rows[0]?.total ?? 0);
  const limit = env.QUOTA_ANON_MIN_PER_DAY;
  return {
    usedMinutes: Math.round(used),
    limitMinutes: limit,
    remainingMinutes: Math.max(0, Math.round(limit - used)),
  };
}
