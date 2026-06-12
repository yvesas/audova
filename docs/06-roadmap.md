# 06 — Roadmap

Entrega incremental. Cada fase termina em algo **usável e demonstrável**. Sem datas fixas
(produto pessoal); a ordem importa mais que o calendário.

---

## Fase 0 — Fundação (esqueleto)

**Meta:** repositório de pé, rodando em Docker, com CI verde.

- [ ] Scaffold Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- [ ] Drizzle (`drizzle-orm` + `drizzle-kit`) + Postgres no Docker Compose.
- [ ] Definir a interface `SttProvider` e o stub dos 3 providers (doc 03).
- [ ] `Dockerfile` (web) + `Dockerfile` (worker) + `docker-compose.yml`.
- [ ] GitHub Actions: lint + typecheck + build + test (doc 08).
- [ ] `.env.example` com todas as variáveis.

**Pronto quando:** `docker compose up` sobe web + db; CI passa no primeiro PR.

---

## Fase 1 — MVP de transcrição (o coração)

**Meta:** colar link do YouTube → ver o texto. Resolve a dor.

- [ ] Worker: `yt-dlp` baixa áudio + `ffmpeg` normaliza.
- [ ] Atalho de legendas do YouTube (usa se existir; senão, STT).
- [ ] `GroqWhisperProvider` funcional (transcrição real).
- [ ] Chunking de áudios longos com reaplicação de offset de timestamps.
- [ ] Fila de jobs (DB-polling no MVP) + estados de progresso.
- [ ] Tela Home (input único) → Processando (progresso) → Leitura.
- [ ] Tela de leitura: parágrafos, timestamps com toggle, copiar.
- [ ] Uso **anônimo** com cota por sessão (sem login).

**Pronto quando:** um vídeo qualquer do YouTube vira texto legível, sem login.

---

## Fase 2 — Export e polimento

**Meta:** o estudante leva o texto para onde estuda.

- [ ] Export TXT + Markdown (RF-30/31).
- [ ] Export SRT + PDF (RF-32/33).
- [ ] Opções de export: dividir por parágrafos, timestamps on/off + preview.
- [ ] Busca dentro da transcrição (RF-24).
- [ ] Timestamp clicável abre o YouTube no ponto (RF-22).
- [ ] Tratamento de erros humanizado (vídeo privado, sem áudio, etc.).
- [ ] Dark mode.

**Pronto quando:** dá pra exportar em 4 formatos com qualidade.

---

## Fase 3 — Conta, histórico e cota

**Meta:** quem quiser mais, cria conta — opcionalmente.

- [ ] Auth (NextAuth: magic link + Google).
- [ ] Migrar transcrições da sessão anônima para a conta ao logar.
- [ ] Histórico + tags (RF-42/45).
- [ ] Cálculo e exibição de cota (anônimo/dia, free/mês) — honesto (RF-43).
- [ ] Upload de arquivo local (RF-09).
- [ ] Apagar transcrição / apagar conta (LGPD, RF-44).

**Pronto quando:** login é opcional e agrega valor (histórico + mais cota).

---

## Fase 4 — Crescimento

**Meta:** distribuição orgânica.

- [ ] Programa de indicação (link próprio → mais cota; doc 07).
- [ ] Compartilhar transcrição por link público read-only (RF-61).
- [ ] SEO: páginas públicas de transcrições (com consentimento) atraem busca.
- [ ] Onboarding leve e e-mail transacional.

---

## Fase 5 — Hardening & CD

**Meta:** confiável o suficiente para crescer.

- [ ] Migrar fila para BullMQ + Redis (escala horizontal de workers).
- [ ] Observabilidade: logs estruturados, métricas de fila/erro, alertas.
- [ ] Rate limiting robusto + anti-abuso.
- [ ] Pipeline de **CD** (deploy automático) — ver doc 08.
- [ ] Testes de carga e custo por hora monitorado.

---

## v2 — Estudo com IA (pós-validação)

Só depois que a transcrição estiver sólida e tiver tração:

- [ ] Resumo automático + pontos-chave (RF-50/51).
- [ ] Flashcards / perguntas de revisão (RF-52).
- [ ] Chat com a transcrição (RF-53).
- [ ] Avaliar mapas mentais (competir com Mapify) — decisão estratégica.
- [ ] Extensão de navegador (botão no YouTube).

---

## Backlog priorizado (resumo)

| Prioridade           | Itens               |
| -------------------- | ------------------- |
| **Agora (P0)**       | Fase 0 + Fase 1     |
| **Próximo (P1)**     | Fase 2 (export)     |
| **Depois (P2)**      | Fase 3 (conta/cota) |
| **Crescimento (P3)** | Fase 4              |
| **Quando escalar**   | Fase 5              |
| **Futuro**           | v2 (IA)             |

## Definição de pronto (DoD) por item

- Código revisado, typecheck/lint/test passando no CI.
- Funciona em `docker compose up` limpo.
- Estados de loading/erro tratados.
- Sem segredo commitado; variáveis no `.env.example`.
