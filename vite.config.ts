// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from 'vite-plugin-pwa';

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// On Netlify (NETLIFY=true), disable the Cloudflare Workers plugin so the build produces
// a standard ES module compatible with Netlify Functions.
export default defineConfig({
  cloudflare: process.env.NETLIFY === "true" ? false : undefined,
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: 'Qureshi Jewelers Admin',
          short_name: 'Qureshi Admin',
          description: 'Admin dashboard for Qureshi Jewelers',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/admin',
          icons: [
            {
              src: '/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.metals\.live\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'metals-api-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
  },
});
