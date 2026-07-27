import { triggerHaptic } from "./haptics";

interface ShareData {
  title: string;
  text: string;
  url: string;
}

export async function shareContent(data: ShareData): Promise<boolean> {
  if (!navigator.share) {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${data.title}\n${data.text}\n${data.url}`);
      triggerHaptic('success');
      return true;
    } catch {
      triggerHaptic('error');
      return false;
    }
  }

  try {
    await navigator.share(data);
    triggerHaptic('success');
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      triggerHaptic('error');
    }
    return false;
  }
}

export function canShare(): boolean {
  return !!navigator.share;
}

// Hook for React components
export function useShare() {
  const share = async (data: ShareData) => {
    return shareContent(data);
  };

  return { share, canShare };
}
