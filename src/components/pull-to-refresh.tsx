import { useState, useRef, useEffect, ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, threshold = 80, disabled = false }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || refreshing) return;
    if (containerRef.current?.scrollTop !== 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || refreshing) return;
    if (startY.current === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0) {
      e.preventDefault();
      const resistance = 0.5;
      setPullDistance(Math.min(distance * resistance, threshold * 1.5));
      setPulling(distance > threshold);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || refreshing) return;
    
    if (pulling) {
      setRefreshing(true);
      setPullDistance(threshold);
      await onRefresh();
      setRefreshing(false);
      setPullDistance(0);
      setPulling(false);
    } else {
      setPullDistance(0);
    }
    startY.current = 0;
  };

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center transition-transform duration-200 pointer-events-none"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 20)}px)`,
          opacity: progress,
        }}
      >
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw 
            className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${progress * 360}deg)` }}
          />
          <span className="text-sm">
            {refreshing ? 'Refreshing...' : pulling ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ transform: `translateY(${Math.max(0, pullDistance - threshold)}px)` }}>
        {children}
      </div>
    </div>
  );
}
