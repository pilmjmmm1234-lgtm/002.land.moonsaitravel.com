/**
 * Cloudflare Workers / Pages build (Nitro preset: cloudflare-pages).
 *
 * Separate from Vercel — does NOT modify vite.config.ts.
 * Build:  npm run build:cloudflare
 * Deploy: npm run deploy:cloudflare
 */
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart(),
    // Full SSR + /api/* on Cloudflare Pages Functions (Workers runtime)
    nitro({
      preset: "cloudflare-pages",
    }),
    viteReact(),
  ],
});
