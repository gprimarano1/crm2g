import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ExternalLink, FileText, Eye, CheckCircle2, XCircle, Clock, MessageSquare } from "lucide-react";
import { getPropostas } from "@/lib/actions/propostas";
import { CopyLinkButton } from "@/components/relatorios/CopyLinkButton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PropostaStatus } from "@/lib/actions/propostas";

export const metadata: Metadata = { title: "Propostas" };

// ================================================================
// Helpers
// ================================================================

const STATUS_MAP: Record<
  PropostaStatus,
  { label: string; variant: "ativo" | "pausado" | "encerrado" | "ativa" | "pausada" | "encerrada" }
> = {
  pendente:    { label: "Pendente",    variant: "pausado"   },
  visualizada: { label: "Visualizada", variant: "ativa"     },
  aceita:      { label: "Aceita",      variant: "ativo"     },
  recusada:    { label: "Recusada",    variant: "encerrado" },
};

const STATUS_FILTER = [
  { value: "todos",       label: "Todos"       },
  { value: "pendente",    label: "Pendentes"   },
  { value: "visualizada", label: "Visualizadas" },
  { value: "aceita",      label: "Aceitas"     },
  { value: "recusada",    label: "Recusadas"   },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

// ================================================================
// Page
// ================================================================

export default async function PropostasPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status ?? "todos";
  const propostas    = await getPropostas(statusFilter === "todos" ? undefined : statusFilter);
  const baseUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const totalPendentes = propostas.reduce((sum, p) => sum + p.duvidas_pendentes, 0);

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <FileText size={17} className="text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-text">Propostas</h1>
              {totalPendentes > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning text-bg text-[10px] font-bold px-1.5">
                  {totalPendentes}
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted">Propostas comerciais enviadas aos prospects</p>
          </div>
        </div>
        <Link
          href="/propostas/nova"
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-hover shadow-glow-sm hover:shadow-glow"
        >
          <Plus size={15} />
          Nova Proposta
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTER.map((f) => (
          <Link
            key={f.value}
            href={f.value === "todos" ? "/propostas" : `/propostas?status=${f.value}`}
            className={`rounded-xl border px-4 py-1.5 text-sm font-medium transition-all ${
              statusFilter === f.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-bg-border text-text-muted hover:bg-bg-surface2 hover:text-text"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* List */}
      {propostas.length === 0 ? (
        <EmptyState
          icon={<FileText size={22} />}
          title="Nenhuma proposta encontrada"
          description="Crie sua primeira proposta comercial animada para compartilhar com prospects."
          action={
            <Link
              href="/propostas/nova"
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              <Plus size={14} />
              Nova Proposta
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-bg-border bg-bg-surface overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_110px_80px_160px] gap-3 border-b border-bg-border bg-bg-surface2 px-5 py-2.5">
            {["Proposta", "Criada em", "Status", "Dúvidas", ""].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle">{h}</span>
            ))}
          </div>

          {propostas.map((p) => {
            const link      = `${baseUrl}/proposta/${p.slug}`;
            const statusCfg = STATUS_MAP[p.status] ?? STATUS_MAP.pendente;

            return (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_120px_110px_80px_160px] items-center gap-3 border-b border-bg-border px-5 py-3.5 last:border-0 hover:bg-bg-surface2/50 transition-colors"
              >
                {/* Info */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{p.empresa}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-subtle">{p.prospect_nome}</span>
                    {p.segmento && (
                      <>
                        <span className="text-text-subtle">·</span>
                        <span className="text-xs text-text-subtle">{p.segmento}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Date */}
                <span className="text-xs text-text-muted">{formatDate(p.created_at)}</span>

                {/* Status */}
                <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>

                {/* Dúvidas */}
                <div className="flex items-center gap-1.5">
                  {p.duvidas_pendentes > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-warning">
                      <MessageSquare size={12} />
                      {p.duvidas_pendentes}
                    </span>
                  ) : p.duvidas_total > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-text-subtle">
                      <MessageSquare size={12} />
                      {p.duvidas_total}
                    </span>
                  ) : (
                    <span className="text-xs text-text-subtle">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 justify-end">
                  <Link
                    href={`/propostas/${p.id}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:text-text hover:bg-bg-surface2 transition-all"
                    title="Ver detalhes"
                  >
                    <Eye size={12} />
                  </Link>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:text-text hover:bg-bg-surface2 transition-all"
                    title="Ver proposta pública"
                  >
                    <ExternalLink size={12} />
                  </a>
                  <CopyLinkButton link={link} relatorioId={p.id} />

                  {p.status === "aceita"   && <CheckCircle2 size={14} className="text-success ml-1" />}
                  {p.status === "recusada" && <XCircle      size={14} className="text-danger ml-1"  />}
                  {p.status === "pendente" && <Clock        size={14} className="text-text-subtle ml-1" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
