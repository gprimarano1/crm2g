import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-text-subtle pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl border bg-bg-surface2 px-4 py-2.5 text-sm text-text outline-none transition-all duration-200",
              "placeholder:text-text-subtle",
              "focus:border-accent focus:ring-2 focus:ring-accent/15",
              error
                ? "border-danger focus:border-danger focus:ring-danger/15"
                : "border-bg-border",
              leftIcon && "pl-10",
              rightElement && "pr-10",
              className
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 text-text-subtle">
              {rightElement}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-subtle">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
