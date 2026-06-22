#!/usr/bin/env node
/**
 * Start script for the shared container.
 *
 * Runs two processes in a single container:
 *   1. the standalone API (api/server.js) on API_PORT (default 4000)
 *   2. the Nuxt/Nitro server (.output/server/index.mjs) on PORT (default 3000)
 *
 * Nitro proxies incoming /api/** requests onwards to the internal API.
 * If one process exits, the other is stopped as well.
 */

import { spawn } from "node:child_process";

const API_PORT = process.env.API_PORT || "4000";
const WEB_PORT = process.env.PORT || "3000";

const children = [];
let shuttingDown = false;

function run(name, command, args, env) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`[start] ${name} exited (code=${code}, signal=${signal}) -> stopping container`);
    shutdown(code ?? 1);
  });

  children.push(child);
  return child;
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

// 1) Standalone API
run("api", "node", ["api/server.js"], { PORT: API_PORT });

// 2) Nuxt server (proxy target points at the internal API)
run("web", "node", [".output/server/index.mjs"], {
  PORT: WEB_PORT,
  NUXT_API_ORIGIN: process.env.NUXT_API_ORIGIN || `http://127.0.0.1:${API_PORT}`,
});

console.log(`[start] API on :${API_PORT}, web on :${WEB_PORT}`);
