import { getServerEnv } from "@audova/shared";
import { UrlForm } from "@/components/url-form";
import { getAnonSessionId } from "@/lib/session";
import { getAnonQuota } from "@/lib/quota";

// Reads the visitor's quota per request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionId = await getAnonSessionId();
  const quota = sessionId ? await getAnonQuota(sessionId) : null;
  const remaining = quota?.remainingMinutes ?? getServerEnv().QUOTA_ANON_MIN_PER_DAY;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16">
      <header className="absolute left-6 top-6 text-sm font-semibold tracking-tight">Audova</header>

      <div className="w-full text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Cole o link. Pegue o texto.
        </h1>
        <p className="mt-4 text-pretty text-base text-muted">
          Transcrição de vídeos do YouTube para estudar — limpa, com timestamps e export.
        </p>

        <div className="mt-8">
          <UrlForm />
        </div>

        <p className="mt-4 text-sm text-muted">
          Grátis · sem cadastro para começar. Você tem {remaining} min hoje.
        </p>
      </div>
    </main>
  );
}
