// Haptic feedback utilities for mobile native feel

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export function triggerHaptic(type: HapticType = 'light') {
  if (!('vibrate' in navigator)) return;

  const patterns: Record<HapticType, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [10, 50, 10],
    warning: [20, 30, 20],
    error: [30, 50, 30, 50, 30],
    selection: 5,
  };

  const pattern = patterns[type];
  navigator.vibrate(pattern);
}

// Hook for React components
export function useHaptic() {
  const trigger = (type: HapticType = 'light') => {
    triggerHaptic(type);
  };

  return { trigger };
}
