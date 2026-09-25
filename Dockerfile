# Production image for self-hosting (e.g. Contabo VPS). Vercel does not use this file.
# Build:  docker build -t ai-with-hamad --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain.com \
#           --build-arg NEXT_PUBLIC_SUPABASE_URL=... --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... .
# NEXT_PUBLIC_* values are inlined at build time; server secrets are passed at runtime (docker compose env_file).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_ALLOW_INDEXING=true
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_ALLOW_INDEXING=$NEXT_PUBLIC_ALLOW_INDEXING \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    BUILD_STANDALONE=1 \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
