#!/usr/bin/env node
/**
 * Build Cloudflare static upload package into /workspace/dist
 * WITHOUT touching vite.config.ts or .vercel/output.
 *
 * Usage: node scripts/build-cloudflare-static.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const vercelOut = path.join(root, ".vercel", "output");

// Snapshot whether .vercel/output existed before
const vercelExisted = fs.existsSync(vercelOut);
const vercelMarker = path.join(vercelOut, "nitro.json");
let vercelFingerprint = null;
if (fs.existsSync(vercelMarker)) {
  vercelFingerprint = fs.statSync(vercelMarker).mtimeMs;
}

console.log("[cf-static] Building with vite.cloudflare-static.config.ts → dist/");

const result = spawnSync(
  "npx",
  ["vite", "build", "--config", "vite.cloudflare-static.config.ts"],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  },
);

if (result.status !== 0) {
  console.error("[cf-static] vite build failed with code", result.status);
  process.exit(result.status ?? 1);
}

// SPA fallback for Cloudflare Pages static hosting
const redirects = path.join(dist, "_redirects");
const publicDir = fs.existsSync(path.join(dist, "public"))
  ? path.join(dist, "public")
  : dist;

// nitro static may nest under dist/public or dist
const candidates = [
  path.join(dist, "index.html"),
  path.join(dist, "public", "index.html"),
  path.join(dist, "client", "index.html"),
];

let indexHtml = candidates.find((p) => fs.existsSync(p));
if (!indexHtml) {
  // walk for index.html
  function findIndex(dir, depth = 0) {
    if (depth > 4 || !fs.existsSync(dir)) return null;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(full);
      } catch {
        continue;
      }
      if (st.isFile() && name === "index.html") return full;
      if (st.isDirectory() && name !== "node_modules") {
        const hit = findIndex(full, depth + 1);
        if (hit) return hit;
      }
    }
    return null;
  }
  indexHtml = findIndex(dist);
}

if (indexHtml) {
  const base = path.dirname(indexHtml);
  fs.writeFileSync(
    path.join(base, "_redirects"),
    "/*    /index.html   200\n",
  );
  console.log("[cf-static] Wrote SPA _redirects next to", indexHtml);
} else {
  console.warn("[cf-static] No index.html found under dist — listing:");
  const list = (d, prefix = "") => {
    if (!fs.existsSync(d)) return;
    for (const n of fs.readdirSync(d).slice(0, 40)) {
      const f = path.join(d, n);
      const st = fs.statSync(f);
      console.log(prefix + (st.isDirectory() ? n + "/" : n));
      if (st.isDirectory() && prefix.length < 6) list(f, prefix + "  ");
    }
  };
  list(dist);
}

// Ensure .vercel/output was not deleted
if (vercelExisted && !fs.existsSync(vercelOut)) {
  console.error("[cf-static] ERROR: .vercel/output was removed — abort");
  process.exit(2);
}
if (vercelFingerprint != null && fs.existsSync(vercelMarker)) {
  const now = fs.statSync(vercelMarker).mtimeMs;
  console.log(
    "[cf-static] .vercel/output nitro.json mtime preserved check:",
    now === vercelFingerprint ? "unchanged" : "changed (build may have rewritten)",
  );
}

console.log("[cf-static] Done. Upload the dist folder to Cloudflare Pages (static).");
console.log(
  "[cf-static] NOTE: /api/* routes require a server. Pure static hosts will not run Drive/Apps Script proxy APIs.",
);
