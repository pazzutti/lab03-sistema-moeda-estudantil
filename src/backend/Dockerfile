# syntax=docker/dockerfile:1
# Imagem slim (glibc) para usar os binarios pre-compilados de bcrypt e better-sqlite3.

# ---- Build ----
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Dependencias de producao ----
FROM node:24-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Runtime ----
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Banco SQLite fica em /app/data; monte um volume ali para persistir os dados.
ENV DB_DATABASE=/app/data/moeda.sqlite

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
RUN mkdir -p /app/data && chown node:node /app/data

USER node
# Sem instrucao VOLUME: o Railway nao aceita. Monte o volume externamente
# (Railway Volume ou docker-compose) em /app/data.
EXPOSE 3000
CMD ["node", "dist/main.js"]
