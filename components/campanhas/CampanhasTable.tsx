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
  ChevronDown,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { EditarOrcamentoModal } from "./EditarOrcamentoModal";
import { AdSetsExpansion } from "./AdSetsExpansion";
import { toggleCampanhaStatusAction } from "@/lib/actions/campanhas";
import type { Campanha } from "@/lib/actions/campanhas";

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtNum = (v: number) => new Intl.NumberFormat("pt-BR").format(v);
const fmtPct = (v: number) => `${v.toFixed(2)}%`;

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
// Linha desktop
// ================================================================

function CampanhaRow({
  campanha,
  clienteId,
  expanded,
  onToggleExpand,
  onEditarOrcamento,
}: {
  campanha: Campanha;
  clienteId: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onEditarOrcamento: (t: EditTarget) => void;
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

  const temAdSets = !!campanha.meta_campaign_id;

  return (
    <tr
      className={`group border-b border-bg-border last:border-0 transition-colors ${
        expanded ? "bg-bg-surface2/30" : "hover:bg-bg-surface2/30"
      }`}
    >
      {/* Expand */}
      <td className="py-3.5 pl-4 pr-1 w-8">
        {temAdSets && (
          <button
            onClick={onToggleExpand}
            title="Ver conjuntos de anúncios"
            className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-bg-surface2 hover:text-text transition-colors"
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        )}
      </td>

      {/* Nome + objetivo */}
      <td className="py-3.5 pr-4 pl-1">
        <div className="max-w-[200px]">
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
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {campanha.orcamento_diario !== null
          ? `${fmtBRL(campanha.orcamento_diario)}/dia`
          : "—"}
      </td>

      {/* Gasto */}
      <td className="py-3.5 px-4 text-sm font-medium text-text tabular-nums whitespace-nowrap">
        {campanha.gasto_total > 0 ? fmtBRL(campanha.gasto_total) : "—"}
      </td>

      {/* Impressões */}
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {campanha.impressoes > 0 ? fmtNum(campanha.impressoes) : "—"}
      </td>

      {/* Alcance */}
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {campanha.alcance > 0 ? fmtNum(campanha.alcance) : "—"}
      </td>

      {/* CPM */}
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {campanha.cpm > 0 ? fmtBRL(campanha.cpm) : "—"}
      </td>

      {/* CPC */}
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {campanha.cpc > 0 ? fmtBRL(campanha.cpc) : "—"}
      </td>

      {/* Cliques */}
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {campanha.cliques > 0 ? fmtNum(campanha.cliques) : "—"}
      </td>

      {/* Leads */}
      <td className="py-3.5 px-4 text-sm tabular-nums whitespace-nowrap">
        <span
          className={
            campanha.leads > 0 ? "text-success font-semibold" : "text-text-muted"
          }
        >
          {campanha.leads > 0 ? fmtNum(campanha.leads) : "—"}
        </span>
      </td>

      {/* CPL */}
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {campanha.cpl_medio > 0 ? fmtBRL(campanha.cpl_medio) : "—"}
      </td>

      {/* CTR */}
      <td className="py-3.5 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
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
              title={campanha.status === "ativa" ? "Pausar campanha" : "Ativar campanha"}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:bg-bg-surface2 hover:text-text transition-colors disabled:opacity-50"
            >
              {campanha.status === "ativa" ? <Pause size={13} /> : <Play size={13} />}
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
// Linha de expansão (ad sets)
// ================================================================

function ExpansionRow({
  metaCampaignId,
  clienteId,
  colSpan,
}: {
  metaCampaignId: string;
  clienteId: string;
  colSpan: number;
}) {
  return (
    <tr className="border-b border-bg-border">
      <td colSpan={colSpan} className="p-0">
        <AdSetsExpansion metaCampaignId={metaCampaignId} clienteId={clienteId} />
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
      alcance: acc.alcance + c.alcance,
      cliques: acc.cliques + c.cliques,
    }),
    { gasto: 0, leads: 0, impressoes: 0, alcance: 0, cliques: 0 }
  );

  const cplTotal = total.leads > 0 && total.gasto > 0 ? total.gasto / total.leads : 0;
  const ctrTotal =
    total.impressoes > 0 && total.cliques > 0
      ? (total.cliques / total.impressoes) * 100
      : 0;
  const cpmTotal = total.impressoes > 0 ? (total.gasto / total.impressoes) * 1000 : 0;
  const cpcTotal = total.cliques > 0 ? total.gasto / total.cliques : 0;

  return (
    <tr className="border-t-2 border-bg-border bg-bg-surface2/30">
      <td className="py-3 pl-4 pr-1" />
      <td className="py-3 pr-4 pl-1 text-xs font-semibold text-text-subtle uppercase tracking-wide">
        Total · {campanhas.length} camp.
      </td>
      <td className="py-3 px-4 text-sm text-text-subtle">—</td>
      <td className="py-3 px-4 text-sm font-semibold text-text tabular-nums whitespace-nowrap">
        {total.gasto > 0 ? fmtBRL(total.gasto) : "—"}
      </td>
      <td className="py-3 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {total.impressoes > 0 ? fmtNum(total.impressoes) : "—"}
      </td>
      <td className="py-3 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {total.alcance > 0 ? fmtNum(total.alcance) : "—"}
      </td>
      <td className="py-3 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {cpmTotal > 0 ? fmtBRL(cpmTotal) : "—"}
      </td>
      <td className="py-3 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {cpcTotal > 0 ? fmtBRL(cpcTotal) : "—"}
      </td>
      <td className="py-3 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {total.cliques > 0 ? fmtNum(total.cliques) : "—"}
      </td>
      <td className="py-3 px-4 text-sm font-semibold tabular-nums whitespace-nowrap">
        <span className={total.leads > 0 ? "text-success" : "text-text-muted"}>
          {total.leads > 0 ? fmtNum(total.leads) : "—"}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {cplTotal > 0 ? fmtBRL(cplTotal) : "—"}
      </td>
      <td className="py-3 px-4 text-sm text-text-muted tabular-nums whitespace-nowrap">
        {ctrTotal > 0 ? fmtPct(ctrTotal) : "—"}
      </td>
      <td className="py-3 px-4" />
      <td className="py-3 px-4" />
    </tr>
  );
}

// ================================================================
// Card mobile por campanha
// ================================================================

function CampanhaCard({
  campanha,
  clienteId,
  onEditarOrcamento,
}: {
  campanha: Campanha;
  clienteId: string;
  onEditarOrcamento: (t: EditTarget) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedAdSets, setExpandedAdSets] = useState(false);

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
    <div className="rounded-2xl border border-bg-border bg-bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text leading-tight">{campanha.nome}</p>
          {campanha.objetivo && (
            <p className="text-xs text-text-muted mt-0.5 capitalize">
              {campanha.objetivo.toLowerCase().replace(/_/g, " ")}
            </p>
          )}
        </div>
        <Badge variant={campanha.status} dot />
      </div>

      {/* Métricas grid */}
      <div className="grid grid-cols-3 divide-x divide-bg-border border-t border-bg-border">
        <MetricCell label="Gasto" value={campanha.gasto_total > 0 ? fmtBRL(campanha.gasto_total) : "—"} highlight />
        <MetricCell label="Leads" value={campanha.leads > 0 ? fmtNum(campanha.leads) : "—"} success={campanha.leads > 0} />
        <MetricCell label="CPL" value={campanha.cpl_medio > 0 ? fmtBRL(campanha.cpl_medio) : "—"} />
      </div>
      <div className="grid grid-cols-3 divide-x divide-bg-border border-t border-bg-border">
        <MetricCell label="Impressões" value={campanha.impressoes > 0 ? fmtNum(campanha.impressoes) : "—"} />
        <MetricCell label="CPM" value={campanha.cpm > 0 ? fmtBRL(campanha.cpm) : "—"} />
        <MetricCell label="CTR" value={campanha.ctr > 0 ? fmtPct(campanha.ctr) : "—"} />
      </div>
      <div className="grid grid-cols-3 divide-x divide-bg-border border-t border-bg-border">
        <MetricCell label="Alcance" value={campanha.alcance > 0 ? fmtNum(campanha.alcance) : "—"} />
        <MetricCell label="CPC" value={campanha.cpc > 0 ? fmtBRL(campanha.cpc) : "—"} />
        <MetricCell label="Cliques" value={campanha.cliques > 0 ? fmtNum(campanha.cliques) : "—"} />
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 border-t border-bg-border px-4 py-3">
        {campanha.meta_campaign_id && (
          <button
            onClick={() => setExpandedAdSets((e) => !e)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-bg-border px-3 py-2 text-xs font-medium text-text-muted hover:bg-bg-surface2 hover:text-text transition-colors"
          >
            <Layers size={12} />
            Conjuntos
            {expandedAdSets ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        )}
        {podeToggle && (
          <button
            onClick={handleToggle}
            disabled={isPending}
            title={campanha.status === "ativa" ? "Pausar" : "Ativar"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:bg-bg-surface2 hover:text-text transition-colors disabled:opacity-50"
          >
            {campanha.status === "ativa" ? <Pause size={14} /> : <Play size={14} />}
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
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:bg-bg-surface2 hover:text-text transition-colors"
        >
          <Pencil size={14} />
        </button>
      </div>

      {/* Ad sets expandidos no card */}
      {expandedAdSets && campanha.meta_campaign_id && (
        <div className="border-t border-bg-border">
          <AdSetsExpansion
            metaCampaignId={campanha.meta_campaign_id}
            clienteId={clienteId}
          />
        </div>
      )}
    </div>
  );
}

function MetricCell({
  label,
  value,
  highlight = false,
  success = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  success?: boolean;
}) {
  return (
    <div className="px-3 py-2.5 flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-text-subtle">{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          success ? "text-success" : highlight ? "text-text" : "text-text-muted"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ================================================================
// KPI strip no topo
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
    <div className="flex flex-col gap-1 px-4 py-3">
      <div className="flex items-center gap-1.5 text-text-subtle">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-base font-semibold tabular-nums ${highlight ? "text-success" : "text-text"}`}>
        {resolved}
      </p>
    </div>
  );
}

// ================================================================
// Tabela principal
// ================================================================

const THEAD_COLS = [
  "",
  "Nome / Objetivo",
  "Orçamento/dia",
  "Gasto",
  "Impressões",
  "Alcance",
  "CPM",
  "CPC",
  "Cliques",
  "Leads",
  "CPL",
  "CTR",
  "Status",
  "",
];

export function CampanhasTable({ campanhas, clienteId }: CampanhasTableProps) {
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (campanhas.length === 0) {
    return (
      <EmptyState
        icon={<BarChart2 size={22} />}
        title="Nenhuma campanha encontrada"
        description="Sincronize os dados do Meta Ads para ver as campanhas aqui."
      />
    );
  }

  const gastoTotal = campanhas.reduce((s, c) => s + c.gasto_total, 0);
  const leadsTotal = campanhas.reduce((s, c) => s + c.leads, 0);
  const impsTotal = campanhas.reduce((s, c) => s + c.impressoes, 0);
  const clicksTotal = campanhas.reduce((s, c) => s + c.cliques, 0);

  return (
    <>
      {/* ── Mobile: lista de cards ── */}
      <div className="lg:hidden flex flex-col gap-3">
        {/* KPI strip mobile */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-bg-border bg-bg-surface px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-text-subtle">Gasto total</p>
            <p className="text-lg font-bold text-text tabular-nums">{fmtBRL(gastoTotal)}</p>
          </div>
          <div className="rounded-2xl border border-bg-border bg-bg-surface px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-text-subtle">Leads totais</p>
            <p className="text-lg font-bold text-success tabular-nums">{fmtNum(leadsTotal)}</p>
          </div>
          <div className="rounded-2xl border border-bg-border bg-bg-surface px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-text-subtle">CPL médio</p>
            <p className="text-lg font-bold text-text tabular-nums">
              {leadsTotal > 0 && gastoTotal > 0 ? fmtBRL(gastoTotal / leadsTotal) : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-bg-border bg-bg-surface px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-text-subtle">CTR médio</p>
            <p className="text-lg font-bold text-text tabular-nums">
              {impsTotal > 0 && clicksTotal > 0 ? fmtPct((clicksTotal / impsTotal) * 100) : "—"}
            </p>
          </div>
        </div>

        {campanhas.map((c) => (
          <CampanhaCard
            key={c.id}
            campanha={c}
            clienteId={clienteId}
            onEditarOrcamento={setEditTarget}
          />
        ))}
      </div>

      {/* ── Desktop: tabela ── */}
      <div className="hidden lg:block rounded-2xl border border-bg-border bg-bg-surface overflow-hidden">
        {/* KPI strip */}
        <div className="grid grid-cols-4 divide-x divide-bg-border border-b border-bg-border">
          <KPIStrip icon={<DollarSign size={14} />} label="Gasto total" value={fmtBRL(gastoTotal)} />
          <KPIStrip icon={<Users2 size={14} />} label="Leads totais" value={fmtNum(leadsTotal)} highlight />
          <KPIStrip
            icon={<TrendingUp size={14} />}
            label="CPL médio"
            value={leadsTotal > 0 && gastoTotal > 0 ? fmtBRL(gastoTotal / leadsTotal) : "—"}
          />
          <KPIStrip
            icon={<MousePointerClick size={14} />}
            label="CTR médio"
            value={impsTotal > 0 && clicksTotal > 0 ? fmtPct((clicksTotal / impsTotal) * 100) : "—"}
          />
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-bg-border">
                {THEAD_COLS.map((h, i) => (
                  <th
                    key={i}
                    className="py-2.5 px-4 first:pl-4 last:pr-5 text-[11px] font-semibold uppercase tracking-wide text-text-subtle whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campanhas.map((c) => (
                <>
                  <CampanhaRow
                    key={c.id}
                    campanha={c}
                    clienteId={clienteId}
                    expanded={expandedIds.has(c.id)}
                    onToggleExpand={() => toggleExpand(c.id)}
                    onEditarOrcamento={setEditTarget}
                  />
                  {expandedIds.has(c.id) && c.meta_campaign_id && (
                    <ExpansionRow
                      key={`${c.id}-expansion`}
                      metaCampaignId={c.meta_campaign_id}
                      clienteId={clienteId}
                      colSpan={THEAD_COLS.length}
                    />
                  )}
                </>
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
