import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-bg-border bg-bg-surface/50 px-6 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-surface2 text-text-subtle">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="font-display text-base font-semibold text-text">
          {title}
        </p>
        {description && (
          <p className="text-sm text-text-muted">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
