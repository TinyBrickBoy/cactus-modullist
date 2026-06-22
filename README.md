# Cactusmod Addons and Modpacks

A Nuxt website **+** API for every Modrinth project that depends on the
[Cactus Mod](https://modrinth.com/project/NV8eFz7D).
Projects of type `mod` are reported as **addon**.

## Layout

```
.
├── api/server.js          # standalone API (Node, no dependencies)
├── server/routes/api/     # Nitro proxy: /api/** -> internal API
├── pages/index.vue        # website (tabs, filters, pagination)
├── components/            # header, footer, project card
├── start.mjs              # runs API + web in one container
└── Dockerfile             # one image for everything
```

The API stays a **separate process**. The Nuxt app talks to it through the
`/api/**` path; the Nitro server proxies those requests onwards.

## Development

```bash
npm install

# Terminal 1 – standalone API (port 4000)
PORT=4000 npm run api

# Terminal 2 – Nuxt website (port 3000)
npm run dev
```

The website is then available at <http://localhost:3000>.

## Docker (everything in one)

```bash
docker build -t cactus-modullist .
docker run -p 3000:3000 cactus-modullist
```

Inside the container the API (internal, port 4000) and the web server
(port 3000) run together. Only the web port is exposed.

### Configuration

| ENV               | Default                 | Description                  |
| ----------------- | ----------------------- | ---------------------------- |
| `PORT`            | `3000`                  | web port (exposed)           |
| `API_PORT`        | `4000`                  | internal API port            |
| `NUXT_API_ORIGIN` | `http://127.0.0.1:4000` | Nitro server's proxy target  |

## API endpoints

| Route       | Description                              |
| ----------- | ---------------------------------------- |
| `GET /`     | short docs (JSON)                        |
| `/all`      | addons + modpacks combined (paginated)   |
| `/addons`   | addons only                              |
| `/modpacks` | modpacks only                            |
| `/versions` | available Minecraft versions (dropdown)  |

**Query parameters** (all list routes):

- `?version=1.21.1` – filter by a Minecraft version
- `?sort=popular|newest|az` – sorting (default `popular`)
- `?page=1&items=20` – pagination (`/all` only, `items` max 1000)

From the website the API is reached under `/api/...`, e.g.
`GET /api/all?sort=newest&page=2`.
