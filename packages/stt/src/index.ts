import type { SttProvider } from "./types";
import { GroqWhisperProvider } from "./providers/groq";
import { OpenAIWhisperProvider } from "./providers/openai";
import { LocalWhisperProvider } from "./providers/local";

export * from "./types";
export { GroqWhisperProvider, OpenAIWhisperProvider, LocalWhisperProvider };

export type SttProviderName = "groq" | "openai" | "local";

/**
 * Factory selected by env. This switch is the ONE place that knows about concrete engines.
 * Keep the default branch exhaustive (`never`) so a new provider name must be handled.
 */
export function getSttProvider(name: string = process.env.STT_PROVIDER ?? "groq"): SttProvider {
  switch (name as SttProviderName) {
    case "groq":
      return new GroqWhisperProvider();
    case "openai":
      return new OpenAIWhisperProvider();
    case "local":
      return new LocalWhisperProvider();
    default: {
      const _exhaustive: never = name as never;
      throw new Error(`Invalid STT_PROVIDER: ${String(_exhaustive)}`);
    }
  }
}
