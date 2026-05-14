import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Eye, BarChart2, ExternalLink, Send } from "lucide-react";
import { getRelatorios, marcarEnviado } from "@/lib/actions/relatorios";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RelatorioStatus } from "@/lib/actions/relatorios";

export const metadata: Metadata = { title: "Relatórios" };

// ================================================================
// Helpers
// ================================================================

const STATUS_MAP: Record<
  RelatorioStatus,
  { label: string; variant: "ativo" | "pausado" | "encerrado" | "ativa" | "pausada" | "encerrada" }
> = {
  gerado:       { label: "Gerado",      variant: "pausado" },
  enviado:      { label: "Enviado",     variant: "ativo" },
  visualizado:  { label: "Visualizado", variant: "ativa" },
};

function formatPeriodo(inicio: string, fim: string): string {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${fmt(inicio)} – ${fmt(fim)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

// ================================================================
// CopyLinkButton — client island
// ================================================================

import { CopyLinkButton } from "@/components/relatorios/CopyLinkButton";

// ================================================================
// Page
// ================================================================

export default async function RelatoriosPage() {
  const relatorios = await getRelatorios();
  const baseUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <BarChart2 size={17} className="text-accent" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text">Relatórios</h1>
            <p className="text-sm text-text-muted">Relatórios de performance compartilháveis</p>
          </div>
        </div>
        <Link
          href="/relatorios/novo"
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-hover shadow-glow-sm hover:shadow-glow"
        >
          <Plus size={15} />
          Novo Relatório
        </Link>
      </div>

      {/* List */}
      {relatorios.length === 0 ? (
        <EmptyState
          icon={<BarChart2 size={22} />}
          title="Nenhum relatório gerado"
          description="Clique em Novo Relatório para criar e compartilhar com seus clientes."
          action={
            <Link
              href="/relatorios/novo"
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              <Plus size={14} />
              Novo Relatório
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-bg-border bg-bg-surface overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_140px_100px_80px_160px] gap-3 border-b border-bg-border bg-bg-surface2 px-5 py-2.5">
            {["Relatório", "Período", "Status", "Views", ""].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle">
                {h}
              </span>
            ))}
          </div>

          {relatorios.map((rel) => {
            const link       = `${baseUrl}/relatorio/${rel.slug}`;
            const statusCfg  = STATUS_MAP[rel.status] ?? STATUS_MAP.gerado;

            return (
              <div
                key={rel.id}
                className="grid grid-cols-[1fr_140px_100px_80px_160px] items-center gap-3 border-b border-bg-border px-5 py-3.5 last:border-0 hover:bg-bg-surface2/50 transition-colors"
              >
                {/* Title */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{rel.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-subtle">
                      {(rel.clientes as { nome_empresa: string } | null)?.nome_empresa ?? "—"}
                    </span>
                    <span className="text-text-subtle">·</span>
                    <span className="text-xs text-text-subtle">{formatDate(rel.created_at)}</span>
                  </div>
                </div>

                {/* Period */}
                <span className="text-xs text-text-muted">
                  {formatPeriodo(rel.periodo_inicio, rel.periodo_fim)}
                </span>

                {/* Status */}
                <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>

                {/* Views */}
                <div className="flex items-center gap-1.5 text-xs text-text-subtle">
                  <Eye size={12} />
                  <span className="tabular-nums">{rel.visualizacoes}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 justify-end">
                  <Link
                    href={`/relatorio/${rel.slug}`}
                    target="_blank"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:text-text hover:bg-bg-surface2 transition-all"
                    title="Ver relatório"
                  >
                    <ExternalLink size={12} />
                  </Link>

                  <CopyLinkButton link={link} relatorioId={rel.id} />

                  {rel.status === "gerado" && (
                    <form
                      action={async () => {
                        "use server";
                        await marcarEnviado(rel.id);
                      }}
                    >
                      <button
                        type="submit"
                        title="Marcar como enviado"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:text-accent hover:border-accent/30 hover:bg-accent/8 transition-all"
                      >
                        <Send size={12} />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
