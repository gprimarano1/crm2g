"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { RefreshCw, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
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
  { value: "todos", label: "Todos" },
  { value: "ativa", label: "Ativas" },
  { value: "pausada", label: "Pausadas" },
  { value: "encerrada", label: "Encerradas" },
];

function formatSyncTime(iso: string | null): string {
  if (!iso) return "Nunca sincronizado";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Sincronizado agora";
  if (mins < 60) return `Há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Há ${hrs}h`;
  return `Há ${Math.floor(hrs / 24)}d`;
}

export function CampanhasSyncBar({
  clientes,
  clienteIdAtivo,
  statusAtivo,
}: CampanhasSyncBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [syncMsg, setSyncMsg] = useState("");

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

  function handleSync() {
    if (!clienteIdAtivo) return;

    setSyncStatus("idle");
    setSyncMsg("");

    startTransition(async () => {
      const result = await syncCampanhasAction(clienteIdAtivo);

      if (result.success) {
        setSyncStatus("success");
        setSyncMsg(`${result.data.campaigns} campanha(s) sincronizada(s)`);
        router.refresh();
      } else {
        setSyncStatus("error");
        setSyncMsg(result.error);
      }

      setTimeout(() => setSyncStatus("idle"), 4000);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Lado esquerdo: seletores */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Seletor de cliente */}
        <div className="relative">
          <select
            value={clienteIdAtivo ?? ""}
            onChange={(e) => navigate("cliente_id", e.target.value)}
            className="h-9 appearance-none rounded-xl border border-bg-border bg-bg-surface2 pl-3 pr-8 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 cursor-pointer"
          >
            <option value="">Selecionar cliente…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_empresa}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle"
          />
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

      {/* Lado direito: sync */}
      <div className="flex items-center gap-3">
        {/* Feedback de sync */}
        {syncStatus !== "idle" && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs",
              syncStatus === "success" ? "text-success" : "text-danger"
            )}
          >
            {syncStatus === "success" ? (
              <CheckCircle2 size={13} />
            ) : (
              <AlertCircle size={13} />
            )}
            {syncMsg}
          </div>
        )}

        {/* Última sync */}
        {clienteAtivo && syncStatus === "idle" && (
          <span className="text-xs text-text-subtle hidden sm:block">
            {formatSyncTime(clienteAtivo.meta_last_synced_at)}
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          icon={
            <RefreshCw
              size={13}
              className={isPending ? "animate-spin" : ""}
            />
          }
          loading={isPending}
          onClick={handleSync}
          disabled={!clienteIdAtivo || isPending}
        >
          Sincronizar
        </Button>
      </div>
    </div>
  );
}
