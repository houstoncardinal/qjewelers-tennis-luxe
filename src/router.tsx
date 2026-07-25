import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 0,
    // A hover-triggered preload was being marked stale (and re-fetched from
    // scratch on click) immediately — 0ms means the prefetch never actually
    // got used. Checkout still re-validates price/stock server-side
    // regardless (see validateAndPriceOrder), so a short client-side
    // staleness window here is free perceived-speed with no pricing risk.
    defaultPreloadStaleTime: 15_000,
  });

  return router;
};
