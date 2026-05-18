"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Calendar, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { syncAllCampanhasAction } from "@/lib/actions/campanhas";

// ================================================================
// Types
// ================================================================

type Period = "hoje" | "7d" | "14d" | "mes" | "mes_passado" | "custom";

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: "hoje",        label: "Hoje" },
  { value: "7d",          label: "7 dias" },
  { value: "14d",         label: "14 dias" },
  { value: "mes",         label: "Este mês" },
  { value: "mes_passado", label: "Mês passado" },
  { value: "custom",      label: "Personalizado" },
];

interface DashboardFiltersProps {
  clientes:    Array<{ id: string; nome_empresa: string }>;
  cliente:     string;
  periodo:     string;
  dataInicio?: string;
  dataFim?:    string;
}

// ================================================================
// DashboardFilters
// ================================================================

export function DashboardFilters({
  clientes,
  cliente:    initCliente,
  periodo:    initPeriodo,
  dataInicio: initDataInicio,
  dataFim:    initDataFim,
}: DashboardFiltersProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [cliente,    setCliente]    = useState(initCliente    || "todos");
  const [periodo,    setPeriodo]    = useState<Period>((initPeriodo as Period) || "7d");
  const [dataInicio, setDataInicio] = useState(initDataInicio ?? "");
  const [dataFim,    setDataFim]    = useState(initDataFim    ?? "");

  const [isSyncing,  startSync]    = useTransition();
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSyncAll() {
    setSyncResult(null);
    startSync(async () => {
      const res = await syncAllCampanhasAction();
      if (res.success) {
        setSyncResult({ ok: true, msg: `${res.data.campaigns} campanhas sincronizadas` });
        router.refresh();
      } else {
        setSyncResult({ ok: false, msg: res.error });
      }
      setTimeout(() => setSyncResult(null), 5000);
    });
  }

  const navigate = useCallback((
    c: string,
    p: Period,
    di?: string,
    df?: string,
  ) => {
    const params = new URLSearchParams();
    if (c && c !== "todos")   params.set("cliente", c);
    if (p && p !== "7d")      params.set("periodo", p);
    if (p === "custom" && di) params.set("data_inicio", di);
    if (p === "custom" && df) params.set("data_fim", df);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname]);

  function handleCliente(v: string) {
    setCliente(v);
    navigate(v, periodo, dataInicio || undefined, dataFim || undefined);
  }

  function handlePeriodo(v: Period) {
    setPeriodo(v);
    if (v !== "custom") {
      setDataInicio("");
      setDataFim("");
      navigate(cliente, v);
    }
    // custom: aguarda as duas datas serem preenchidas
  }

  function handleDataInicio(v: string) {
    setDataInicio(v);
    if (v && dataFim) navigate(cliente, "custom", v, dataFim);
  }

  function handleDataFim(v: string) {
    setDataFim(v);
    if (dataInicio && v) navigate(cliente, "custom", dataInicio, v);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-bg-border bg-bg-surface p-3">

      {/* Seletor de cliente */}
      <div className="relative inline-flex">
        <select
          value={cliente}
          onChange={(e) => handleCliente(e.target.value)}
          className="h-9 appearance-none rounded-xl border border-bg-border bg-bg-surface2 pl-3 pr-8 text-sm text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15 cursor-pointer"
        >
          <option value="todos">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome_empresa}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle"
        />
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-bg-border" aria-hidden />

      {/* Período rápido */}
      <div className="flex items-center gap-1 rounded-xl border border-bg-border bg-bg-surface2 p-1">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodo(opt.value)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
              periodo === opt.value
                ? "bg-accent text-white shadow-sm"
                : "text-text-muted hover:bg-bg-border hover:text-text",
            )}
          >
            {opt.value === "custom" && <Calendar size={11} className="shrink-0" />}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Date pickers para período personalizado */}
      {periodo === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => handleDataInicio(e.target.value)}
            className="h-9 rounded-xl border border-bg-border bg-bg-surface2 px-3 text-sm text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          <span className="text-xs text-text-subtle">até</span>
          <input
            type="date"
            value={dataFim}
            min={dataInicio || undefined}
            onChange={(e) => handleDataFim(e.target.value)}
            className="h-9 rounded-xl border border-bg-border bg-bg-surface2 px-3 text-sm text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          {(!dataInicio || !dataFim) && (
            <span className="text-[11px] text-text-subtle">
              Selecione as duas datas
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-6 w-px bg-bg-border ml-auto" aria-hidden />

      {/* Sync Meta */}
      {syncResult && (
        <span className={cn("flex items-center gap-1.5 text-xs", syncResult.ok ? "text-success" : "text-danger")}>
          {syncResult.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {syncResult.msg}
        </span>
      )}
      <button
        onClick={handleSyncAll}
        disabled={isSyncing}
        title="Sincronizar campanhas Meta de todos os clientes"
        className="flex h-9 items-center gap-2 rounded-xl border border-bg-border bg-bg-surface2 px-3 text-xs font-medium text-text-muted transition-colors hover:border-accent/40 hover:bg-accent/8 hover:text-accent disabled:opacity-50"
      >
        <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
        {isSyncing ? "Sincronizando…" : "Sync Meta"}
      </button>
    </div>
  );
}
