"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Pencil,
  TrendingUp,
  Users2,
  DollarSign,
  BarChart2,
  MousePointerClick,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { EditarOrcamentoModal } from "./EditarOrcamentoModal";
import { toggleCampanhaStatusAction } from "@/lib/actions/campanhas";
import type { Campanha } from "@/lib/actions/campanhas";

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtNum = (v: number) =>
  new Intl.NumberFormat("pt-BR").format(v);

const fmtPct = (v: number) =>
  `${v.toFixed(2)}%`;

// ================================================================
// Tipos locais
// ================================================================

interface EditTarget {
  campanhaId: string;
  campanhaNome: string;
  metaAdSetId: string | null;
  orcamentoAtual: number | null;
}

interface CampanhasTableProps {
  campanhas: Campanha[];
  clienteId: string;
}

// ================================================================
// Linha da tabela
// ================================================================

function CampanhaRow({
  campanha,
  clienteId,
  onEditarOrcamento,
}: {
  campanha: Campanha;
  clienteId: string;
  onEditarOrcamento: (target: EditTarget) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (!campanha.meta_campaign_id) return;

    const novoStatus = campanha.status === "ativa" ? "pausada" : "ativa";

    startTransition(async () => {
      await toggleCampanhaStatusAction(
        campanha.id,
        campanha.meta_campaign_id!,
        clienteId,
        novoStatus
      );
      router.refresh();
    });
  }

  const podeToggle =
    !!campanha.meta_campaign_id &&
    (campanha.status === "ativa" || campanha.status === "pausada");

  return (
    <tr className="group border-b border-bg-border last:border-0 hover:bg-bg-surface2/50 transition-colors">
      {/* Nome + objetivo */}
      <td className="py-3.5 pl-5 pr-4">
        <div className="max-w-[220px]">
          <p className="text-sm font-medium text-text truncate leading-tight">
            {campanha.nome}
          </p>
          {campanha.objetivo && (
            <p className="text-xs text-text-subtle mt-0.5 truncate capitalize">
              {campanha.objetivo.toLowerCase().replace(/_/g, " ")}
            </p>
          )}
        </div>
      </td>

      {/* Orçamento */}
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums">
        {campanha.orcamento_diario !== null
          ? `${fmtBRL(campanha.orcamento_diario)}/dia`
          : "—"}
      </td>

      {/* Gasto */}
      <td className="py-3.5 px-4 text-sm font-medium text-text tabular-nums">
        {campanha.gasto_total > 0 ? fmtBRL(campanha.gasto_total) : "—"}
      </td>

      {/* Leads */}
      <td className="py-3.5 px-4 text-sm tabular-nums">
        <span className={campanha.leads > 0 ? "text-success font-semibold" : "text-text-muted"}>
          {campanha.leads > 0 ? fmtNum(campanha.leads) : "—"}
        </span>
      </td>

      {/* CPL */}
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums">
        {campanha.cpl_medio > 0 ? fmtBRL(campanha.cpl_medio) : "—"}
      </td>

      {/* CTR */}
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums">
        {campanha.ctr > 0 ? fmtPct(campanha.ctr) : "—"}
      </td>

      {/* Status */}
      <td className="py-3.5 px-4">
        <Badge variant={campanha.status} dot />
      </td>

      {/* Ações */}
      <td className="py-3.5 pl-4 pr-5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {podeToggle && (
            <button
              onClick={handleToggle}
              disabled={isPending}
              title={campanha.status === "ativa" ? "Pausar" : "Ativar"}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:bg-bg-surface2 hover:text-text transition-colors disabled:opacity-50"
            >
              {campanha.status === "ativa" ? (
                <Pause size={13} />
              ) : (
                <Play size={13} />
              )}
            </button>
          )}

          <button
            onClick={() =>
              onEditarOrcamento({
                campanhaId: campanha.id,
                campanhaNome: campanha.nome,
                metaAdSetId: campanha.meta_adset_id,
                orcamentoAtual: campanha.orcamento_diario,
              })
            }
            title="Editar orçamento"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:bg-bg-surface2 hover:text-text transition-colors"
          >
            <Pencil size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ================================================================
// Rodapé totalizador
// ================================================================

function TotalsRow({ campanhas }: { campanhas: Campanha[] }) {
  const total = campanhas.reduce(
    (acc, c) => ({
      gasto: acc.gasto + c.gasto_total,
      leads: acc.leads + c.leads,
      impressoes: acc.impressoes + c.impressoes,
      cliques: acc.cliques + c.cliques,
    }),
    { gasto: 0, leads: 0, impressoes: 0, cliques: 0 }
  );

  const cplTotal = total.leads > 0 && total.gasto > 0
    ? total.gasto / total.leads
    : 0;

  const ctrTotal = total.impressoes > 0 && total.cliques > 0
    ? (total.cliques / total.impressoes) * 100
    : 0;

  return (
    <tr className="border-t-2 border-bg-border bg-bg-surface2/30">
      <td className="py-3 pl-5 pr-4 text-xs font-semibold text-text-subtle uppercase tracking-wide">
        Total · {campanhas.length} camp.
      </td>
      <td className="py-3 px-4 text-sm text-text-subtle">—</td>
      <td className="py-3 px-4 text-sm font-semibold text-text tabular-nums">
        {total.gasto > 0 ? fmtBRL(total.gasto) : "—"}
      </td>
      <td className="py-3 px-4 text-sm font-semibold tabular-nums">
        <span className={total.leads > 0 ? "text-success" : "text-text-muted"}>
          {total.leads > 0 ? fmtNum(total.leads) : "—"}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-text-muted tabular-nums">
        {cplTotal > 0 ? fmtBRL(cplTotal) : "—"}
      </td>
      <td className="py-3 px-4 text-sm text-text-muted tabular-nums">
        {ctrTotal > 0 ? fmtPct(ctrTotal) : "—"}
      </td>
      <td className="py-3 px-4" />
      <td className="py-3 px-4" />
    </tr>
  );
}

// ================================================================
// Tabela principal
// ================================================================

export function CampanhasTable({ campanhas, clienteId }: CampanhasTableProps) {
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  if (campanhas.length === 0) {
    return (
      <EmptyState
        icon={<BarChart2 size={22} />}
        title="Nenhuma campanha encontrada"
        description="Sincronize os dados do Meta Ads para ver as campanhas aqui."
      />
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-bg-border bg-bg-surface overflow-hidden">
        {/* Mini KPI strip */}
        <div className="grid grid-cols-4 divide-x divide-bg-border border-b border-bg-border">
          <KPIStrip
            icon={<DollarSign size={14} />}
            label="Gasto total"
            value={fmtBRL(campanhas.reduce((s, c) => s + c.gasto_total, 0))}
          />
          <KPIStrip
            icon={<Users2 size={14} />}
            label="Leads totais"
            value={fmtNum(campanhas.reduce((s, c) => s + c.leads, 0))}
            highlight
          />
          <KPIStrip
            icon={<TrendingUp size={14} />}
            label="CPL médio"
            value={() => {
              const gasto = campanhas.reduce((s, c) => s + c.gasto_total, 0);
              const leads = campanhas.reduce((s, c) => s + c.leads, 0);
              return leads > 0 && gasto > 0 ? fmtBRL(gasto / leads) : "—";
            }}
          />
          <KPIStrip
            icon={<MousePointerClick size={14} />}
            label="CTR médio"
            value={() => {
              const imps = campanhas.reduce((s, c) => s + c.impressoes, 0);
              const clicks = campanhas.reduce((s, c) => s + c.cliques, 0);
              return imps > 0 && clicks > 0 ? fmtPct((clicks / imps) * 100) : "—";
            }}
          />
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-bg-border">
                {["Nome / Objetivo", "Orçamento/dia", "Gasto", "Leads", "CPL", "CTR", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-2.5 px-4 first:pl-5 last:pr-5 text-[11px] font-semibold uppercase tracking-wide text-text-subtle"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {campanhas.map((c) => (
                <CampanhaRow
                  key={c.id}
                  campanha={c}
                  clienteId={clienteId}
                  onEditarOrcamento={setEditTarget}
                />
              ))}
            </tbody>
            <tfoot>
              <TotalsRow campanhas={campanhas} />
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal de editar orçamento */}
      {editTarget && (
        <EditarOrcamentoModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          campanhaId={editTarget.campanhaId}
          campanhaNome={editTarget.campanhaNome}
          clienteId={clienteId}
          metaAdSetId={editTarget.metaAdSetId}
          orcamentoAtual={editTarget.orcamentoAtual}
        />
      )}
    </>
  );
}

// ================================================================
// KPI strip no topo da tabela
// ================================================================

function KPIStrip({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | (() => string);
  highlight?: boolean;
}) {
  const resolved = typeof value === "function" ? value() : value;
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5">
      <div className="flex items-center gap-1.5 text-text-subtle">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={`text-base font-semibold tabular-nums ${
          highlight ? "text-success" : "text-text"
        }`}
      >
        {resolved}
      </p>
    </div>
  );
}
