import { z } from "zod";

/**
 * Typed, validated environment. Parse once at the boundary instead of reading raw process.env
 * deep in the code. Call getServerEnv() from server/worker code only (never the client bundle).
 * See .claude/rules/typescript-and-conventions.md
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // STT engine selection (the abstraction's single switch)
  STT_PROVIDER: z.enum(["groq", "openai", "local"]).default("groq"),
  GROQ_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  LOCAL_WHISPER_URL: z.string().url().optional(),

  // Infra
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  AUDIO_TMP_DIR: z.string().default("/data/audio"),
  AUDIO_TTL_HOURS: z.coerce.number().int().positive().default(24),

  // Quotas (see docs/07-monetizacao.md)
  QUOTA_ANON_MIN_PER_DAY: z.coerce.number().int().positive().default(60),
  QUOTA_FREE_MIN_PER_MONTH: z.coerce.number().int().positive().default(600),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
  }
  cached = parsed.data;
  return cached;
}
