#!/usr/bin/env node
/**
 * Start-Skript fuer den gemeinsamen Container.
 *
 * Startet zwei Prozesse in einem Container:
 *   1. die Standalone-API (api/server.js) auf API_PORT (Default 4000)
 *   2. den Nuxt/Nitro-Server (.output/server/index.mjs) auf PORT (Default 3000)
 *
 * Nitro proxyt eingehende /api/**-Anfragen an die interne API weiter.
 * Beendet sich ein Prozess, wird der andere ebenfalls gestoppt.
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
    console.error(`[start] ${name} beendet (code=${code}, signal=${signal}) -> stoppe Container`);
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

// 1) Standalone-API
run("api", "node", ["api/server.js"], { PORT: API_PORT });

// 2) Nuxt-Server (Proxy-Ziel zeigt auf die interne API)
run("web", "node", [".output/server/index.mjs"], {
  PORT: WEB_PORT,
  NUXT_API_ORIGIN: process.env.NUXT_API_ORIGIN || `http://127.0.0.1:${API_PORT}`,
});

console.log(`[start] API auf :${API_PORT}, Web auf :${WEB_PORT}`);
