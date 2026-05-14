"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Star,
  AlertTriangle,
  Zap,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Clock,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { saveInsightConteudo } from "@/lib/actions/insights";
import type { InsightsResult } from "@/lib/claude/insights";
import type { InsightRecord } from "@/lib/actions/insights";

// ================================================================
// Tipos e config das categorias
// ================================================================

const PERIODS = [
  { value: "7d",  label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "mes", label: "Este mês" },
];

const CATEGORY_CONFIG = {
  destaques: {
    icon:    Star,
    label:   "Destaques",
    color:   "text-success",
    bg:      "bg-success/8",
    border:  "border-success/20",
    dot:     "bg-success",
  },
  atencao: {
    icon:    AlertTriangle,
    label:   "Atenção",
    color:   "text-warning",
    bg:      "bg-warning/8",
    border:  "border-warning/20",
    dot:     "bg-warning",
  },
  alertas: {
    icon:    Zap,
    label:   "Alertas críticos",
    color:   "text-danger",
    bg:      "bg-danger/8",
    border:  "border-danger/20",
    dot:     "bg-danger",
  },
  oportunidades: {
    icon:    Lightbulb,
    label:   "Oportunidades",
    color:   "text-accent",
    bg:      "bg-accent/8",
    border:  "border-accent/20",
    dot:     "bg-accent",
  },
  proximos_passos: {
    icon:    ArrowRight,
    label:   "Próximos passos",
    color:   "text-text",
    bg:      "bg-bg-surface2",
    border:  "border-bg-border",
    dot:     "bg-text-subtle",
  },
} as const;

// ================================================================
// CategorySection
// ================================================================

function CategorySection({
  categoryKey,
  items,
}: {
  categoryKey: keyof typeof CATEGORY_CONFIG;
  items:       string[];
}) {
  if (!items.length) return null;
  const cfg  = CATEGORY_CONFIG[categoryKey];
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-xl border p-4", cfg.bg, cfg.border)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={cfg.color} />
        <h4 className={cn("text-xs font-semibold uppercase tracking-wide", cfg.color)}>
          {cfg.label}
        </h4>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
            <span className="text-sm text-text">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ================================================================
// InsightCard — exibe um insight gerado
// ================================================================

function InsightCard({
  insight,
  clienteId,
  isLatest,
}: {
  insight:   InsightsResult | InsightRecord;
  clienteId: string;
  isLatest:  boolean;
}) {
  const dados          = "dados" in insight ? insight.dados : null;
  const [editing, setEditing] = useState(false);
  const [resumo, setResumo]   = useState(insight.conteudo);
  const [saved, setSaved]     = useState(false);
  const [saving, startSaving] = useTransition();

  function handleSave() {
    startSaving(async () => {
      const result = await saveInsightConteudo(insight.id, resumo, clienteId);
      if (result.success) {
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  const createdAt = new Date(insight.created_at).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  const periodoLabel = PERIODS.find((p) => p.value === insight.periodo)?.label
    ?? insight.periodo ?? "—";

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 16 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-bg-border bg-bg-surface overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-bg-border bg-bg-surface2 px-4 py-3">
        <Sparkles size={14} className="text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">
            Insights gerados por IA
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-subtle">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {createdAt}
          </span>
          <span className="rounded-full border border-bg-border bg-bg-surface px-2 py-0.5">
            {periodoLabel}
          </span>
          {("editado" in insight) && insight.editado && (
            <span className="rounded-full border border-accent/20 bg-accent/8 px-2 py-0.5 text-accent">
              Editado
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {/* Categorias */}
        {dados && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map(
              (key) => {
                if (key === "proximos_passos") return null;
                const items = dados[key];
                if (!items || !Array.isArray(items)) return null;
                return (
                  <CategorySection key={key} categoryKey={key} items={items} />
                );
              }
            )}
          </div>
        )}

        {/* Próximos passos */}
        {(dados?.proximos_passos?.length ?? 0) > 0 && (
          <CategorySection categoryKey="proximos_passos" items={dados!.proximos_passos} />
        )}

        {/* Resumo executivo — editável */}
        <div className="rounded-xl border border-bg-border bg-bg-surface2 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
              Resumo executivo
            </p>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-[11px] text-text-subtle hover:text-text transition-colors"
              >
                <Pencil size={11} />
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                rows={4}
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                className="w-full resize-none rounded-lg border border-bg-border bg-bg-surface px-3 py-2 text-sm text-text outline-none placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setEditing(false); setResumo(insight.conteudo); }}
                  className="text-xs text-text-subtle hover:text-text transition-colors"
                >
                  Cancelar
                </button>
                <Button size="sm" onClick={handleSave} loading={saving} icon={<Save size={12} />}>
                  Salvar e usar no relatório
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted leading-relaxed">{resumo || "—"}</p>
          )}

          {saved && (
            <div className="mt-2 flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={12} />
              Salvo com sucesso
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ================================================================
// InsightsDisplay — componente principal (client)
// ================================================================

interface InsightsDisplayProps {
  clienteId:       string;
  initialInsights: InsightRecord[];
}

export function InsightsDisplay({
  clienteId,
  initialInsights,
}: InsightsDisplayProps) {
  const [periodo, setPeriodo]         = useState("30d");
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [newInsight, setNewInsight]   = useState<InsightsResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setNewInsight(null);
    try {
      const res = await fetch("/api/insights", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ cliente_id: clienteId, periodo }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Erro desconhecido");
      }
      const data = await res.json() as InsightsResult;
      setNewInsight(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Generate button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-text">Insights com IA</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Claude analisa campanhas, leads e vendas e gera recomendações acionáveis.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Período */}
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            disabled={generating}
            className="h-9 appearance-none rounded-xl border border-bg-border bg-bg-surface2 pl-3 pr-7 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 cursor-pointer disabled:opacity-50"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <Button
            onClick={handleGenerate}
            loading={generating}
            icon={<Sparkles size={14} />}
          >
            {generating ? "Gerando…" : "Gerar Insights com IA"}
          </Button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Insight novo */}
      <AnimatePresence>
        {newInsight && (
          <InsightCard
            key={newInsight.id}
            insight={newInsight}
            clienteId={clienteId}
            isLatest
          />
        )}
      </AnimatePresence>

      {/* Histórico */}
      {initialInsights.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Histórico de insights
            <span className="ml-1 rounded-full border border-bg-border bg-bg-surface2 px-2 py-0.5 text-[11px] text-text-subtle">
              {initialInsights.length}
            </span>
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                {initialInsights.map((ins) => (
                  <InsightCard
                    key={ins.id}
                    insight={ins}
                    clienteId={clienteId}
                    isLatest={false}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state quando não gerou ainda */}
      {!newInsight && initialInsights.length === 0 && !generating && (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-bg-border">
          <div className="text-center">
            <Sparkles size={24} className="mx-auto text-text-subtle mb-3" />
            <p className="font-display font-semibold text-text">Nenhum insight gerado</p>
            <p className="text-sm text-text-muted mt-1 max-w-xs">
              Clique em &quot;Gerar Insights com IA&quot; para obter uma análise completa deste cliente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
