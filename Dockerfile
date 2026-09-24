# D-WEB-27: the image for stunprex.com on the Hostinger VPS. Built on the server from the commit
# the deploy workflow sends. The `build` stage also runs the database migrations (db/migrate.mjs
# needs the full node_modules); the `run` stage is the lean standalone server. Debian slim, not
# Alpine: glibc has prebuilt binaries for the native add-ons (bufferutil, sharp) on x86 and ARM.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# bufferutil (a direct dependency of @vercel/postgres) has no prebuilt binary for every platform,
# so this stage can compile it. The tools stay here; the run stage carries only the result.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Posts, drills and pages are read from content/ at run time (lib/posts.ts, lib/drills.ts).
COPY --from=build --chown=node:node /app/content ./content
USER node
EXPOSE 3000
CMD ["node", "server.js"]
