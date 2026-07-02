import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase JS automatically exchanges the ?code= PKCE token when the client
    // initialises on this page. We just wait for the session event then redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate({ to: "/account", replace: true });
      }
    });

    // If a session already exists (e.g. user navigates here directly), redirect now.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/account", replace: true });
    });

    // Safety fallback — redirect regardless after 6 s
    const t = setTimeout(() => navigate({ to: "/account", replace: true }), 6000);

    return () => { subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <div className="text-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
