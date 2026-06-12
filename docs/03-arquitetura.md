# 03 — Arquitetura

## Visão geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        Navegador (React)                          │
│   UI Next.js (App Router) · Tailwind · shadcn/ui                  │
└───────────────┬───────────────────────────────┬─────────────────┘
                │ HTTP (Server Actions / API)    │ SSE/polling (status do job)
                ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js (App Router) — web                     │
│  · Rotas/Server Actions: criar job, listar, export               │
│  · Auth (NextAuth) · Rate limit · Validação de URL               │
└───────────────┬─────────────────────────────────────────────────┘
                │ enfileira job
                ▼
        ┌───────────────┐        ┌──────────────────────────────────┐
        │  Fila (jobs)  │◄──────►│        Worker (Node)              │
        │ Postgres ou   │ pega   │ 1. Tenta legendas do YouTube      │
        │ Redis+BullMQ  │ job    │ 2. Senão: yt-dlp → ffmpeg         │
        └───────────────┘        │ 3. Chunk se grande                │
                ▲                 │ 4. STT (provider plugável)        │
                │ status/result   │ 5. Monta segmentos + persiste     │
                │                 └───────────────┬──────────────────┘
                │                                 │ chama
                ▼                                 ▼
        ┌───────────────┐         ┌───────────────────────────────────┐
        │   Postgres    │         │     STT Provider (abstração)      │
        │ users, jobs,  │         │  Groq · OpenAI · Local(faster-    │
        │ transcripts   │         │  whisper)  — escolhido por env    │
        └───────────────┘         └───────────────────────────────────┘
        ┌───────────────┐
        │ Volume/objeto │  áudio temporário (TTL curto)
        │ (disco/MinIO) │
        └───────────────┘
```

## Stack escolhida

| Camada        | Tecnologia                                                   | Por quê                                                                       |
| ------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Framework     | **Next.js 15 (App Router)** + React 19 + TypeScript          | Pedido do usuário; SSR + API no mesmo projeto                                 |
| Estilo        | **Tailwind CSS** + **shadcn/ui** (Radix)                     | Cores sutis, componentes acessíveis, rápido                                   |
| Estado/dados  | **TanStack Query** (client) + Server Actions                 | Polling de status simples e robusto                                           |
| Banco         | **PostgreSQL** + **Drizzle ORM**                             | SQL-first, leve (sem engine binária), type-safe, migrations via `drizzle-kit` |
| Fila/jobs     | **BullMQ + Redis** (prod) · fallback DB-polling (MVP)        | Jobs longos fora do request HTTP                                              |
| Auth          | **NextAuth (Auth.js)** — magic link + Google, login opcional | Freemium sem login forçado                                                    |
| Mídia         | **yt-dlp** + **ffmpeg** (no container do worker)             | Extração e normalização de áudio                                              |
| STT           | **Groq Whisper** (padrão), abstraído                         | Rápido e barato; trocável                                                     |
| Empacotamento | **Docker Compose**                                           | Pedido do usuário; paridade dev/prod                                          |
| CI            | **GitHub Actions**                                           | Pedido do usuário                                                             |

> **Por que worker separado e não tudo na rota Next.js?** Transcrição é um job longo
> (download + ffmpeg + STT). Rodar isso dentro de um request HTTP estoura timeouts e
> trava a UI. A rota só **enfileira**; o worker processa e atualiza o status.

## A peça-chave: abstração de engine de STT

Decisão do produto: **Groq por padrão, mas a estrutura precisa aceitar Whisper
self-hosted** (mesmo que a máquina atual não aguente rodar agora). Resolvemos com uma
interface única e providers intercambiáveis, selecionados por variável de ambiente.

```ts
// src/lib/stt/types.ts
export interface TranscriptSegment {
  start: number; // segundos
  end: number;
  text: string;
}

export interface TranscriptResult {
  language: string;
  segments: TranscriptSegment[];
  fullText: string;
  provider: string; // "groq" | "openai" | "local"
  durationSec: number;
}

export interface TranscribeOptions {
  language?: string; // forçar idioma; senão auto-detect
  prompt?: string; // vocabulário/contexto opcional
}

export interface SttProvider {
  readonly name: string;
  /** Recebe o caminho de um arquivo de áudio já normalizado e dentro do limite. */
  transcribe(audioPath: string, opts?: TranscribeOptions): Promise<TranscriptResult>;
  /** Limite de tamanho/duração por chamada, usado pelo chunker. */
  readonly maxFileBytes: number;
}
```

```ts
// src/lib/stt/index.ts — fábrica selecionada por env
import { GroqWhisperProvider } from "./providers/groq";
import { OpenAIWhisperProvider } from "./providers/openai";
import { LocalWhisperProvider } from "./providers/local";

export function getSttProvider(): SttProvider {
  switch (process.env.STT_PROVIDER ?? "groq") {
    case "groq":
      return new GroqWhisperProvider();
    case "openai":
      return new OpenAIWhisperProvider();
    case "local":
      return new LocalWhisperProvider(); // faster-whisper via sidecar HTTP
    default:
      throw new Error(`STT_PROVIDER inválido: ${process.env.STT_PROVIDER}`);
  }
}
```

- **GroqWhisperProvider** — chama a API de transcrição da Groq (modelo `whisper-large-v3` / `whisper-large-v3-turbo`). Limite de arquivo ~25 MB → o chunker cuida disso.
- **OpenAIWhisperProvider** — mesma interface, endpoint da OpenAI. Útil como fallback/comparação.
- **LocalWhisperProvider** — fala com um **sidecar** opcional (container `faster-whisper` expondo HTTP). Se a máquina não aguenta, o serviço fica desligado no Compose (profile `local-stt`), mas o código já existe. Trocar é só `STT_PROVIDER=local`.

> Resultado: o worker nunca sabe qual engine está usando. Migrar Groq ↔ self-hosted é
> mudar **uma variável de ambiente**.

## Pipeline de transcrição (worker)

```
1. Recebe job { source: youtubeUrl | uploadedFile, options }
2. SE for YouTube:
     2a. Tenta obter legendas oficiais/auto do vídeo (yt-dlp --write-auto-sub).
         → Se existirem e forem boas, USA ISSO (rápido, grátis) e pula o STT. *
     2b. Senão, baixa o melhor áudio (yt-dlp -f bestaudio).
3. Normaliza com ffmpeg: mono, 16 kHz, opus/mp3 (reduz tamanho ~10×).
4. SE arquivo > maxFileBytes do provider:
     divide em chunks por silêncio/tempo (ffmpeg), guardando o offset de cada chunk.
5. Para cada chunk: provider.transcribe() → segmentos.
6. Reaplica o offset de tempo aos segmentos e concatena.
7. Pós-processa: pontuação/parágrafos, monta fullText.
8. Persiste Transcript + Segments; marca job como done; emite progresso final.
9. Apaga o áudio temporário (TTL/limpeza).
```

> \* **Atalho de legendas:** muitos vídeos já têm legendas (manuais ou automáticas). Buscá-las
> primeiro corta custo e tempo drasticamente. Whisper vira o fallback de qualidade. Essa
> decisão é uma das maiores alavancas de custo do produto (ver doc 07). Configurável por flag
> caso o usuário queira forçar transcrição via Whisper.

## Progresso em tempo real

Estados do job: `queued → fetching → extracting → transcribing(%) → finalizing → done | failed`.
A UI faz **polling** (TanStack Query, intervalo curto) ou **SSE** numa rota
`/api/jobs/:id/stream`. Para o MVP, polling é mais simples e suficiente.

## Ingestão de URL e segurança

- **Validação estrita** de que a URL é do YouTube (regex de host + extração de videoId).
- **Sem SSRF:** nunca buscar URLs arbitrárias do lado servidor sem allowlist de host.
- **Rate limit** por IP/fingerprint (ex.: `@upstash/ratelimit` ou Redis) antes de enfileirar.
- **Tamanho/duração máx.** por job conforme o tier (cota).

## Estrutura de pastas proposta (monorepo simples)

```
audova/
├─ apps/
│  ├─ web/                 # Next.js (UI + API/Server Actions)
│  └─ worker/              # processo Node que consome a fila
├─ packages/
│  ├─ stt/                 # abstração + providers (groq/openai/local)
│  ├─ db/                  # schema Drizzle + client compartilhado
│  └─ shared/              # tipos, validação (zod), utils
├─ services/
│  └─ local-whisper/       # sidecar faster-whisper (profile opcional)
├─ docker-compose.yml
├─ docker-compose.local-stt.yml
├─ .github/workflows/ci.yml
└─ docs/
```

> Para o MVP pode-se começar **sem monorepo** (tudo dentro de um app Next.js + um script
> de worker), e extrair os pacotes quando a complexidade pedir. A interface de STT (doc
> acima) deve existir desde o dia 1, independentemente da estrutura de pastas.

## Variáveis de ambiente (rascunho)

```env
# Engine de transcrição
STT_PROVIDER=groq            # groq | openai | local
GROQ_API_KEY=...
OPENAI_API_KEY=...
LOCAL_WHISPER_URL=http://local-whisper:9000

# Infra
DATABASE_URL=postgres://...
REDIS_URL=redis://...         # opcional no MVP
AUDIO_TMP_DIR=/data/audio
AUDIO_TTL_HOURS=24

# Auth
NEXTAUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

# Cotas (ver doc 07)
QUOTA_ANON_MIN_PER_DAY=60
QUOTA_FREE_MIN_PER_MONTH=600
```
