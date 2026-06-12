# 02 — Requisitos

Priorização por **MoSCoW**: **Must** (essencial p/ a v1), **Should** (importante, v1 se
couber), **Could** (desejável, v2+), **Won't** (fora de escopo agora).

---

## Requisitos funcionais

### RF — Entrada e transcrição (core)

| ID    | Requisito                                                                               | Prioridade |
| ----- | --------------------------------------------------------------------------------------- | ---------- |
| RF-01 | Colar uma URL do YouTube e iniciar a transcrição                                        | **Must**   |
| RF-02 | Validar a URL (vídeo existe, é público, tem áudio) e dar erro claro                     | **Must**   |
| RF-03 | Extrair o áudio do vídeo (yt-dlp) e normalizar (ffmpeg)                                 | **Must**   |
| RF-04 | Transcrever o áudio em texto via engine plugável (Groq por padrão)                      | **Must**   |
| RF-05 | Suportar vídeos longos (chunking automático do áudio)                                   | **Must**   |
| RF-06 | Mostrar progresso do job em tempo quase real (fila → baixando → transcrevendo → pronto) | **Must**   |
| RF-07 | Detecção automática do idioma do áudio                                                  | **Should** |
| RF-08 | Escolher idioma de saída / forçar idioma de entrada                                     | **Could**  |
| RF-09 | Upload de arquivo de áudio/vídeo local (mp3, mp4, m4a, wav)                             | **Should** |
| RF-10 | Colar outras fontes (link direto de áudio/podcast)                                      | **Could**  |

### RF — Resultado e leitura

| ID    | Requisito                                                 | Prioridade |
| ----- | --------------------------------------------------------- | ---------- |
| RF-20 | Exibir a transcrição em layout de leitura confortável     | **Must**   |
| RF-21 | Timestamps por segmento, com toggle para mostrar/ocultar  | **Must**   |
| RF-22 | Clicar no timestamp abre o vídeo no YouTube naquele ponto | **Should** |
| RF-23 | Player/transcrição sincronizados (destacar trecho atual)  | **Could**  |
| RF-24 | Busca dentro da transcrição                               | **Should** |
| RF-25 | Copiar tudo / copiar trecho selecionado                   | **Must**   |
| RF-26 | Quebra em parágrafos legíveis (não “muro de texto”)       | **Must**   |

### RF — Export

| ID    | Requisito                                           | Prioridade |
| ----- | --------------------------------------------------- | ---------- |
| RF-30 | Export TXT                                          | **Must**   |
| RF-31 | Export Markdown (amigável a Obsidian/Notion)        | **Must**   |
| RF-32 | Export SRT (legendas, com timestamps)               | **Should** |
| RF-33 | Export PDF                                          | **Should** |
| RF-34 | Opções de divisão: parágrafo único / por parágrafos | **Should** |
| RF-35 | Incluir/ocultar timestamps no arquivo exportado     | **Should** |
| RF-36 | Export DOC/CSV                                      | **Could**  |

### RF — Conta, histórico e cota

| ID    | Requisito                                                                         | Prioridade |
| ----- | --------------------------------------------------------------------------------- | ---------- |
| RF-40 | Usar **sem login** (uso anônimo) com cota por dispositivo/IP                      | **Must**   |
| RF-41 | Cadastro opcional (magic link por e-mail e/ou Google) para cota maior + histórico | **Should** |
| RF-42 | Histórico das transcrições do usuário logado                                      | **Should** |
| RF-43 | Exibir cota restante de forma clara e honesta                                     | **Must**   |
| RF-44 | Apagar uma transcrição / apagar conta (LGPD)                                      | **Should** |
| RF-45 | Tags/organização das transcrições                                                 | **Could**  |

### RF — Estudo com IA (v2 — fora da v1)

| ID    | Requisito                                          | Prioridade     |
| ----- | -------------------------------------------------- | -------------- |
| RF-50 | Resumo automático da transcrição                   | **Could**      |
| RF-51 | Pontos-chave / tópicos                             | **Could**      |
| RF-52 | Flashcards / perguntas de revisão                  | **Could**      |
| RF-53 | Chat com a transcrição (“pergunte qualquer coisa”) | **Could**      |
| RF-54 | Mapa mental visual                                 | **Won't** (v1) |

### RF — Crescimento

| ID    | Requisito                                                   | Prioridade     |
| ----- | ----------------------------------------------------------- | -------------- |
| RF-60 | Programa de indicação (link próprio → mais cota p/ os dois) | **Should**     |
| RF-61 | Compartilhar transcrição por link público (read-only)       | **Could**      |
| RF-62 | Extensão de navegador (botão na página do YouTube)          | **Won't** (v1) |

---

## Requisitos não-funcionais

| ID     | Requisito                                                                                  | Alvo                |
| ------ | ------------------------------------------------------------------------------------------ | ------------------- |
| RNF-01 | **Desempenho:** transcrição de vídeo de 10 min concluída em ~1–2 min (Groq é rápido)       | p95 < 2× duração/10 |
| RNF-02 | **Responsividade da UI:** carregar e responder rápido, com estados de loading claros       | LCP < 2,5s          |
| RNF-03 | **Confiabilidade:** jobs com retry e idempotência; falha não perde a cota do usuário       | retry ≥ 2           |
| RNF-04 | **Escalabilidade:** worker(s) horizontalmente escaláveis via fila                          | —                   |
| RNF-05 | **Custo:** custo de transcrição por hora de áudio monitorado e previsível                  | < US$0,10/h (Groq)  |
| RNF-06 | **Privacidade/LGPD:** dados do usuário deletáveis; áudio temporário apagado após processar | áudio TTL ≤ 24h     |
| RNF-07 | **Segurança:** rate limiting, validação de input, sem SSRF na ingestão de URLs             | —                   |
| RNF-08 | **Acessibilidade:** contraste AA, navegação por teclado, leitor de tela na tela de leitura | WCAG 2.1 AA         |
| RNF-09 | **i18n:** UI em PT-BR primeiro, arquitetada para EN depois                                 | —                   |
| RNF-10 | **Observabilidade:** logs estruturados, métricas de fila e de erro                         | —                   |
| RNF-11 | **Portabilidade:** roda 100% em Docker (dev e prod)                                        | —                   |
| RNF-12 | **Manutenibilidade:** engine de STT trocável sem tocar no resto (ver doc 03)               | —                   |

---

## Regras de negócio iniciais (rascunho — refinar no doc 07)

- **RN-01:** Anônimo tem cota menor (ex.: 60 min de áudio/dia) que o logado.
- **RN-02:** Vídeos longos são permitidos no free (diferencial vs. concorrentes), mas consomem a cota proporcionalmente.
- **RN-03:** Nada de cobrança automática silenciosa. Upgrade é sempre ação explícita.
- **RN-04:** Áudio bruto é descartado após a transcrição concluir; só o texto persiste.

## Riscos e questões em aberto

- **Legal/ToS do YouTube:** extração de áudio fica em zona cinzenta. Mitigar com rate limit, uso pessoal/estudo, e avaliar caminho oficial (legendas do YouTube quando existirem, como atalho barato).
- **Atalho de legendas:** muitos vídeos já têm legendas/auto-captions. Buscá-las primeiro (rápido e grátis) e cair para Whisper só quando não houver — **economia enorme**. (Ver doc 03.)
- **Abuso/custo:** sem login, alguém pode abusar. Mitigar com fingerprint + IP + rate limit + (opcional) verificação leve.
