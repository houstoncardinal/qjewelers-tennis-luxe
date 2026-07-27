import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if prompt was already dismissed
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      toast.success("App installed successfully!");
    } else {
      toast.info("Install cancelled");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl shadow-2xl p-4 border border-gray-700">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <Download className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install App</h3>
            <p className="text-xs text-gray-300 mt-1">
              Add Qureshi Admin to your home screen for a native app experience with offline support.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="w-full mt-3 bg-white text-gray-900 font-semibold text-sm py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Install Now
        </button>
      </div>
    </div>
  );
}
