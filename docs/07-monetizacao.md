# 07 — Monetização e Crescimento

Postura escolhida: **freemium generoso** — o oposto da dor que originou o produto. O free
precisa ser realmente útil e honesto; o pago existe para volume alto e conveniências, não
para “destravar o básico”.

## Princípios

1. **O básico é grátis de verdade.** Transcrever vídeo do YouTube para estudar nunca fica atrás de paywall.
2. **Sem cartão para começar.** Nada de “trial de 3 dias que vira cobrança”.
3. **Cota clara e honesta.** O usuário sempre sabe quanto tem e quanto usou.
4. **Vídeos longos no free.** Diferencial direto vs. Mapify (≤10 min) e cotas curtas.
5. **Upgrade é sempre ação explícita.** Zero cobrança silenciosa.

## A alavanca de custo: legendas primeiro, Whisper depois

O maior custo variável é o STT. Mitigações que tornam o free generoso **sustentável**:

- **Atalho de legendas do YouTube:** quando o vídeo já tem legendas (manuais ou automáticas), usamos elas — **custo ~zero**. Boa parte dos vídeos populares tem. (doc 03)
- **Groq é barato:** Whisper na Groq custa uma fração de centavo por minuto, então mesmo o fallback é viável.
- **Self-hosted como teto de custo:** se o volume explodir, migrar para Whisper local (`STT_PROVIDER=local`) zera o custo por minuto. A arquitetura já permite (doc 03).

> Conclusão: dá para ser generoso no free **sem** queimar caixa, porque o caso mais comum
> (vídeo com legenda) é quase grátis, e o pior caso (Groq) é barato.

## Tiers (rascunho — números a calibrar com dados reais de custo)

|                                        | **Anônimo**          | **Free (logado)**  | **Pro**                                            |
| -------------------------------------- | -------------------- | ------------------ | -------------------------------------------------- |
| Cadastro                               | Nenhum               | E-mail/Google      | E-mail/Google                                      |
| Cota                                   | ~60 min de áudio/dia | ~10 h de áudio/mês | Alta / “ilimitado justo”                           |
| Vídeos longos                          | Sim (consome cota)   | Sim                | Sim                                                |
| Export TXT/MD                          | ✅                   | ✅                 | ✅                                                 |
| Export SRT/PDF                         | ✅                   | ✅                 | ✅                                                 |
| Histórico + tags                       | ❌                   | ✅                 | ✅                                                 |
| Processamento prioritário              | ❌                   | ❌                 | ✅                                                 |
| Recursos de IA (v2: resumo/flashcards) | Amostra              | Limitado           | Pleno                                              |
| Preço                                  | R$0                  | R$0                | a definir (ex.: R$19–29/mês, **abaixo** do Mapify) |

> Os minutos são exemplos. Calibrar após medir custo real por hora (Groq + % de vídeos com
> legenda) para garantir margem mesmo no free.

## Como a cota funciona (regras)

- Cota = soma de `UsageEvent.minutes` na janela (dia p/ anônimo, mês p/ free) — doc 04.
- Anônimo é identificado por fingerprint (cookie + sinais do device) — combater abuso sem login.
- Ao estourar a cota: convite **gentil** para criar conta (ganha mais) ou indicar amigos (ganha mais ainda). Nunca um muro hostil.
- Vídeo com legenda pronta pode **consumir menos cota** (incentiva o caminho barato) — opcional.

## Programa de indicação (inspirado nos concorrentes, sem copiar)

Tanto Mapify (créditos por amigo, até 500; afiliados) quanto Transkriptor (300 min por
indicação) crescem por indicação. Faremos uma versão **simples e honesta**:

- **Link pessoal de indicação** (`/?ref=CODIGO`) — campo `User.referralCode` (doc 04).
- **Recompensa para os dois lados:** quando o convidado cria conta e faz a 1ª transcrição,
  **ambos ganham cota extra** (ex.: +5 h cada). Recompensa concreta de estudo, não “crédito” abstrato.
- **Marcos:** convidar N amigos desbloqueia benefícios (ex.: 10 → 1 mês de Pro).
- **Anti-fraude:** recompensa só após ação real (1ª transcrição), 1 por e-mail, checagem de device.
- **Compartilhamento fácil:** botões WhatsApp / X / copiar link (como nos prints dos concorrentes).

> Tela de indicação fica para a **Fase 4** (doc 06). O schema (`Referral`) já está previsto (doc 04).

## Outras alavancas de crescimento (futuro)

- **Páginas públicas de transcrição** (com consentimento) → SEO de cauda longa (“transcrição de [vídeo]”).
- **Export para Notion/Obsidian** vira boca-a-boca entre estudantes.
- **Extensão de navegador** (v2) — botão direto no YouTube, como o Mapify.

## O que NÃO faremos (anti-dark-patterns)

- ❌ Trial que vira cobrança automática.
- ❌ Esconder a cota ou o preço.
- ❌ Forçar cadastro antes de entregar valor.
- ❌ Urgência falsa / contagem regressiva enganosa.

> Essa postura **é** o marketing: num mercado cheio de paywall agressivo, ser o
> generoso e honesto é o diferencial defensável.
