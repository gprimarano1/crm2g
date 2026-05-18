"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { RefreshCw, CheckCircle2, AlertCircle, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { syncCampanhasAction } from "@/lib/actions/campanhas";
import { cn } from "@/lib/utils";

interface ClienteOption {
  id: string;
  nome_empresa: string;
  meta_last_synced_at: string | null;
}

interface CampanhasSyncBarProps {
  clientes: ClienteOption[];
  clienteIdAtivo: string | null;
  statusAtivo: string;
}

const STATUSES = [
  { value: "todos",     label: "Todos" },
  { value: "ativa",    label: "Ativas" },
  { value: "pausada",  label: "Pausadas" },
  { value: "encerrada", label: "Encerradas" },
];

const PERIODOS_SYNC = [
  { value: "7d",  label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "custom", label: "Personalizado" },
];

function formatSyncTime(iso: string | null): string {
  if (!iso) return "Nunca sincronizado";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return "Sincronizado agora";
  if (mins < 60) return `Há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Há ${hrs}h`;
  return `Há ${Math.floor(hrs / 24)}d`;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function computeDateRange(periodo: string, customSince: string, customUntil: string): { since: string; until: string } {
  const today     = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const until     = toDateStr(yesterday); // Meta API has processing delay for current day
  if (periodo === "7d")  return { since: toDateStr(new Date(yesterday.getTime() - 6  * 86400000)), until };
  if (periodo === "30d") return { since: toDateStr(new Date(yesterday.getTime() - 29 * 86400000)), until };
  if (periodo === "90d") return { since: toDateStr(new Date(yesterday.getTime() - 89 * 86400000)), until };
  return { since: customSince || until, until: customUntil || until };
}

export function CampanhasSyncBar({
  clientes,
  clienteIdAtivo,
  statusAtivo,
}: CampanhasSyncBarProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [syncStatus, setSyncStatus]  = useState<"idle" | "success" | "error">("idle");
  const [syncMsg,    setSyncMsg]     = useState("");

  // Period selector state
  const [periodoSync,   setPeriodoSync]   = useState("7d");
  const [customSince,   setCustomSince]   = useState("");
  const [customUntil,   setCustomUntil]   = useState("");

  const clienteAtivo = clientes.find((c) => c.id === clienteIdAtivo) ?? null;

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "todos") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  // P5: trocar cliente recarrega dados do DB + mostra skeleton
  function handleClienteChange(newId: string) {
    navigate("cliente_id", newId);
  }

  function handleSync() {
    if (!clienteIdAtivo) return;
    setSyncStatus("idle");
    setSyncMsg("");

    const dateRange = computeDateRange(periodoSync, customSince, customUntil);

    startTransition(async () => {
      const result = await syncCampanhasAction(clienteIdAtivo, dateRange);
      if (result.success) {
        setSyncStatus("success");
        setSyncMsg(`${result.data.campaigns} campanha(s) — ${dateRange.since} → ${dateRange.until}`);
        router.refresh();
      } else {
        setSyncStatus("error");
        setSyncMsg(result.error);
      }
      setTimeout(() => setSyncStatus("idle"), 5000);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Linha 1: seletores de cliente + status */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Seletor de cliente */}
        <div className="relative">
          <select
            value={clienteIdAtivo ?? ""}
            onChange={(e) => handleClienteChange(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-bg-border bg-bg-surface2 pl-3 pr-8 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 cursor-pointer"
          >
            <option value="">Selecionar cliente…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome_empresa}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
        </div>

        {/* Filtro de status */}
        <div className="flex items-center rounded-xl border border-bg-border bg-bg-surface2 p-0.5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => navigate("status", s.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                statusAtivo === s.value || (s.value === "todos" && !statusAtivo)
                  ? "bg-accent text-white shadow-glow-sm"
                  : "text-text-muted hover:text-text"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Linha 2: período de sync + botão sincronizar */}
      <div className="flex items-center gap-3 flex-wrap sm:justify-between">
        {/* Período de sync */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-text-subtle">
            <Calendar size={13} />
            <span className="font-medium">Período do sync:</span>
          </div>

          <div className="flex items-center rounded-xl border border-bg-border bg-bg-surface2 p-0.5">
            {PERIODOS_SYNC.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodoSync(p.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                  periodoSync === p.value
                    ? "bg-accent text-white shadow-glow-sm"
                    : "text-text-muted hover:text-text"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date picker customizado */}
          {periodoSync === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customSince}
                onChange={(e) => setCustomSince(e.target.value)}
                className="h-8 rounded-xl border border-bg-border bg-bg-surface2 px-2 text-xs text-text outline-none focus:border-accent"
              />
              <span className="text-xs text-text-subtle">→</span>
              <input
                type="date"
                value={customUntil}
                onChange={(e) => setCustomUntil(e.target.value)}
                className="h-8 rounded-xl border border-bg-border bg-bg-surface2 px-2 text-xs text-text outline-none focus:border-accent"
              />
            </div>
          )}
        </div>

        {/* Feedback + sync */}
        <div className="flex items-center gap-3">
          {syncStatus !== "idle" && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs",
              syncStatus === "success" ? "text-success" : "text-danger"
            )}>
              {syncStatus === "success"
                ? <CheckCircle2 size={13} />
                : <AlertCircle size={13} />}
              {syncMsg}
            </div>
          )}

          {clienteAtivo && syncStatus === "idle" && (
            <span className="text-xs text-text-subtle hidden sm:block">
              {formatSyncTime(clienteAtivo.meta_last_synced_at)}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={13} className={isPending ? "animate-spin" : ""} />}
            loading={isPending}
            onClick={handleSync}
            disabled={!clienteIdAtivo || isPending || (periodoSync === "custom" && (!customSince || !customUntil))}
          >
            Sincronizar
          </Button>
        </div>
      </div>
    </div>
  );
}
