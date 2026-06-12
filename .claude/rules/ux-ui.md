# Rule — UX / UI

Principle: **the UI is subtle and reading-first.** The user came to study — the chrome should
recede and let the text breathe. No loud colors, no fake urgency, no feature clutter. Full
guidance in `docs/05-ux-ui.md`.

## Design tokens (subtle palette)

```
Light  bg #FBFBFD · surface #FFFFFF · border #E7E7EC · text #1A1A22 · muted #6B7280
Accent     #6366F1 (indigo 500, used sparingly) · hover #4F46E5
State      success #10B981 · warning #F59E0B · error #EF4444
Dark   bg #0E0E12 · surface #17171D · text #ECECF1
```

- One accent color, used with restraint. Neutral base (slate/zinc), lots of whitespace.
- Type: `Inter`/`Geist` for UI; an optional serif (`Source Serif`/`Lora`) for the transcript
  body only (long-form reading comfort — to validate).
- Soft corners (`rounded-xl`), light shadows. No neon, no heavy gradients.
- Components: **shadcn/ui** (Radix) — accessibility (focus, keyboard, aria) comes for free.

## Screen rules

- **One clear action per screen.** The home is the paste-the-link field and nothing competing.
- Reading view: comfortable centered column (~70ch), generous line-height, paragraph breaks
  (never a wall of text). Timestamp toggle, in-page search, copy.
- **Always-visible states:** loading, progress %, and errors with a human message + a recovery
  action. If captions were found, say so ("achamos as legendas, indo rápido ⚡").
- **Honest quota.** Show remaining quota plainly (e.g. "Você tem 60 min hoje"). Never hide it,
  never use it to scare. Ask for login only when it genuinely helps (quota ran out, save
  history) — never before delivering value.

## Accessibility (RNF-08, WCAG 2.1 AA)

- AA contrast, visible focus, full keyboard navigation.
- The reading view must work with a screen reader.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`. Dark mode early; light default.

## Copy / tone (PT-BR)

- Direct and frictionless: "Cole o link. Pegue o texto."
- Honest about limits; calm and trustworthy. No artificial urgency, no dark patterns.
- Speak to studying (revisar, grifar, resumir), not "corporate productivity".
