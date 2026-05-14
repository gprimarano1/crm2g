import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ExternalLink, FileText, Edit, CheckCircle2, XCircle,
  Eye, Calendar, AlertTriangle,
} from "lucide-react";
import { getPropostaById, getDuvidasDaProposta } from "@/lib/actions/propostas";
import { CopyLinkButton } from "@/components/relatorios/CopyLinkButton";
import { Badge } from "@/components/ui/Badge";
import { PropostaDuvidasSection } from "@/components/propostas/PropostaDuvidasSection";
import { DuplicarPropostaButton } from "@/components/propostas/DuplicarPropostaButton";
import type { PropostaStatus } from "@/lib/actions/propostas";

export const metadata: Metadata = { title: "Detalhes da Proposta" };

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

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

// ================================================================
// StatusTimeline
// ================================================================

function StatusTimeline({ proposta }: { proposta: Awaited<ReturnType<typeof getPropostaById>> }) {
  if (!proposta) return null;

  const steps = [
    { key: "criada",      label: "Criada",      date: proposta.created_at,    done: true, Icon: FileText    },
    { key: "visualizada", label: "Visualizada",  date: proposta.visualizada_em, done: !!proposta.visualizada_em, Icon: Eye },
    proposta.status === "recusada"
      ? { key: "recusada", label: "Recusada",    date: proposta.recusada_em,   done: !!proposta.recusada_em, Icon: XCircle       }
      : { key: "aceita",   label: "Aceita",      date: proposta.aceita_em,     done: !!proposta.aceita_em,   Icon: CheckCircle2  },
  ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5 min-w-0">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
              s.done
                ? s.key === "recusada" ? "border-danger bg-danger/10 text-danger" : "border-success bg-success/10 text-success"
                : "border-bg-border bg-bg-surface2 text-text-subtle"
            }`}>
              <s.Icon size={15} />
            </div>
            <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-wide">{s.label}</p>
            {s.date && (
              <p className="text-[10px] text-text-subtle">{formatDateShort(s.date)}</p>
            )}
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 ${steps[i + 1].done ? "bg-success/40" : "bg-bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ================================================================
// Page
// ================================================================

export default async function PropostaDetalhe({ params }: { params: { id: string } }) {
  const [proposta, duvidas] = await Promise.all([
    getPropostaById(params.id),
    getDuvidasDaProposta(params.id),
  ]);

  if (!proposta) notFound();

  const baseUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link      = `${baseUrl}/proposta/${proposta.slug}`;
  const statusCfg = STATUS_MAP[proposta.status] ?? STATUS_MAP.pendente;
  const incluidos = proposta.servicos.filter((s) => s.incluido);
  const total     = incluidos.reduce((sum, s) => sum + (s.valor ?? 0), 0);
  const fmtBRL    = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/propostas"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:text-text transition-colors"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-xl font-bold text-text">{proposta.empresa}</h1>
              <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-text-subtle">
              <span>{proposta.prospect_nome}</span>
              {proposta.segmento && <><span>·</span><span>{proposta.segmento}</span></>}
              <span>·</span>
              <span>{formatDateShort(proposta.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-bg-border px-3 py-2 text-xs font-medium text-text-muted hover:bg-bg-surface2 hover:text-text transition-all"
          >
            <ExternalLink size={13} />
            Ver proposta
          </a>
          <CopyLinkButton link={link} relatorioId={proposta.id} />
          <Link
            href={`/propostas/${proposta.id}/editar`}
            className="flex items-center gap-2 rounded-xl border border-bg-border px-3 py-2 text-xs font-medium text-text-muted hover:bg-bg-surface2 hover:text-text transition-all"
          >
            <Edit size={13} />
            Editar
          </Link>
          <DuplicarPropostaButton propostaId={proposta.id} />
        </div>
      </div>

      {/* Link */}
      <div className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5">
        <span className="text-xs text-text-subtle shrink-0">Link:</span>
        <span className="flex-1 font-mono text-xs text-text-muted truncate">{link}</span>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle mb-5">Status & Timeline</p>
        <StatusTimeline proposta={proposta} />
        {proposta.visualizada_em && (
          <p className="text-xs text-text-subtle mt-4 flex items-center gap-1.5">
            <Eye size={11} />
            Visualizada em: {formatDate(proposta.visualizada_em)}
          </p>
        )}
        {proposta.aceita_em && (
          <p className="text-xs text-success mt-2 flex items-center gap-1.5">
            <CheckCircle2 size={11} />
            Aceita em: {formatDate(proposta.aceita_em)}
          </p>
        )}
        {proposta.recusada_em && (
          <p className="text-xs text-danger mt-2 flex items-center gap-1.5">
            <XCircle size={11} />
            Recusada em: {formatDate(proposta.recusada_em)}
          </p>
        )}
      </div>

      {/* Motivo de recusa */}
      {proposta.status === "recusada" && proposta.motivo_recusa && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-danger" />
            <p className="text-sm font-semibold text-danger">Motivo de recusa</p>
          </div>
          <p className="text-sm text-text-muted">{proposta.motivo_recusa}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Prospect info */}
        <div className="rounded-2xl border border-bg-border bg-bg-surface p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Prospect</p>
          <div className="flex items-center gap-3">
            {proposta.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proposta.logo_url} alt={proposta.empresa} className="h-12 w-12 rounded-xl object-contain bg-white p-1 border border-bg-border" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold">
                {proposta.empresa[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-text">{proposta.empresa}</p>
              <p className="text-sm text-text-muted">{proposta.prospect_nome}</p>
              {proposta.segmento && <p className="text-xs text-text-subtle mt-0.5">{proposta.segmento}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-subtle">
            <Calendar size={11} />
            <span>Prazo: <span className="text-text-muted font-medium">{proposta.prazo_contrato ?? "Não definido"}</span></span>
          </div>
        </div>

        {/* Investimento */}
        <div className="rounded-2xl border border-bg-border bg-bg-surface p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Serviços incluídos</p>
          {incluidos.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 size={12} className="text-success shrink-0" />
                <span className="text-xs text-text-muted truncate">{s.nome}</span>
              </div>
              <span className="text-xs font-medium text-text shrink-0 tabular-nums">
                {s.valor > 0 ? fmtBRL(s.valor) : "Incluso"}
              </span>
            </div>
          ))}
          {total > 0 && (
            <div className="border-t border-bg-border pt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Total mensal</span>
              <span className="text-sm font-bold text-accent">{fmtBRL(total)}/mês</span>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      {proposta.kpis.length > 0 && (
        <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle mb-3">KPIs prometidos</p>
          <div className="flex flex-wrap gap-2">
            {proposta.kpis.map((k) => (
              <span key={k.id} className="rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-xs text-accent font-medium">
                {k.texto}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem */}
      {proposta.mensagem_personalizada && (
        <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle mb-2">Mensagem personalizada</p>
          <p className="text-sm text-text-muted leading-relaxed">{proposta.mensagem_personalizada}</p>
        </div>
      )}

      {/* Dúvidas */}
      <PropostaDuvidasSection duvidas={duvidas} propostaId={proposta.id} />
    </div>
  );
}
