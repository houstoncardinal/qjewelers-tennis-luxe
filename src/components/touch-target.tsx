import { ReactNode } from "react";

interface TouchTargetProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  minSize?: number;
}

/**
 * Wrapper component to ensure touch targets meet mobile accessibility guidelines (minimum 44x44px)
 * Wraps small buttons/links and adds padding to meet the minimum touch target size
 */
export function TouchTarget({ children, className = "", onClick, minSize = 44 }: TouchTargetProps) {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        minWidth: `${minSize}px`,
        minHeight: `${minSize}px`,
        padding: '8px',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// CSS utility class for touch targets
export const touchTargetStyles = `
  .touch-target {
    min-width: 44px;
    min-height: 44px;
    padding: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  @media (hover: none) {
    .touch-target {
      min-width: 48px;
      min-height: 48px;
    }
  }
`;
