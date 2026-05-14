import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "surface2" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-bg-surface border border-bg-border shadow-card",
  surface2: "bg-bg-surface2 border border-bg-border",
  ghost: "bg-transparent border border-bg-border/50",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  variant = "default",
  padding = "none",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("flex items-center justify-between px-5 py-4 border-b border-bg-border", className)}
      {...props}
    />
  );
}

type CardBodyProps = React.HTMLAttributes<HTMLDivElement>;
export function CardBody({ className, ...props }: CardBodyProps) {
  return <div className={cn("p-5", className)} {...props} />;
}

type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;
export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn("flex items-center px-5 py-4 border-t border-bg-border", className)}
      {...props}
    />
  );
}
