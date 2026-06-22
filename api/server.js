#!/usr/bin/env node
/**
 * Cactus Dependents API
 * ---------------------
 * A complete API in a single file, with no external dependencies.
 *
 * Lists every Modrinth project that depends on the Cactus Mod (NV8eFz7D).
 * Projects of type "mod" are reported as "addon" in the output.
 *
 * Start:
 *   node server.js
 *   PORT=8080 node server.js
 *
 * Endpoints:
 *   GET /          -> short docs (JSON)
 *   GET /all       -> addons + modpacks combined (paginated)
 *   GET /addons    -> addons only (internally type "mod")
 *   GET /modpacks  -> modpacks only
 *   GET /versions  -> available Minecraft versions among the dependents
 *
 * Query parameters (on every list route):
 *   ?version=1.21.1          -> filter by a Minecraft version
 *   ?sort=popular|newest|az  -> sorting (default: popular)
 *   ?page=1                  -> page, 1-based        (/all only)
 *   ?items=20                -> page size, 1..1000   (/all only)
 */

"use strict";

const http = require("node:http");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const config = {
  port: Number(process.env.PORT) || 3000,
  targetId: "NV8eFz7D", // Cactus Mod
  apiBase: "https://api.modrinth.com/v3",
  // A unique User-Agent is required, otherwise Modrinth blocks the traffic.
  userAgent: "modrinth-cactus-api/1.0 (tbb@onthepixel.net)",
  cacheTtlMs: 5 * 60 * 1000, // 5 minutes
  pageSize: { default: 20, max: 1000 },
};

const targetUrl = `https://modrinth.com/project/${config.targetId}`;

// ---------------------------------------------------------------------------
// Modrinth requests
// ---------------------------------------------------------------------------

/** Performs a GET request against the Modrinth API and respects rate limits. */
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
      throw new Error(`HTTP ${res.status} at ${path}: ${body.slice(0, 200)}`);
    }

    return res.json();
  }
}

/**
 * Fetches all dependents (optionally filtered by a single MC version) and maps
 * them into the output shape. The type "mod" is renamed to "addon".
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

/** Maps a Modrinth search hit into the API output format. */
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
// Cache (per version)
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
// Sorting, pagination & versions
// ---------------------------------------------------------------------------

/** Sorts by popular (default) | newest | az. */
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

/** Clamps an integer to [min, max], falling back on invalid input. */
function clampInt(value, { min, max, fallback }) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < min) return fallback;
  return max != null && n > max ? max : n;
}

/** Compares two release versions like "1.21.1" numerically, descending. */
function compareVersionsDesc(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pb[i] || 0) - (pa[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Collects the unique release Minecraft versions across all dependents. */
async function collectVersions() {
  const hits = await getHits(null);
  const set = new Set();
  for (const hit of hits) {
    for (const v of hit.versions) {
      if (/^\d+\.\d+(\.\d+)?$/.test(v)) set.add(v); // releases only, no snapshots
    }
  }
  return [...set].sort(compareVersionsDesc);
}

// ---------------------------------------------------------------------------
// HTTP helpers
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
// Routes
// ---------------------------------------------------------------------------

function handleIndex(res) {
  return sendJson(res, 200, {
    name: "cactus-dependents-api",
    target,
    endpoints: ["/all", "/addons", "/modpacks", "/versions"],
    query: {
      version: "?version=1.21.1",
      sort: "?sort=popular | newest | az",
      pagination: "?page=1&items=20  (items max 1000, /all only)",
    },
    note: "type 'mod' is reported as 'addon'",
  });
}

async function handleVersions(res) {
  const versions = await collectVersions();
  return sendJson(res, 200, { target, count: versions.length, versions });
}

async function handleList(res, path, searchParams) {
  const version = searchParams.get("version") || null;
  const sort = searchParams.get("sort") || "popular";

  let hits = await getHits(version);
  if (path === "/addons") hits = hits.filter((h) => h.type === "addon");
  else if (path === "/modpacks") hits = hits.filter((h) => h.type === "modpack");
  hits = sortList(hits, sort);

  // /addons and /modpacks: full list without pagination
  if (path !== "/all") {
    return sendJson(res, 200, {
      target,
      version,
      sort,
      count: hits.length,
      results: hits,
    });
  }

  // /all: paginated
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

  try {
    if (pathname === "/versions") {
      return await handleVersions(res);
    }
    if (pathname === "/all" || pathname === "/addons" || pathname === "/modpacks") {
      return await handleList(res, pathname, url.searchParams);
    }
  } catch (err) {
    return sendJson(res, 502, { error: err.message });
  }

  return sendJson(res, 404, {
    error: "not found",
    endpoints: ["/all", "/addons", "/modpacks", "/versions"],
  });
});

server.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
  console.log(`  /all?sort=popular&page=1&items=20`);
  console.log(`  /addons   /modpacks   /versions   (each with ?version= & ?sort=)`);
});
