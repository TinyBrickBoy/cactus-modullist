# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Ein Dockerfile fuer alles: Standalone-API + Nuxt-Website in einem Image.
# ---------------------------------------------------------------------------

# 1) Build-Stage: Nuxt-App bauen
FROM node:20-alpine AS build
WORKDIR /app

# Abhaengigkeiten zuerst (besseres Layer-Caching)
COPY package.json package-lock.json* ./
RUN npm install

# Quellcode kopieren und Nuxt bauen
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# 2) Runtime-Stage: schlankes Image mit Build-Output, API und Start-Skript
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    API_PORT=4000

# Nuxt-Server-Output, Standalone-API und Start-Skript uebernehmen
COPY --from=build /app/.output ./.output
COPY --from=build /app/api ./api
COPY --from=build /app/start.mjs ./start.mjs

# Nur der Web-Port wird nach aussen freigegeben; die API laeuft intern.
EXPOSE 3000

# Als unprivilegierter Node-User laufen
USER node

CMD ["node", "start.mjs"]
