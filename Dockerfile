# syntax=docker/dockerfile:1

##########  base: install dependencies  ##########
# Debian slim (glibc) avoids musl issues with Tailwind v4's native oxide/lightningcss binaries.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json ./
# No package-lock.json in the repo, so `npm ci` is not usable here.
RUN npm install --no-audit --no-fund

##########  dev: vite dev server with HMR  ##########
FROM node:22-bookworm-slim AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

##########  builder: produce static bundle  ##########
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

##########  prod: nginx serving the static bundle  ##########
FROM nginx:1.27-alpine AS prod
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
