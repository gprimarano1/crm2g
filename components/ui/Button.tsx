import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles = {
  primary:
    "bg-accent hover:bg-accent-hover text-white shadow-glow-sm hover:shadow-glow",
  ghost:
    "bg-transparent text-text-muted hover:bg-bg-surface2 hover:text-text",
  danger:
    "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20",
  outline:
    "bg-transparent border border-bg-border text-text hover:bg-bg-surface2",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-5 py-2.5 text-sm gap-2 rounded-xl",
  lg: "px-6 py-3 text-base gap-2 rounded-xl",
  icon: "p-2 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <LoadingSpinner size="sm" className="opacity-70" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
