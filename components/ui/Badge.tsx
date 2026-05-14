import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "ativo"
  | "pausado"
  | "encerrado"
  | "ativa"
  | "pausada"
  | "encerrada"
  | "novo"
  | "em_contato"
  | "qualificado"
  | "orcamento_enviado"
  | "venda_fechada"
  | "perdido"
  | "rascunho"
  | "enviada"
  | "visualizada"
  | "aceita"
  | "recusada"
  | "default";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  ativo:             "text-success bg-success/10 border-success/20",
  pausado:           "text-warning bg-warning/10 border-warning/20",
  encerrado:         "text-text-muted bg-bg-surface2 border-bg-border",
  ativa:             "text-success bg-success/10 border-success/20",
  pausada:           "text-warning bg-warning/10 border-warning/20",
  encerrada:         "text-text-muted bg-bg-surface2 border-bg-border",
  novo:              "text-accent bg-accent/10 border-accent/20",
  em_contato:        "text-warning bg-warning/10 border-warning/20",
  qualificado:       "text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/20",
  orcamento_enviado: "text-accent bg-accent/10 border-accent/20",
  venda_fechada:     "text-success bg-success/10 border-success/20",
  perdido:           "text-danger bg-danger/10 border-danger/20",
  rascunho:          "text-text-muted bg-bg-surface2 border-bg-border",
  enviada:           "text-accent bg-accent/10 border-accent/20",
  visualizada:       "text-warning bg-warning/10 border-warning/20",
  aceita:            "text-success bg-success/10 border-success/20",
  recusada:          "text-danger bg-danger/10 border-danger/20",
  default:           "text-text-muted bg-bg-surface2 border-bg-border",
};

const dotColors: Record<BadgeVariant, string> = {
  ativo:             "bg-success",
  pausado:           "bg-warning",
  encerrado:         "bg-text-subtle",
  ativa:             "bg-success",
  pausada:           "bg-warning",
  encerrada:         "bg-text-subtle",
  novo:              "bg-accent",
  em_contato:        "bg-warning",
  qualificado:       "bg-[#a78bfa]",
  orcamento_enviado: "bg-accent",
  venda_fechada:     "bg-success",
  perdido:           "bg-danger",
  rascunho:          "bg-text-subtle",
  enviada:           "bg-accent",
  visualizada:       "bg-warning",
  aceita:            "bg-success",
  recusada:          "bg-danger",
  default:           "bg-text-subtle",
};

const LABELS: Partial<Record<BadgeVariant, string>> = {
  ativo:             "Ativo",
  pausado:           "Pausado",
  encerrado:         "Encerrado",
  ativa:             "Ativa",
  pausada:           "Pausada",
  encerrada:         "Encerrada",
  novo:              "Novo",
  em_contato:        "Em contato",
  qualificado:       "Qualificado",
  orcamento_enviado: "Orçamento enviado",
  venda_fechada:     "Venda fechada",
  perdido:           "Perdido",
  rascunho:          "Rascunho",
  enviada:           "Enviada",
  visualizada:       "Visualizada",
  aceita:            "Aceita",
  recusada:          "Recusada",
};

export function Badge({
  variant = "default",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            dotColors[variant]
          )}
        />
      )}
      {children ?? LABELS[variant] ?? variant}
    </span>
  );
}
