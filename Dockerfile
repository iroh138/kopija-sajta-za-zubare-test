# Production image: Astro (Node standalone) + SQLite. Data lives in the /data volume.
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Build tools only used if no prebuilt better-sqlite3 binary is available.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Baked into the static pages (canonical URLs, sitemap, privacy text, analytics):
ARG SITE_URL
ARG REQUEST_RETENTION_DAYS=90
ARG PUBLIC_GTM_ID=
ENV SITE_URL=$SITE_URL REQUEST_RETENTION_DAYS=$REQUEST_RETENTION_DAYS PUBLIC_GTM_ID=$PUBLIC_GTM_ID
RUN test -n "$SITE_URL" || (echo "Build arg SITE_URL is required, e.g. https://www.3adent.rs" && exit 1)
RUN npm run build && node scripts/check-site.mjs && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321 DATA_DIR=/data
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts/backup.mjs ./scripts/backup.mjs
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4321/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server/entry.mjs"]
