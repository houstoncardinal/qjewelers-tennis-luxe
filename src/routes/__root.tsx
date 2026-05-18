import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { CartProvider } from "@/lib/cart";
import { Header, Footer } from "@/components/site-chrome";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-4">404</p>
        <h1 className="font-display text-5xl text-foreground">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you're looking for has moved or no longer exists.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-foreground text-background px-6 py-3 text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again or return home.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-wider"
          >
            Try again
          </button>
          <a href="/" className="border border-border px-5 py-2.5 text-xs uppercase tracking-wider">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Qureshi Jewelers — S925 VVS Moissanite Tennis Chains" },
      { name: "description", content: "America's premier source for iced out S925 sterling silver, VVS moissanite tennis chains and bracelets. GRA certified. Free US shipping over $250." },
      { name: "author", content: "Qureshi Jewelers" },
      { name: "theme-color", content: "#FAF8F3" },
      { property: "og:site_name", content: "Qureshi Jewelers" },
      { property: "og:title", content: "Qureshi Jewelers — S925 VVS Moissanite Tennis Chains" },
      { property: "og:description", content: "Hand-set VVS moissanite tennis chains in solid S925 sterling silver. GRA certified." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "JewelryStore",
        name: "Qureshi Jewelers",
        description: "S925 sterling silver VVS moissanite tennis chains and bracelets, GRA certified.",
        areaServed: "US",
      }),
    }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1"><Outlet /></main>
          <Footer />
        </div>
        <Toaster position="top-center" richColors />
      </CartProvider>
    </QueryClientProvider>
  );
}
