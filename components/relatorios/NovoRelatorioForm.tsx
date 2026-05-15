"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Sparkles, Check, Copy, ExternalLink, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { criarRelatorio, getInsightsParaCliente } from "@/lib/actions/relatorios";
import type { InsightOption } from "@/lib/actions/relatorios";

// ================================================================
// Period helpers
// ================================================================

type PeriodoPreset =
  | "esta_semana"
  | "semana_passada"
  | "este_mes"
  | "mes_passado"
  | "30d"
  | "custom";

const PERIODOS: Array<{ value: PeriodoPreset; label: string }> = [
  { value: "esta_semana",    label: "Esta semana" },
  { value: "semana_passada", label: "Semana passada" },
  { value: "este_mes",       label: "Este mês" },
  { value: "mes_passado",    label: "Mês passado" },
  { value: "30d",            label: "Últimos 30 dias" },
  { value: "custom",         label: "Personalizado" },
];

function toStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function computePeriod(
  preset: PeriodoPreset,
  customInicio: string,
  customFim: string,
): { inicio: string; fim: string } {
  const today = new Date();
  const todayStr = toStr(today);
  const dow = today.getDay(); // 0=Dom

  switch (preset) {
    case "esta_semana": {
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
      return { inicio: toStr(monday), fim: todayStr };
    }
    case "semana_passada": {
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) - 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { inicio: toStr(monday), fim: toStr(sunday) };
    }
    case "este_mes": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { inicio: toStr(first), fim: todayStr };
    }
    case "mes_passado": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last  = new Date(today.getFullYear(), today.getMonth(), 0);
      return { inicio: toStr(first), fim: toStr(last) };
    }
    case "30d": {
      const start = new Date(today.getTime() - 29 * 86400000);
      return { inicio: toStr(start), fim: todayStr };
    }
    case "custom":
      return { inicio: customInicio, fim: customFim };
  }
}

// ================================================================
// Sub-components
// ================================================================

function SelectField({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label:     string;
  value:     string;
  onChange:  (v: string) => void;
  children:  React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-muted">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-10 appearance-none rounded-xl border border-bg-border bg-bg-surface2 pl-3 pr-9 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 cursor-pointer disabled:opacity-50"
        >
          {children}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle" />
      </div>
    </div>
  );
}

// ================================================================
// NovoRelatorioForm
// ================================================================

interface Cliente {
  id:           string;
  nome_empresa: string;
}

interface Props {
  clientes: Cliente[];
  baseUrl:  string;
}

export function NovoRelatorioForm({ clientes, baseUrl }: Props) {
  const router = useRouter();

  const [clienteId,    setClienteId]    = useState(clientes[0]?.id ?? "");
  const [periodo,      setPeriodo]      = useState<PeriodoPreset>("esta_semana");
  const [customInicio, setCustomInicio] = useState("");
  const [customFim,    setCustomFim]    = useState("");
  const [insightId,    setInsightId]    = useState<string>("");
  const [insights,     setInsights]     = useState<InsightOption[]>([]);
  const [loadingIns,   setLoadingIns]   = useState(false);
  const [generating,   startGenerating] = useTransition();
  const [slug,         setSlug]         = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);

  const periodoComp = computePeriod(periodo, customInicio, customFim);
  const periodoValido =
    periodo !== "custom" || (!!customInicio && !!customFim && customInicio <= customFim);

  // ---- Load insights when client changes ----
  async function handleClienteChange(id: string) {
    setClienteId(id);
    setInsightId("");
    setInsights([]);
    if (!id) return;
    setLoadingIns(true);
    try {
      const data = await getInsightsParaCliente(id);
      setInsights(data);
    } finally {
      setLoadingIns(false);
    }
  }

  // ---- Generate ----
  function handleGenerate() {
    if (!clienteId || !periodoValido) return;
    setError(null);
    startGenerating(async () => {
      const result = await criarRelatorio({
        clienteId,
        periodoInicio: periodoComp.inicio,
        periodoFim:    periodoComp.fim,
        insightId:     insightId || null,
      });
      if (result.success && result.slug) {
        setSlug(result.slug);
      } else {
        setError(result.error ?? "Erro ao gerar relatório");
      }
    });
  }

  // ---- Copy link ----
  async function handleCopy() {
    if (!slug) return;
    const link = `${baseUrl}/relatorio/${slug}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const link = slug ? `${baseUrl}/relatorio/${slug}` : null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Success state */}
      {slug && link ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-success/20 bg-success/8 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Check size={18} className="text-success" />
              <p className="font-semibold text-success">Relatório gerado com sucesso!</p>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Compartilhe o link abaixo com o cliente. O link é público e não requer login.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5 font-mono text-xs text-text-muted truncate">
                {link}
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-all",
                  copied
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-bg-border text-text-muted hover:bg-bg-surface2 hover:text-text"
                )}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 items-center gap-2 rounded-xl border border-bg-border px-3 text-xs font-medium text-text-muted hover:bg-bg-surface2 hover:text-text transition-all"
              >
                <ExternalLink size={13} />
                Abrir
              </a>
            </div>
          </div>

          <Button variant="outline" onClick={() => { setSlug(null); router.push("/relatorios"); }}>
            Ver todos os relatórios
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-5 flex flex-col gap-4">
            {/* Cliente */}
            <SelectField label="Cliente" value={clienteId} onChange={handleClienteChange}>
              <option value="">Selecione um cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome_empresa}</option>
              ))}
            </SelectField>

            {/* Período */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-muted">Período</label>

              {/* Botões de preset */}
              <div className="flex flex-wrap gap-1.5">
                {PERIODOS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriodo(p.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                      periodo === p.value
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-bg-border bg-bg-surface2 text-text-muted hover:border-accent/20 hover:text-text"
                    )}
                  >
                    {p.value === "custom" && <Calendar size={11} />}
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Date picker para personalizado */}
              {periodo === "custom" && (
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={customInicio}
                    onChange={(e) => setCustomInicio(e.target.value)}
                    className="h-9 rounded-xl border border-bg-border bg-bg-surface2 px-3 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  />
                  <span className="text-sm text-text-subtle">→</span>
                  <input
                    type="date"
                    value={customFim}
                    onChange={(e) => setCustomFim(e.target.value)}
                    min={customInicio}
                    className="h-9 rounded-xl border border-bg-border bg-bg-surface2 px-3 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                  />
                </div>
              )}
            </div>

            {/* Insights IA */}
            <SelectField
              label="Insights da IA (opcional)"
              value={insightId}
              onChange={setInsightId}
              disabled={loadingIns || !clienteId}
            >
              <option value="">Sem insights / selecionar depois</option>
              {insights.map((ins) => {
                const dt = new Date(ins.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "2-digit", year: "2-digit",
                });
                const label = ins.periodo ? `${ins.periodo} — ${dt}` : `Gerado em ${dt}`;
                return <option key={ins.id} value={ins.id}>{label}</option>;
              })}
              {clienteId && !loadingIns && insights.length === 0 && (
                <option disabled value="">Nenhum insight gerado para este cliente</option>
              )}
            </SelectField>

            {/* Preview do período */}
            {clienteId && periodoValido && (
              <div className="rounded-xl border border-bg-border bg-bg-surface2 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle mb-2">
                  Preview do período
                </p>
                <div className="flex gap-4 text-xs text-text-muted">
                  <span>Início: <span className="text-text font-medium">{periodoComp.inicio}</span></span>
                  <span>Fim: <span className="text-text font-medium">{periodoComp.fim}</span></span>
                </div>
                <p className="mt-1 text-[11px] text-text-subtle">
                  Leads, campanhas e métricas do período serão incluídos no snapshot.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-danger/20 bg-danger/8 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            loading={generating}
            disabled={!clienteId || !periodoValido}
            icon={<Sparkles size={15} />}
          >
            {generating ? "Gerando relatório…" : "Gerar Relatório"}
          </Button>
        </>
      )}
    </div>
  );
}
