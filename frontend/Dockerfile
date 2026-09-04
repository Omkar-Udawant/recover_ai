# Frontend Dockerfile
FROM node:22-alpine AS base

# Enable Corepack and pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json ./
# The Next.js native Linux binary is large enough for registry downloads to
# intermittently time out on slower connections. Retry with a longer timeout.
RUN pnpm config set fetch-timeout 300000 \
    && pnpm config set fetch-retries 5 \
    && pnpm config set fetch-retry-factor 2 \
    && pnpm install --ignore-scripts

# Development / Runtime stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

# Run Next directly to bypass pnpm's ERR_PNPM_IGNORED_BUILDS deps check
# (sharp postinstall is intentionally skipped; Next falls back without it).
CMD ["./node_modules/.bin/next", "dev"]
