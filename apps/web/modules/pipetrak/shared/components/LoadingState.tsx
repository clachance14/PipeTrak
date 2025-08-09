import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib";

interface LoadingStateProps {
  message?: string;
  className?: string;
  variant?: 'default' | 'table' | 'card' | 'list';
}

export function LoadingState({ 
  message = "Loading...", 
  className,
  variant = 'default' 
}: LoadingStateProps) {
  const renderVariant = () => {
    switch (variant) {
      case 'table':
        return <TableSkeleton />;
      case 'card':
        return <CardSkeleton />;
      case 'list':
        return <ListSkeleton />;
      default:
        return <DefaultSkeleton message={message} />;
    }
  };

  return (
    <div className={cn("animate-pulse", className)}>
      {renderVariant()}
    </div>
  );
}

function DefaultSkeleton({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
      
      {/* Rows skeleton */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 border rounded">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}