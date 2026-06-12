# Audova — Planejamento do Produto

> **Nome do produto:** **Audova** (definido — derivado de "áudio"). Histórico da escolha e checagens em [`01-branding-nomes.md`](./01-branding-nomes.md).
> ⚠️ Pendência: confirmar domínio (`audova.com`/`.app`/`.ai`) e marca (INPI/USPTO) no registrador antes do lançamento.

**A dor que originou o produto:** conseguir a transcrição do áudio de um vídeo do YouTube
para usar como material de estudo depois — sem limites agressivos, sem paywall logo de
cara e sem sign-up forçado.

Os concorrentes analisados (Mapify e Transkriptor) resolvem isso, mas escondem a
transcrição atrás de créditos, planos pagos e cadastro. Nossa aposta é o oposto:
**transcrição rápida, limpa e generosamente gratuita, focada em quem estuda.**

## Como navegar estes documentos

| #   | Documento                                   | O que contém                                                     |
| --- | ------------------------------------------- | ---------------------------------------------------------------- |
| 00  | [visao.md](./00-visao.md)                   | Problema, posicionamento, diferenciais, análise dos concorrentes |
| 01  | [branding-nomes.md](./01-branding-nomes.md) | Sugestões de nome + identidade verbal                            |
| 02  | [requisitos.md](./02-requisitos.md)         | Requisitos funcionais e não-funcionais (MoSCoW)                  |
| 03  | [arquitetura.md](./03-arquitetura.md)       | Stack, pipeline de transcrição, abstração de engine (Groq/local) |
| 04  | [modelo-dados.md](./04-modelo-dados.md)     | Schema do banco e entidades                                      |
| 05  | [ux-ui.md](./05-ux-ui.md)                   | Design system, paleta sutil, telas principais                    |
| 06  | [roadmap.md](./06-roadmap.md)               | Fases, marcos e backlog priorizado                               |
| 07  | [monetizacao.md](./07-monetizacao.md)       | Freemium, cotas e programa de indicação                          |
| 08  | [devops-ci-cd.md](./08-devops-ci-cd.md)     | Docker, GitHub Actions (CI agora, CD depois)                     |

## Decisões já tomadas

- **Escopo da v1 (MVP):** transcrição pura (link do YouTube → texto + timestamps + export). Resumo/estudo e mapas mentais ficam para v2+.
- **Engine de transcrição:** Groq Whisper como padrão, com uma camada de abstração que permite trocar por OpenAI Whisper ou Whisper self-hosted (faster-whisper) sem mexer no resto do sistema.
- **Monetização:** freemium generoso — free real e útil, sem cartão; pago só para volume alto / recursos avançados.
- **Stack:** Next.js (App Router) + React + Tailwind + TypeScript, com **Drizzle ORM** sobre Postgres (mais leve que Prisma). Worker separado para os jobs de transcrição. Tudo em Docker.
- **CI:** GitHub Actions desde o início. CD num momento posterior.

## Estado atual

Fase de **planejamento**. Nenhum código de aplicação foi escrito ainda — apenas estes
documentos. Próximo passo sugerido: validar o nome (doc 01) e dar o "go" no scaffold da
fase 1 do [roadmap](./06-roadmap.md).
