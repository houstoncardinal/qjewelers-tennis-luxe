import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200";
  
  const variantClasses = {
    default: "rounded-md",
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      aria-hidden="true"
    />
  );
}

// Pre-built skeleton components for common UI patterns
export function ProductCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <Skeleton className="w-full h-48 rounded-lg" variant="rectangular" />
      <Skeleton className="w-3/4 h-4" variant="text" />
      <Skeleton className="w-1/2 h-4" variant="text" />
      <Skeleton className="w-1/3 h-6" variant="text" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100">
      <Skeleton className="w-12 h-12 rounded" variant="circular" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-3/4 h-4" variant="text" />
        <Skeleton className="w-1/2 h-3" variant="text" />
      </div>
      <Skeleton className="w-20 h-8" variant="rectangular" />
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <Skeleton className="w-8 h-8 rounded" variant="circular" />
            <Skeleton className="w-1/2 h-6" variant="text" />
            <Skeleton className="w-3/4 h-4" variant="text" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="w-1/3 h-6" variant="text" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
