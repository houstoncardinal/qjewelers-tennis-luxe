import { useState, useEffect, ReactNode, useRef } from "react";
import { X } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  height?: number | 'auto';
}

export function BottomSheet({ isOpen, onClose, children, title, height = 'auto' }: BottomSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      triggerHaptic('medium');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      triggerHaptic('light');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          height: height === 'auto' ? 'auto' : `${height}px`,
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Hook for managing bottom sheet state
export function useBottomSheet() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    setIsOpen(true);
    triggerHaptic('medium');
  };

  const close = () => {
    triggerHaptic('light');
    setIsOpen(false);
  };

  const toggle = () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  return { isOpen, open, close, toggle, setIsOpen };
}
