FROM oven/bun:latest AS base

WORKDIR /app

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

FROM base
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json
COPY src/ ./src/
COPY index.ts ./
COPY drizzle.config.ts ./
COPY start.sh ./

RUN chmod +x start.sh
CMD ["./start.sh"]
