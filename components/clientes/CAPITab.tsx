import { CheckCircle2, XCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCAPIEventos } from "@/lib/actions/capi";
import { CAPIReenviarButton } from "./CAPIReenviarButton";
import type { CAPIEvento, CAPIStats } from "@/lib/actions/capi";

// ================================================================
// Helpers
// ================================================================

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "2-digit",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

const EVENT_LABELS: Record<string, string> = {
  Lead:              "Lead",
  Contact:           "Contato",
  SubmitApplication: "Orçamento",
  Purchase:          "Compra",
};

// ================================================================
// StatCard
// ================================================================

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-bg-border bg-bg-surface2 p-4">
      <p className="text-xs text-text-subtle uppercase tracking-wide">{label}</p>
      <p className={cn("text-2xl font-bold font-display tabular-nums", color ?? "text-text")}>
        {value}
      </p>
    </div>
  );
}

// ================================================================
// EventRow
// ================================================================

function EventRow({ evento, clienteId }: { evento: CAPIEvento; clienteId: string }) {
  const isSuccess = evento.status === "sucesso";
  const lead      = evento.leads;

  return (
    <div className="flex items-center gap-3 border-b border-bg-border px-4 py-3 last:border-0 hover:bg-bg-surface2/40 transition-colors">
      {/* Status icon */}
      <div className="shrink-0">
        {isSuccess ? (
          <CheckCircle2 size={15} className="text-success" />
        ) : (
          <XCircle size={15} className="text-danger" />
        )}
      </div>

      {/* Event */}
      <div className="w-36 shrink-0">
        <p className="text-xs font-medium text-text">
          {EVENT_LABELS[evento.event_name] ?? evento.event_name}
        </p>
        <p className="text-[10px] font-mono text-text-subtle">{evento.event_name}</p>
      </div>

      {/* Lead */}
      <div className="flex-1 min-w-0">
        {lead ? (
          <p className="text-sm text-text truncate">{lead.nome}</p>
        ) : (
          <p className="text-xs text-text-subtle italic">Lead removido</p>
        )}
      </div>

      {/* Timestamp */}
      <div className="shrink-0 text-xs text-text-subtle hidden sm:block whitespace-nowrap">
        {formatDateTime(evento.created_at)}
      </div>

      {/* Error snippet */}
      {!isSuccess && evento.error_message && (
        <div className="hidden md:block w-44 shrink-0">
          <p className="text-[10px] text-danger truncate" title={evento.error_message}>
            {evento.error_message.length > 60
              ? evento.error_message.slice(0, 60) + "…"
              : evento.error_message}
          </p>
        </div>
      )}

      {/* Spacer for success rows to keep layout consistent */}
      {isSuccess && <div className="hidden md:block w-44 shrink-0" />}

      {/* Resend */}
      <div className="shrink-0 w-[82px] flex justify-end">
        {!isSuccess && (
          <CAPIReenviarButton eventoId={evento.id} clienteId={clienteId} />
        )}
      </div>
    </div>
  );
}

// ================================================================
// StatsRow
// ================================================================

function StatsRow({ stats }: { stats: CAPIStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total enviado"   value={stats.total} />
      <StatCard
        label="Taxa de sucesso"
        value={`${stats.taxa_sucesso}%`}
        color={stats.taxa_sucesso === 100 ? "text-success" : stats.taxa_sucesso >= 80 ? "text-text" : "text-warning"}
      />
      <StatCard label="Sucesso"  value={stats.sucesso} color="text-success" />
      <StatCard
        label="Com erro"
        value={stats.erro}
        color={stats.erro > 0 ? "text-danger" : undefined}
      />
    </div>
  );
}

// ================================================================
// CAPITab — server component principal
// ================================================================

export async function CAPITab({ clienteId }: { clienteId: string }) {
  const { eventos, total, stats } = await getCAPIEventos(clienteId);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-semibold text-text">
          Conversions API
        </h2>
        <p className="text-sm text-text-muted mt-0.5">
          Eventos enviados ao Meta CAPI para otimização de campanhas.
        </p>
      </div>

      {/* Stats */}
      <StatsRow stats={stats} />

      {/* Log */}
      {total === 0 ? (
        <EmptyState
          icon={<Send size={22} />}
          title="Nenhum evento CAPI enviado"
          description="Os eventos são disparados automaticamente ao qualificar um lead, enviar orçamento ou fechar uma venda."
        />
      ) : (
        <div className="flex flex-col rounded-2xl border border-bg-border bg-bg-surface overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-3 border-b border-bg-border bg-bg-surface2 px-4 py-2">
            <div className="w-[15px] shrink-0" />
            <div className="w-36 shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle">
                Evento
              </span>
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle">
                Lead
              </span>
            </div>
            <div className="shrink-0 hidden sm:block">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle">
                Data
              </span>
            </div>
            <div className="hidden md:block w-44 shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle">
                Detalhe do erro
              </span>
            </div>
            <div className="shrink-0 w-[82px]" />
          </div>

          {eventos.map((evento) => (
            <EventRow key={evento.id} evento={evento} clienteId={clienteId} />
          ))}
        </div>
      )}

      {total > 50 && (
        <p className="text-center text-xs text-text-subtle">
          Mostrando os 50 eventos mais recentes de {total} no total.
        </p>
      )}
    </div>
  );
}
