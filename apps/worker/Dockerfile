# Worker image — needs yt-dlp + ffmpeg (system deps of the transcription pipeline).
FROM node:20-bookworm-slim AS base
WORKDIR /app
# System deps: ffmpeg for audio normalization, yt-dlp for YouTube extraction.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 ca-certificates wget \
  && wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/stt/package.json packages/stt/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

# ---- runtime ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN useradd -m worker && chown -R worker:worker /app
USER worker
CMD ["npm", "run", "start", "-w", "@audova/worker"]
