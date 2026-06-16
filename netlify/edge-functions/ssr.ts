// @ts-nocheck
// Netlify Edge Function: wraps the TanStack Start SSR handler.
// Runs at the edge (Deno runtime) for every request.
// Static asset requests are passed through to Netlify's CDN via context.next().
import serverModule from "../../dist/server/bundle.js";

// Extensions that should be served as static files by Netlify CDN, not SSR
const STATIC_EXT =
  /\.(?:js|mjs|cjs|css|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|otf|mp4|mov|map|txt|xml|json)$/i;

export default async (
  request: Request,
  context: { next(): Promise<Response> },
) => {
  const { pathname } = new URL(request.url);

  // Let Netlify CDN serve static assets from dist/client/
  if (STATIC_EXT.test(pathname)) {
    return context.next();
  }

  // Resolve the fetch handler — handles both `export default { fetch }` (ESM)
  // and CommonJS-wrapped `{ default: { fetch } }` bundle formats.
  const handler =
    typeof serverModule?.fetch === "function"
      ? serverModule
      : (serverModule as any)?.default;

  if (!handler?.fetch) {
    return new Response("SSR handler not found", { status: 500 });
  }

  return handler.fetch(request, {}, {});
};

export const config = { path: "/*" };
