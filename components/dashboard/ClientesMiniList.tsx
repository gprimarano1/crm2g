import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ClienteMiniKPI } from "@/lib/types/dashboard";

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(v);

const STATUS_DOT: Record<string, string> = {
  ativo:     "bg-success",
  pausado:   "bg-warning",
  encerrado: "bg-danger",
};

function MiniKPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[56px]">
      <span className="text-xs font-semibold text-text tabular-nums">{value}</span>
      <span className="text-[10px] text-text-subtle">{label}</span>
    </div>
  );
}

export function ClientesMiniList({ clientes }: { clientes: ClienteMiniKPI[] }) {
  if (clientes.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-text-subtle">
        Nenhum cliente cadastrado.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-bg-border">
      {clientes.map((c) => (
        <Link
          key={c.id}
          href={`/clientes/${c.id}`}
          className="flex items-center gap-4 px-4 py-3 hover:bg-bg-surface2/50 transition-colors"
        >
          {/* Status dot + nome */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                STATUS_DOT[c.status] ?? "bg-text-subtle"
              )}
            />
            <span className="text-sm font-medium text-text truncate">
              {c.nome_empresa}
            </span>
          </div>

          {/* Mini KPIs */}
          <div className="flex items-center gap-5 shrink-0">
            <MiniKPI label="leads/mês" value={String(c.leads_mes)} />
            <MiniKPI
              label="investido"
              value={c.investimento > 0 ? fmtBRL(c.investimento) : "—"}
            />
            <MiniKPI label="vendas" value={String(c.vendas)} />
            <MiniKPI
              label="CPL"
              value={c.cpl > 0 ? fmtBRL(c.cpl) : "—"}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
