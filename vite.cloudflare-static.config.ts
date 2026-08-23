/**
 * Cloudflare STATIC upload build — separate from Vercel (vite.config.ts).
 * Do not use for Vercel deploys. Does not modify .vercel/output.
 */
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";

export default defineConfig({
  server: { host: "0.0.0.0", port: 8080, strictPort: true },
  resolve: { tsconfigPaths: true },
  plugins: [
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoStaticPathsDiscovery: true,
      },
    }),
    nitro({
      preset: "static",
      output: {
        dir: "./dist",
        publicDir: "./dist",
      },
    }),
    viteReact(),
  ],
});
