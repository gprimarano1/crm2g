import { Suspense } from "react";
import {
  Users2, DollarSign, TrendingDown, ShoppingCart,
  Banknote, FileCheck,
} from "lucide-react";
import { getClienteVisaoGeral } from "@/lib/actions/clientes";
import { MetricasChart } from "./MetricasChart";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function KPICard({
  icon,
  label,
  value,
  sub,
  color = "accent",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: "accent" | "success" | "warning" | "danger";
}) {
  const colorMap = {
    accent:  "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger:  "bg-danger/10 text-danger",
  };
  return (
    <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-text-muted mb-1">{label}</p>
      <p className="font-display text-2xl font-bold text-text tabular-nums">{value}</p>
      {sub && <p className="text-xs text-text-subtle mt-1">{sub}</p>}
    </div>
  );
}

async function VisaoGeralContent({ clienteId }: { clienteId: string }) {
  const data = await getClienteVisaoGeral(clienteId);

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          icon={<Users2 size={18} />}
          label="Leads / semana"
          value={String(data.leads_semana)}
          color="accent"
        />
        <KPICard
          icon={<DollarSign size={18} />}
          label="Investimento"
          value={fmt(data.investimento)}
          sub="campanhas ativas"
          color="warning"
        />
        <KPICard
          icon={<TrendingDown size={18} />}
          label="CPL médio"
          value={data.cpl > 0 ? fmt(data.cpl) : "—"}
          sub="custo por lead"
          color={data.cpl > 0 ? "accent" : "accent"}
        />
        <KPICard
          icon={<FileCheck size={18} />}
          label="Orçamentos"
          value={String(data.orcamentos)}
          sub="esta semana"
          color="warning"
        />
        <KPICard
          icon={<ShoppingCart size={18} />}
          label="Vendas"
          value={String(data.vendas)}
          sub="esta semana"
          color="success"
        />
        <KPICard
          icon={<Banknote size={18} />}
          label="Receita"
          value={data.receita > 0 ? fmt(data.receita) : "—"}
          sub="esta semana"
          color="success"
        />
      </div>

      {/* Gráfico histórico */}
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
        <div className="mb-4">
          <h3 className="font-display font-semibold text-text">
            Histórico — últimas 8 semanas
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Leads, vendas e receita por semana
          </p>
        </div>
        <MetricasChart data={data.chart} />
      </div>
    </div>
  );
}

export function VisaoGeralTab({ clienteId }: { clienteId: string }) {
  return (
    <Suspense fallback={<VisaoGeralSkeleton />}>
      <VisaoGeralContent clienteId={clienteId} />
    </Suspense>
  );
}

function VisaoGeralSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-bg-surface border border-bg-border" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-bg-surface border border-bg-border" />
    </div>
  );
}
