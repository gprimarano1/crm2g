import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-text-muted"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-xl border bg-bg-surface2 px-4 py-3 text-sm text-text outline-none transition-all duration-200 resize-none",
            "placeholder:text-text-subtle",
            "focus:border-accent focus:ring-2 focus:ring-accent/15",
            error
              ? "border-danger focus:border-danger focus:ring-danger/15"
              : "border-bg-border",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-text-subtle">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
