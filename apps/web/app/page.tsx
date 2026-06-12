import { UrlForm } from "@/components/url-form";

/** Home — the single most important screen: one clear action (paste the link). */
export default function HomePage() {
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

        <p className="mt-4 text-sm text-muted">Grátis · sem cadastro para começar.</p>
      </div>
    </main>
  );
}
