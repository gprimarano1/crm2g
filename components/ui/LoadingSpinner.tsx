import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
};

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-middle",
        sizes[size],
        className
      )}
      role="status"
      aria-label="Carregando"
    />
  );
}
