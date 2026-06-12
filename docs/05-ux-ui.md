# 05 — UX / UI

Princípio: **UI profissional, sutil e focada na leitura.** O usuário vem estudar — a tela
deve sumir e deixar o conteúdo aparecer. Nada de cores berrantes, urgência artificial ou
poluição de features.

## Diretrizes de design

1. **Uma ação clara por tela.** Na home, só uma coisa importa: o campo “cole o link”.
2. **Cores sutis, um único acento.** Fundo neutro, muito branco/respiro, um acento calmo (índigo/violeta suave) usado com parcimônia.
3. **Tipografia para leitura.** Largura de coluna confortável (~70ch), entrelinha generosa na transcrição.
4. **Estados sempre visíveis.** Loading, progresso %, erro com mensagem humana e ação de recuperação.
5. **Honestidade na cota.** Mostrar cota restante de forma clara, sem dark patterns.
6. **Dark mode** desde cedo (estudo noturno) — mas claro é o padrão.

## Paleta (sutil) — tokens Tailwind

> Base neutra (slate/zinc) + um acento. Sugestão inicial — refinar com o nome final.

```
Fundo (light):     #FBFBFD  (quase branco, levemente frio)
Superfície:        #FFFFFF
Borda:             #E7E7EC
Texto principal:   #1A1A22
Texto secundário:  #6B7280
Acento:            #6366F1  (índigo 500, usar pouco)
Acento hover:      #4F46E5
Sucesso:           #10B981
Aviso:             #F59E0B
Erro:              #EF4444

Fundo (dark):      #0E0E12
Superfície (dark): #17171D
Texto (dark):      #ECECF1
```

- **Tipografia:** `Inter` ou `Geist` para UI; uma serifada opcional (`Source Serif` / `Lora`) só no corpo da transcrição para conforto de leitura longa (a testar).
- **Raio/sombra:** cantos suaves (`rounded-xl`), sombras leves, nada de neon.
- **Componentes:** shadcn/ui (Radix) para acessibilidade pronta (foco, teclado, aria).

## Telas principais (v1)

### 1. Home / Landing + Input (a tela mais importante)

- Headline direta: _“Cole o link do YouTube. Receba o texto para estudar.”_
- **Campo único** colando a URL + botão “Transcrever”.
- Microcopy de confiança: “Grátis. Sem cadastro para começar.”
- Abaixo: exemplos clicáveis (como o Mapify faz) para experimentar sem ter um link à mão.
- Selo honesto de cota (ex.: “Você tem 60 min hoje”), sem assustar.
- Prova social/leve (quando houver): “X transcrições feitas”.

```
┌───────────────────────────────────────────────┐
│  Audova                          [Entrar] (opc) │
│                                                 │
│        Cole o link. Pegue o texto.              │
│   Transcrição de vídeos do YouTube para estudar │
│                                                 │
│   ┌───────────────────────────────┐ ┌────────┐ │
│   │ https://youtube.com/...        │ │Transcr.│ │
│   └───────────────────────────────┘ └────────┘ │
│   Grátis · sem cadastro para começar            │
│                                                 │
│   Experimente:  [Aula X]  [Palestra Y]  [Pod Z] │
└───────────────────────────────────────────────┘
```

### 2. Processando

- Card com o vídeo identificado (thumb, título, canal, duração).
- Barra de progresso + estado textual: _baixando → transcrevendo (42%) → finalizando_.
- Botão “Cancelar”. Mensagem se for legenda pronta (“achamos as legendas, indo rápido ⚡”).

### 3. Leitura da transcrição (o coração do produto)

- Layout de leitura: coluna central confortável.
- **Toggle de timestamps**, **busca**, **copiar**.
- Timestamps clicáveis abrindo o YouTube no ponto.
- Barra de ações: **Export** (TXT / Markdown / SRT / PDF), Copiar, (logado) Salvar/Tags.
- Opcional: mini-player sincronizado (Could).

```
┌──────────────────────────────────────────────────────┐
│ ‹ voltar   Título do vídeo · canal · 23:14            │
│ [⌕ buscar]   [⏱ timestamps: on]   [Copiar] [Exportar▾]│
├──────────────────────────────────────────────────────┤
│ 00:00  Se você tem mais de 36 anos, leia esses 7...   │
│                                                        │
│ 00:11  Então pega esse bando de livro que você tem...  │
│                                                        │
│ 00:21  Porque se você tem mais de 36 anos, precisa...  │
└──────────────────────────────────────────────────────┘
```

### 4. Export (modal/drawer)

- Formato: TXT / Markdown / SRT / PDF.
- Opções: dividir por parágrafos · incluir timestamps (toggle).
- Preview do resultado (como o Transkriptor faz).

### 5. Histórico (logado — Should)

- Lista das transcrições com busca/tags; abrir, exportar, apagar.

### 6. Conta / Cota (Should)

- Cota usada/restante (claro e honesto), upgrade explícito, link de indicação.

## Onboarding

- **Sem onboarding obrigatório.** A primeira experiência é fazer uma transcrição.
- Dicas contextuais leves (tooltip) na primeira vez (export, timestamps).
- Pedir login só quando fizer sentido (acabou a cota anônima, quer salvar histórico) — nunca antes.

## Acessibilidade (RNF-08)

- Contraste AA, foco visível, navegação por teclado completa.
- A tela de leitura precisa funcionar bem em leitor de tela.
- Respeitar `prefers-reduced-motion` e `prefers-color-scheme`.

## Referências visuais

- **Mapify** acerta no clean/claro e nos “exemplos grátis” da home — inspirar sem copiar.
- **Transkriptor** acerta no editor de leitura e nas opções ricas de export — inspirar o export.
- Evitar o excesso de features de ambos na tela principal.
