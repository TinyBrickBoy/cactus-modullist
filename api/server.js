#!/usr/bin/env node
/**
 * Cactus Dependents API
 * ---------------------
 * Komplette API in einer Datei, ohne externe Abhaengigkeiten.
 *
 * Listet alle Modrinth-Projekte, die von der Cactus Mod (NV8eFz7D) abhaengen.
 * Projekte vom Typ "mod" werden in der Ausgabe als "addon" bezeichnet.
 *
 * Start:
 *   node server.js
 *   PORT=8080 node server.js
 *
 * Endpoints:
 *   GET /          -> Kurz-Doku (JSON)
 *   GET /all       -> Addons + Modpacks zusammen (paginiert)
 *   GET /addons    -> nur Addons (intern Typ "mod")
 *   GET /modpacks  -> nur Modpacks
 *
 * Query-Parameter (auf allen Listen-Routen):
 *   ?version=1.21.1          -> auf eine Minecraft-Version filtern
 *   ?sort=popular|newest|az  -> Sortierung (Default: popular)
 *   ?page=1                  -> Seite, 1-basiert        (nur /all)
 *   ?items=20                -> Seitengroesse, 1..1000  (nur /all)
 */

"use strict";

const http = require("node:http");

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

const config = {
  port: Number(process.env.PORT) || 3000,
  targetId: "NV8eFz7D", // Cactus Mod
  apiBase: "https://api.modrinth.com/v3",
  // Eindeutiger User-Agent ist Pflicht, sonst blockt Modrinth den Traffic.
  userAgent: "modrinth-cactus-api/1.0 (tbb@onthepixel.net)",
  cacheTtlMs: 5 * 60 * 1000, // 5 Minuten
  pageSize: { default: 20, max: 1000 },
};

const targetUrl = `https://modrinth.com/project/${config.targetId}`;

// ---------------------------------------------------------------------------
// Modrinth-Abfrage
// ---------------------------------------------------------------------------

/** Fuehrt einen GET-Request gegen die Modrinth-API aus und respektiert Rate-Limits. */
async function apiGet(path, params = {}) {
  const url = new URL(config.apiBase + path);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  while (true) {
    const res = await fetch(url, { headers: { "User-Agent": config.userAgent } });

    if (res.status === 429) {
      const reset = Number(res.headers.get("X-Ratelimit-Reset") || "10");
      await sleep((reset + 1) * 1000);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} bei ${path}: ${body.slice(0, 200)}`);
    }

    return res.json();
  }
}

/**
 * Holt alle Dependents (optional auf eine MC-Version gefiltert) und bringt sie
 * in die Ausgabeform. Der Typ "mod" wird dabei zu "addon" umbenannt.
 */
async function loadDependents(gameVersion) {
  const facets = [[`dependency_project_ids:${config.targetId}`]];
  if (gameVersion) facets.push([`game_versions:${gameVersion}`]);

  const limit = 100;
  let offset = 0;
  let total = null;
  const results = [];

  while (total === null || offset < total) {
    const data = await apiGet("/search", {
      facets: JSON.stringify(facets),
      limit,
      offset,
    });

    if (total === null) total = data.total_hits;
    if (!data.hits.length) break;

    for (const hit of data.hits) {
      results.push(toProject(hit));
    }
    offset += limit;
  }

  return results;
}

/** Wandelt einen Modrinth-Suchtreffer in das API-Ausgabeformat um. */
function toProject(hit) {
  const types = hit.project_types || [];
  return {
    id: hit.project_id,
    slug: hit.slug,
    title: hit.name || hit.slug,
    type: types.includes("modpack") ? "modpack" : "addon",
    tags: [...new Set(hit.categories || [])],
    versions: hit.game_versions || [],
    downloads: hit.downloads || 0,
    created: hit.date_created || null,
    author: hit.author,
    summary: hit.summary || "",
    link: `https://modrinth.com/project/${hit.slug}`,
  };
}

// ---------------------------------------------------------------------------
// Cache (pro Version)
// ---------------------------------------------------------------------------

const cache = new Map(); // versionKey -> { at, hits }

async function getHits(gameVersion) {
  const key = gameVersion || "*";
  const cached = cache.get(key);

  if (cached && Date.now() - cached.at < config.cacheTtlMs) {
    return cached.hits;
  }

  const hits = await loadDependents(gameVersion);
  cache.set(key, { at: Date.now(), hits });
  return hits;
}

// ---------------------------------------------------------------------------
// Sortierung & Pagination
// ---------------------------------------------------------------------------

/** Sortiert nach popular (Default) | newest | az. */
function sortList(list, sort) {
  const arr = [...list];

  switch (sort) {
    case "newest":
      return arr.sort((a, b) =>
        String(b.created || "").localeCompare(String(a.created || ""))
      );
    case "az":
      return arr.sort((a, b) =>
        String(a.title || "").localeCompare(String(b.title || ""), undefined, {
          sensitivity: "base",
        })
      );
    default: // popular
      return arr.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  }
}

/** Begrenzt einen Integer auf [min, max] und faellt bei Unsinn auf fallback zurueck. */
function clampInt(value, { min, max, fallback }) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < min) return fallback;
  return max != null && n > max ? max : n;
}

// ---------------------------------------------------------------------------
// HTTP-Hilfen
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body, null, 2));
}

const target = { id: config.targetId, link: targetUrl };

// ---------------------------------------------------------------------------
// Routen
// ---------------------------------------------------------------------------

function handleIndex(res) {
  return sendJson(res, 200, {
    name: "cactus-dependents-api",
    target,
    endpoints: ["/all", "/addons", "/modpacks"],
    query: {
      version: "?version=1.21.1",
      sort: "?sort=popular | newest | az",
      pagination: "?page=1&items=20  (items max 1000, nur /all)",
    },
    note: "type 'mod' wird als 'addon' ausgegeben",
  });
}

async function handleList(res, path, searchParams) {
  const version = searchParams.get("version") || null;
  const sort = searchParams.get("sort") || "popular";

  let hits = await getHits(version);
  if (path === "/addons") hits = hits.filter((h) => h.type === "addon");
  else if (path === "/modpacks") hits = hits.filter((h) => h.type === "modpack");
  hits = sortList(hits, sort);

  // /addons und /modpacks: vollstaendige Liste ohne Pagination
  if (path !== "/all") {
    return sendJson(res, 200, {
      target,
      version,
      sort,
      count: hits.length,
      results: hits,
    });
  }

  // /all: paginiert
  const items = clampInt(searchParams.get("items"), {
    min: 1,
    max: config.pageSize.max,
    fallback: config.pageSize.default,
  });
  const page = clampInt(searchParams.get("page"), { min: 1, fallback: 1 });

  const total = hits.length;
  const totalPages = Math.max(1, Math.ceil(total / items));
  const start = (page - 1) * items;

  return sendJson(res, 200, {
    target,
    version,
    sort,
    page,
    items,
    total,
    total_pages: totalPages,
    results: hits.slice(start, start + items),
  });
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host}`);
  } catch {
    return sendJson(res, 400, { error: "bad request" });
  }

  const { pathname } = url;

  if (pathname === "/") {
    return handleIndex(res);
  }

  if (pathname === "/all" || pathname === "/addons" || pathname === "/modpacks") {
    try {
      return await handleList(res, pathname, url.searchParams);
    } catch (err) {
      return sendJson(res, 502, { error: err.message });
    }
  }

  return sendJson(res, 404, {
    error: "not found",
    endpoints: ["/all", "/addons", "/modpacks"],
  });
});

server.listen(config.port, () => {
  console.log(`API laeuft auf http://localhost:${config.port}`);
  console.log(`  /all?sort=popular&page=1&items=20`);
  console.log(`  /addons   /modpacks   (jeweils mit ?version= & ?sort=)`);
});
