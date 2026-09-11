# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# SNCF CMS — Payload 3.88 on Next.js 16, self-hosted.
#
# Two runnable targets come out of this file and they exist for a measured
# reason:
#
#   runner — the deployed admin. Next's standalone output, 516 MB image.
#   cli    — runs `payload migrate` and the build-time content export.
#            Needs the FULL 693 MB node_modules; 1.42 GB image.
#
# They cannot be one image. Next's file tracing builds `runner`'s node_modules
# from the server bundle's imports, and the migration CLI is not in that graph.
# Verified against this project's own build output:
#
#   • .next/standalone/node_modules/payload/ contains `dist` and nothing else —
#     no bin.js, so `payload migrate` has no entrypoint.
#   • tsx is absent entirely, and payload's CLI transpiles the TypeScript
#     config and migrations through it.
#   • drizzle-kit, which the Postgres adapter uses to diff and apply schema, is
#     EXPLICITLY excluded — withPayload sets
#     outputFileTracingExcludes: { '**/*': ['drizzle-kit', 'drizzle-kit/api'] }.
#
# Hand-copying those three back in would mean guessing at a transitive closure
# Payload deliberately pruned, and the guess would break on a patch bump. So
# migrations run from a stage that still has real node_modules, as a one-shot
# container that exits before the admin starts. See docker-compose.yml.
#
# The alternative — ship the whole install and run `migrate && start` as the
# CMD — also works and is simpler to read. It was not taken because it trades a
# 516 MB image for a 1.4 GB one, and because a migration in the CMD runs under
# `restart: unless-stopped`: a migration that fails is then retried forever
# instead of stopping the deploy. Here a failed migration leaves the previous
# container serving.
#
# Debian slim (glibc), not alpine: sharp's prebuilt libvips binaries are
# glibc-linked, and the musl path silently falls back to a slower build or
# fails outright.
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=22-bookworm-slim


##########  deps — the install, shared by every stage below  ##################
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# .npmrc carries legacy-peer-deps=true, which this dependency set needs; npm
# reads it from the working directory, so it must land before install.
COPY package.json package-lock.json .npmrc ./

# `npm ci` — the lockfile is committed, so the image gets the exact tree that
# was tested rather than whatever resolves today.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --no-audit --no-fund


##########  builder — next build  ############################################
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# No PAYLOAD_SECRET and no DATABASE_URI here on purpose: `next build` for this
# config reaches no database. Every Payload route is dynamic (ƒ) and the only
# prerendered page is /_not-found, so the build completes with Postgres
# switched off — which is what lets CI build the image with no service
# container, and means no placeholder credential has to exist at all.
#
# NODE_ENV=production is still required, because payload.config.ts keys
# `push: process.env.NODE_ENV !== 'production'` off it. Building as anything
# else would compile an admin that tries to auto-sync the schema at boot and
# quietly diverge from the migrations.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


##########  cli — one-shot schema migration and content export  ##############
# Deliberately keeps the whole install and the TypeScript sources: migrations
# and scripts ship as .ts and payload's CLI transpiles them through tsx at run
# time. No .next here — this stage never serves a request.
#
# It hosts the content export too (`payload run scripts/export-content.ts`).
# That script uses Payload's LOCAL API, which needs a database connection and
# no HTTP server at all — verified: `payload run` against DATABASE_URI alone
# reads collections with the admin stopped.
FROM node:${NODE_VERSION} AS cli
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY package.json .npmrc tsconfig.json next.config.ts ./
COPY src ./src
COPY scripts ./scripts
COPY seed ./seed

# payload's config lookup walks tsconfig's @payload-config path first; naming
# the file outright removes that inference and any dependence on cwd.
ENV PAYLOAD_CONFIG_PATH=/app/src/payload.config.ts

# Defaults to root so the migration can run unencumbered; it only talks to
# Postgres and writes nothing. The export service overrides `user:` in compose
# because that one DOES write files, into a bind-mounted working tree.
#
# The binary directly, not `npx payload` — npx prints npm's update-notifier
# banner, and deploy logs are read when something has gone wrong, so noise
# above the actual error costs real time.
CMD ["./node_modules/.bin/payload", "migrate"]


##########  runner — the deployed admin  #####################################
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# curl is here for the container healthcheck. Next's standalone server bundles
# no shell client, and a healthcheck that cannot run reports "starting"
# forever, which blocks anything waiting on service_healthy.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

# Next's own unprivileged user convention. The admin accepts uploads from the
# internet; it should not be able to write outside its own tree.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# server.js plus the traced node_modules. Flat at /app rather than nested under
# /app/backend because the build context is backend/ alone — with no parent
# lockfile in the image, Next resolves the workspace root to WORKDIR. (Outside
# Docker the repo's root package-lock.json makes it nest; next.config.ts pins
# the root so a host build and this one agree.)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Belt and braces against a leaked build-time .env. .dockerignore should have
# kept one out of the context, but standalone copies .env into its output, and
# a stray secret in an image layer is not a mistake worth risking twice.
RUN rm -f /app/.env /app/.env.production /app/.env.local

# The upload directory Media.staticDir points at. Created here so the volume
# mounts onto a path that already belongs to nextjs — a bind mount over a
# missing directory is created root-owned and uploads then fail with EACCES.
RUN mkdir -p /app/media && chown nextjs:nodejs /app/media

USER nextjs
EXPOSE 3001

# /api/access is Payload's own endpoint and answers 200 to an anonymous caller,
# so it proves the server booted AND that the database answered — a plain TCP
# check would call a CMS with a dead Postgres healthy.
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3001/api/access -o /dev/null || exit 1

CMD ["node", "server.js"]
