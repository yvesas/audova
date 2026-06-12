# 08 — DevOps: Docker, CI e (depois) CD

Pedido do usuário: **montar em Docker** desde já, iniciar com **CI no GitHub**, e pensar
em **CD num momento posterior**.

## Docker

Dois serviços de aplicação (web e worker) + dependências (Postgres, opcionalmente Redis e o
sidecar de Whisper local).

### `docker-compose.yml` (dev) — esboço

```yaml
services:
  web:
    build: { context: ., dockerfile: apps/web/Dockerfile }
    env_file: .env
    ports: ["3000:3000"]
    depends_on: [db]
    volumes: ["audio:/data/audio"]

  worker:
    build: { context: ., dockerfile: apps/worker/Dockerfile }
    env_file: .env
    depends_on: [db]
    volumes: ["audio:/data/audio"] # compartilha o áudio temporário com a web

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: audova
      POSTGRES_PASSWORD: audova
      POSTGRES_DB: audova
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  # opcional (Fase 5): fila robusta
  # redis:
  #   image: redis:7-alpine
  #   ports: ["6379:6379"]

volumes:
  pgdata:
  audio:
```

### Whisper local como profile opcional — `docker-compose.local-stt.yml`

```yaml
services:
  local-whisper:
    image: onerahmet/openai-whisper-asr-webservice # ou imagem própria com faster-whisper
    environment:
      ASR_MODEL: small # ajustar ao que a máquina aguenta
      ASR_ENGINE: faster_whisper
    ports: ["9000:9000"]
    profiles: ["local-stt"] # só sobe com: docker compose --profile local-stt up
```

> Com `STT_PROVIDER=groq` (padrão), o sidecar nem sobe. Para testar self-hosted:
> `docker compose --profile local-stt up` + `STT_PROVIDER=local`. **Zero mudança de código.**

### Dockerfiles

- **web:** build Next.js standalone (`output: 'standalone'`), imagem final enxuta (node:alpine).
- **worker:** node:alpine + **`yt-dlp` e `ffmpeg` instalados** (são dependências de sistema do pipeline).
- Multi-stage (deps → build → runtime) e usuário não-root.

## CI — GitHub Actions (desde o início)

`.github/workflows/ci.yml` — roda em cada push/PR:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:

jobs:
  build-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: test }
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready" --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: "npm" }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run db:migrate # drizzle-kit migrate
        env: { DATABASE_URL: postgres://postgres:postgres@localhost:5432/test }
      - run: npm run test
      - run: npm run build

  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - name: Build images (sem push)
        run: docker compose build
```

**Gates de CI:** lint + typecheck + testes + build + build das imagens Docker. PR só
mergeia com tudo verde.

### Qualidade de código (suporte ao CI)

- ESLint + Prettier.
- TypeScript em `strict`.
- Husky + lint-staged (pre-commit) para feedback rápido local.
- Conventional Commits (ajuda changelog/release depois).

## CD — depois (Fase 5)

Quando o produto amadurecer, adicionar deploy automático:

1. **Registry:** publicar imagens (GitHub Container Registry / Docker Hub) on tag/release.
2. **Migrations:** rodar `drizzle-kit migrate` no deploy, com cuidado (job separado).
3. **Ambientes:** staging → produção, com aprovação manual para prod.
4. **Hospedagem (opções a avaliar):**
   - **Simples:** uma VPS com Docker Compose + reverse proxy (Caddy/Traefik) + TLS automático.
   - **Gerenciado:** Railway / Render / Fly.io (web + worker + Postgres gerenciado).
   - **Web na Vercel + worker/DB à parte:** a Vercel não roda o worker longo nem yt-dlp/ffmpeg bem em serverless → worker fica em VPS/Railway. Avaliar essa divisão.
5. **Segredos:** GitHub Environments / secret manager do provedor — nunca no repo.
6. **Healthchecks + rollback** automático em falha.

## Segredos e configuração

- `.env.example` versionado (sem valores reais); `.env` no `.gitignore`.
- Em CI/CD: segredos via GitHub Secrets / Environments.
- Chaves sensíveis: `GROQ_API_KEY`, `OPENAI_API_KEY`, `NEXTAUTH_SECRET`, OAuth Google, `DATABASE_URL`.

## Backups e dados (quando em produção)

- Backup periódico do Postgres (transcrições são o ativo do usuário).
- Áudio é efêmero (TTL) — não precisa backup.
- Política de retenção/deleção alinhada à LGPD (doc 02, RNF-06).
