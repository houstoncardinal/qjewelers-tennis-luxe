import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <div
      className={`page-transition ${className}`}
      style={{
        animation: 'fadeInUp 0.3s ease-out'
      }}
    >
      {children}
    </div>
  );
}

// Add CSS animations to global styles
export const pageTransitionStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .page-transition {
    animation-duration: 0.3s;
    animation-timing-function: ease-out;
    animation-fill-mode: both;
  }

  .page-transition-fade-in {
    animation-name: fadeIn;
  }

  .page-transition-slide-right {
    animation-name: slideInRight;
  }

  .page-transition-slide-left {
    animation-name: slideInLeft;
  }

  .page-transition-scale {
    animation-name: scaleIn;
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .page-transition,
    .page-transition-fade-in,
    .page-transition-slide-right,
    .page-transition-slide-left,
    .page-transition-scale {
      animation: none;
      transition: none;
    }
  }
`;
