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
    const finish = () => navigate({ to: "/account", replace: true });

    // Explicitly exchange the PKCE code that Supabase put in the URL.
    // This is more reliable than waiting for onAuthStateChange on first load.
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (!error) finish();
          else {
            // Exchange failed — try to recover via existing session
            supabase.auth.getSession().then(({ data }) => {
              if (data.session) finish();
              else finish(); // redirect to /account anyway (will show sign-in)
            });
          }
        });
    } else {
      // No code in URL — check for an already-established session
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) finish();
        // else fall through to the safety timeout
      });
    }

    // Safety fallback — if nothing works after 6 s, send to /account
    const t = setTimeout(finish, 6000);
    return () => clearTimeout(t);
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
