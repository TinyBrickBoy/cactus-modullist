# Cactus Addons &amp; Modpacks

Nuxt-Website **+** API für alle Modrinth-Projekte, die von der
[Cactus Mod](https://modrinth.com/project/NV8eFz7D) abhängen.
Projekte vom Typ `mod` werden als **addon** ausgegeben.

## Aufbau

```
.
├── api/server.js          # Standalone-API (Node, ohne Abhaengigkeiten)
├── server/routes/api/     # Nitro-Proxy: /api/** -> interne API
├── pages/index.vue        # Website (Tabs, Filter, Pagination)
├── components/            # Header, Footer, ProjectCard
├── start.mjs              # startet API + Web in einem Container
└── Dockerfile             # ein Image fuer alles
```

Die API bleibt ein **eigener Prozess**. Die Nuxt-App spricht sie über den
Pfad `/api/**` an; der Nitro-Server proxyt diese Anfragen intern weiter.

## Entwicklung

```bash
npm install

# Terminal 1 – Standalone-API (Port 4000)
PORT=4000 npm run api

# Terminal 2 – Nuxt-Website (Port 3000)
npm run dev
```

Die Website ist dann unter <http://localhost:3000> erreichbar.

## Docker (alles in einem)

```bash
docker build -t cactus-modullist .
docker run -p 3000:3000 cactus-modullist
```

Im Container laufen API (intern, Port 4000) und Web (Port 3000) gemeinsam.
Nur der Web-Port wird freigegeben.

### Konfiguration

| ENV               | Default                 | Beschreibung                          |
| ----------------- | ----------------------- | ------------------------------------- |
| `PORT`            | `3000`                  | Web-Port (nach aussen)                |
| `API_PORT`        | `4000`                  | interner API-Port                     |
| `NUXT_API_ORIGIN` | `http://127.0.0.1:4000` | Proxy-Ziel des Nitro-Servers          |

## API-Endpoints

| Route       | Beschreibung                          |
| ----------- | ------------------------------------- |
| `GET /`     | Kurz-Doku (JSON)                      |
| `/all`      | Addons + Modpacks zusammen (paginiert)|
| `/addons`   | nur Addons                            |
| `/modpacks` | nur Modpacks                          |

**Query-Parameter** (alle Listen-Routen):

- `?version=1.21.1` – auf eine Minecraft-Version filtern
- `?sort=popular|newest|az` – Sortierung (Default `popular`)
- `?page=1&items=20` – Pagination (nur `/all`, `items` max. 1000)

Über die Website wird die API unter `/api/...` angesprochen, z. B.
`GET /api/all?sort=newest&page=2`.
