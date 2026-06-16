// @ts-nocheck
// Netlify Function v2 (Node.js runtime) — wraps TanStack Start SSR handler.
// Runs on Node.js Lambda so all Node.js APIs work natively with no Deno compat issues.
import serverModule from "../../dist/server/bundle.js";

// Resolve the fetch handler — handles both ESM default export shapes
const ssrHandler =
  typeof serverModule?.fetch === "function"
    ? serverModule
    : serverModule?.default ?? null;

export default async (request: Request) => {
  if (!ssrHandler?.fetch) {
    return new Response("SSR handler not initialized", { status: 500 });
  }

  return ssrHandler.fetch(request, {}, {});
};
