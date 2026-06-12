# 00 — Visão do Produto

## O problema (a dor real)

Você quis transcrever o áudio de um vídeo do YouTube para estudar depois. Ao procurar
ferramentas, esbarrou no mesmo padrão em todas:

1. **Limite de uso baixo** logo de cara (ex.: 5 vídeos, ≤10 min cada).
2. **Cobrança rápida** depois do limite (trial de 3 dias → R$59,99/mês).
3. **Sign-up obrigatório** (e-mail) só para experimentar.

O resultado é fricção alta para uma tarefa que deveria ser simples: _“cola o link, me dá
o texto.”_

## A proposta

Um produto **focado em transcrição de áudio/vídeo para estudo**, com:

- **Foco no core:** colar o link → receber o texto, com timestamps e export. Sem desvios.
- **Generosidade real no free:** sem cartão, sem trial enganoso, com cota mensal útil e vídeos longos permitidos.
- **UX/UI profissional e sutil:** cores suaves, tipografia clara, foco na leitura — feito para quem vai _estudar_ o texto, não só gerar e descartar.
- **Export amigável a estudo:** TXT, Markdown, PDF e SRT, com opção de dividir por parágrafos e incluir/ocultar timestamps.

> **Posicionamento em uma frase:**
> _“Cole o link do YouTube e tenha a transcrição limpa para estudar — de graça, sem pegadinha.”_

## Para quem (público-alvo)

- **Estudantes e autodidatas** que consomem aulas, palestras e podcasts no YouTube e querem o texto para revisar, grifar e fazer resumos.
- **Criadores de conteúdo** que querem reaproveitar a fala em posts/artigos.
- **Profissionais** que preferem ler a assistir (acessibilidade, velocidade).

## Análise dos concorrentes

### Mapify (mapify.so) — “Resumidor de Mapas Mentais com IA”

- **Core:** transforma YouTube, PDF/Doc, URLs, podcasts, áudio, e-mails, imagens e gravações de reunião em **mapas mentais**.
- **Features:** transcrição automática, timestamps clicáveis, “Pergunte Qualquer Coisa” (chat IA com busca web), Deep Research, expandir ramos, editar/personalizar, export (imagem/PDF/Markdown), Tags, organização “My Maps”.
- **Distribuição:** extensão de navegador + apps iOS/Android. #3 no Product Hunt, 4.8/5 na App Store, “5M+ usuários”.
- **Modelos:** “Imediato” vs “Poderoso”; complexidade Conciso/Médio/Detalhado; 30+ idiomas.
- **Free:** 5 vídeos YouTube (≤10 min), 40 créditos. **Pro:** $0 por 3 dias → R$59,99/mês (R$719,88/ano).
- **Indicação:** cada amigo = 10 créditos para os dois (até 500); 10 amigos = Pro; 50 amigos = programa de afiliados com comissão.

### Transkriptor (transkriptor.com) — foco em **transcrição**

- **Core:** transcrição de reuniões, áudio, vídeo e YouTube. Tema escuro.
- **Features:** bot que entra em reuniões para gravar/transcrever, integração de calendário (Google/Outlook), identificação de oradores, vocabulário customizado, base de conhecimento, anotações, chat IA com a transcrição, análise de dados.
- **Export rico:** PDF, DOC, TXT, SRT, CSV, MP3/MP4; dividir por parágrafos ou por orador; timestamps e etiquetas de orador toggle.
- **Free:** 300 minutos grátis (ao conectar calendário ou via indicação).
- **Onboarding personalizado:** pergunta idioma, setor, cargo, tamanho de equipe, canal de origem.
- **Indicação:** convide amigos → eles ganham 300 minutos grátis.

### Onde eles deixam brechas (nossa oportunidade)

| Brecha do concorrente                                                                  | Nossa resposta                                                             |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Transcrição é meio para o produto deles (mapa mental / reunião corporativa), não o fim | Transcrição **é** o produto; otimizamos cada detalhe dela                  |
| Free pequeno e paywall agressivo                                                       | Free generoso, sem cartão                                                  |
| Sign-up forçado para experimentar                                                      | Permitir uso **anônimo** com cota; conta só para ter mais cota e histórico |
| Transkriptor é B2B/reuniões; Mapify é “tudo para todos”                                | Nicho claro: **estudo a partir do YouTube**                                |
| UI carregada de features                                                               | UI sutil, focada na leitura                                                |

## Diferenciais que vamos perseguir

1. **Zero fricção no primeiro uso** — colar link e ver texto sem login.
2. **Generosidade transparente** — a cota é clara e honesta; nada de “3 dias e te cobro”.
3. **Leitura de qualidade** — tipografia e layout pensados para estudar, não só para gerar.
4. **Export que respeita o estudante** — Markdown/Obsidian/Notion-friendly.
5. **Privacidade** — não revendemos dados; transcrições são suas.

## O que explicitamente **não** somos (anti-escopo da v1)

- Não somos ferramenta de reunião/bot de calendário (território do Transkriptor).
- Não geramos mapas mentais na v1 (território do Mapify — avaliar para v2+).
- Não fazemos tradução/dublagem nem edição de vídeo.

## Métrica-norte (North Star)

**Transcrições concluídas e exportadas/copiadas por usuário ativo por semana** — mede se a
ferramenta está de fato resolvendo a dor de estudo, não só gerando cadastros.
