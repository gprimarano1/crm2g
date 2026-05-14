import type { Metadata } from "next";
import { Suspense } from "react";
import { LayoutDashboard, Bell, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/actions/dashboard";
import { parseDashboardFilters, getPeriodoLabel } from "@/lib/utils/dashboard-filters";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts";
import { ClientesMiniList } from "@/components/dashboard/ClientesMiniList";

export const metadata: Metadata = { title: "Dashboard" };

// ================================================================
// Types
// ================================================================

interface PageProps {
  searchParams: {
    cliente?:     string;
    periodo?:     string;
    data_inicio?: string;
    data_fim?:    string;
  };
}

// ================================================================
// Skeleton
// ================================================================

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-bg-border bg-bg-surface" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="h-72 rounded-2xl border border-bg-border bg-bg-surface lg:col-span-2" />
        <div className="h-72 rounded-2xl border border-bg-border bg-bg-surface" />
      </div>
      <div className="h-48 rounded-2xl border border-bg-border bg-bg-surface" />
    </div>
  );
}

// ================================================================
// DashboardContent — async, wrapped in Suspense
// ================================================================

async function DashboardContent({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  const filters      = parseDashboardFilters(searchParams);
  const data         = await getDashboardData(filters);
  const periodoLabel = getPeriodoLabel(
    searchParams.periodo,
    searchParams.data_inicio,
    searchParams.data_fim,
  );
  const clienteFiltrado = !!(searchParams.cliente && searchParams.cliente !== "todos");

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <DashboardKPIs kpis={data.kpis} />

      {/* Gráfico + Alertas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-bg-border bg-bg-surface p-5 lg:col-span-2">
          <div className="mb-4">
            <h2 className="font-display font-semibold text-text">
              Leads e Vendas — {periodoLabel}
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {clienteFiltrado
                ? "cliente selecionado"
                : "total consolidado de todos os clientes"}
            </p>
          </div>
          <DashboardChart data={data.chart} />
        </div>

        <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={15} className="shrink-0 text-text-subtle" />
            <h2 className="font-display font-semibold text-text">Alertas</h2>
            {data.alerts.length > 0 && (
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger/15 px-1.5 text-[11px] font-semibold text-danger">
                {data.alerts.length}
              </span>
            )}
          </div>
          <DashboardAlerts alerts={data.alerts} />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-surface">
        <div className="flex items-center gap-2 border-b border-bg-border px-4 py-3">
          <Building2 size={15} className="shrink-0 text-text-subtle" />
          <h2 className="font-display font-semibold text-text">
            {clienteFiltrado ? "Cliente" : "Clientes"}
          </h2>
          <span className="ml-1 text-xs text-text-subtle">{periodoLabel}</span>

          <div className="ml-auto flex items-center gap-5 pr-1 text-[10px] font-semibold uppercase tracking-wide text-text-subtle">
            <span className="w-[56px] text-center">Leads</span>
            <span className="w-[56px] text-center">Investido</span>
            <span className="w-[56px] text-center">Vendas</span>
            <span className="w-[56px] text-center">CPL</span>
          </div>
        </div>
        <ClientesMiniList clientes={data.clientes} />
      </div>
    </div>
  );
}

// ================================================================
// Page
// ================================================================

export default async function DashboardPage({ searchParams }: PageProps) {
  // Busca lista de clientes para o dropdown de filtro
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome_empresa")
    .eq("status", "ativo")
    .order("nome_empresa");

  // Key força remount do Suspense ao mudar qualquer filtro → skeleton visível
  const suspenseKey = [
    searchParams.cliente     ?? "todos",
    searchParams.periodo     ?? "7d",
    searchParams.data_inicio ?? "",
    searchParams.data_fim    ?? "",
  ].join("|");

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <LayoutDashboard size={17} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text">Dashboard</h1>
          <p className="text-sm text-text-muted">Visão global de todos os clientes</p>
        </div>
      </div>

      {/* Filtros — renderiza imediatamente, fora do Suspense */}
      <DashboardFilters
        clientes={clientes ?? []}
        cliente={searchParams.cliente     ?? "todos"}
        periodo={searchParams.periodo     ?? "7d"}
        dataInicio={searchParams.data_inicio}
        dataFim={searchParams.data_fim}
      />

      {/* Conteúdo — recarrega com skeleton ao mudar filtros */}
      <Suspense key={suspenseKey} fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
