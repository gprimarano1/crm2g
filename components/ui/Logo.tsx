import { cn } from "@/lib/utils";

// ================================================================
// LogoSymbol — dois nós conectados por linha (leads/rede/conexão)
// Accent: #5b6ef5 | ViewBox: 36×36
// ================================================================

function LogoSymbol({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      {/* Halo externo no nó primário */}
      <circle cx="27" cy="18" r="13" fill="#5b6ef5" fillOpacity="0.07" />
      {/* Nó secundário — menor, mais opaco */}
      <circle cx="8"  cy="18" r="5"  fill="#5b6ef5" fillOpacity="0.48" />
      {/* Nó primário — maior, sólido */}
      <circle cx="27" cy="18" r="8"  fill="#5b6ef5" />
      {/* Linha de conexão */}
      <path
        d="M13 18h6"
        stroke="#5b6ef5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />
    </svg>
  );
}

// ================================================================
// Tamanhos pré-definidos
// ================================================================

const SIZES = {
  sm: { icon: 20, gap: "gap-2",   crm: "text-[11px]",  twoG: "text-sm"  },
  md: { icon: 28, gap: "gap-2.5", crm: "text-sm",      twoG: "text-[17px]" },
  lg: { icon: 40, gap: "gap-3",   crm: "text-xl",      twoG: "text-[26px]" },
} as const;

// ================================================================
// Logo — componente principal
//
// variant="full"  → símbolo + texto "CRM 2G"
// variant="icon"  → apenas o símbolo (favicon, compacto)
// ================================================================

interface LogoProps {
  variant?: "full" | "icon";
  size?: keyof typeof SIZES;
  className?: string;
}

export function Logo({
  variant  = "full",
  size     = "md",
  className,
}: LogoProps) {
  const s = SIZES[size];

  if (variant === "icon") {
    return (
      <span
        className={cn("inline-flex items-center justify-center", className)}
        role="img"
        aria-label="CRM 2G"
      >
        <LogoSymbol size={s.icon} />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center", s.gap, className)}
      role="img"
      aria-label="CRM 2G"
    >
      <LogoSymbol size={s.icon} />
      {/* Texto — "CRM" leve + "2G" pesado e maior */}
      <span className="font-display leading-none tracking-tight select-none flex items-baseline gap-[2px]">
        <span className={cn("font-light text-text-muted", s.crm)}>
          CRM
        </span>
        <span className={cn("font-black text-text", s.twoG)}>
          2G
        </span>
      </span>
    </span>
  );
}
