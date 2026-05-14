"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingUp, Users, DollarSign, ShoppingCart, Target, CheckCircle2, Zap, AlertTriangle, Lightbulb, Eye } from "lucide-react";
import { AnimatedCounter, fmtBRL, fmtInt, fmtPct } from "@/components/relatorios/AnimatedCounter";
import { Logo } from "@/components/ui/Logo";
import { FunnelChart } from "@/components/relatorios/FunnelChart";
import { incrementVisualizacoes } from "@/lib/actions/relatorios";
import type { Relatorio, RelatorioDados } from "@/lib/actions/relatorios";

// ================================================================
// ViewTracker — fires once on mount
// ================================================================

function ViewTracker({ slug }: { slug: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    incrementVisualizacoes(slug).catch(() => {});
  }, [slug]);
  return null;
}

// ================================================================
// Section wrapper — slide-up on scroll
// ================================================================

function Section({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref      = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ================================================================
// SectionTitle
// ================================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl font-bold text-text mb-6">{children}</h2>
  );
}

// ================================================================
// Dark chart tooltip
// ================================================================

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-bg-border bg-bg-surface px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-text mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-muted capitalize">{p.name}:</span>
          <span className="font-medium text-text">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ================================================================
// InsightCard
// ================================================================

const CATEGORY_CONFIG = {
  destaques:    { label: "Destaques", icon: TrendingUp,    color: "border-success/20 bg-success/8",  iconColor: "text-success" },
  atencao:      { label: "Atenção",   icon: Eye,           color: "border-warning/20 bg-warning/8",  iconColor: "text-warning" },
  alertas:      { label: "Alertas",   icon: AlertTriangle, color: "border-danger/20 bg-danger/8",    iconColor: "text-danger"  },
  oportunidades:{ label: "Oportunidades", icon: Lightbulb, color: "border-accent/20 bg-accent/8",   iconColor: "text-accent"  },
} as const;

function InsightCategoryCard({
  category,
  items,
}: {
  category: keyof typeof CATEGORY_CONFIG;
  items: string[];
}) {
  if (!items.length) return null;
  const cfg  = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border p-5 ${cfg.color}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={cfg.iconColor} />
        <h3 className="text-sm font-semibold text-text">{cfg.label}</h3>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${cfg.iconColor.replace("text-", "bg-")}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ================================================================
// RelatorioPagina — main component
// ================================================================

interface Props {
  relatorio: Relatorio;
  slug:      string;
}

export function RelatorioPagina({ relatorio, slug }: Props) {
  const dados: RelatorioDados = relatorio.dados;
  const { kpis, funil, campanhas, chart, insights, cliente } = dados;

  const inicio = new Date(relatorio.periodo_inicio + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long",
  });
  const fim = new Date(relatorio.periodo_fim + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const topCampanhas = [...campanhas].sort((a, b) => b.gasto - a.gasto).slice(0, 3);

  return (
    <div className="min-h-screen bg-bg text-text">
      <ViewTracker slug={slug} />

      {/* ======================================================== */}
      {/* 1. HERO */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-bg via-bg to-accent/5 border-b border-bg-border">
        {/* Glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent/10 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 mb-6">
              <Zap size={12} className="text-accent" />
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                Relatório de Performance
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold text-text mb-3 leading-tight">
              {cliente.nome_empresa}
            </h1>

            {cliente.segmento && (
              <p className="text-text-subtle text-sm mb-4">{cliente.segmento}</p>
            )}

            <p className="text-text-muted text-base">
              {inicio} — {fim}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14 flex flex-col gap-16">

        {/* ======================================================== */}
        {/* 2. RESUMO EXECUTIVO */}
        {/* ======================================================== */}
        {insights?.resumo_executivo && (
          <Section>
            <SectionTitle>Resumo Executivo</SectionTitle>
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                  <Zap size={15} className="text-accent" />
                </div>
                <p className="text-base text-text leading-relaxed">{insights.resumo_executivo}</p>
              </div>
            </div>
          </Section>
        )}

        {/* ======================================================== */}
        {/* 3. KPIs PRINCIPAIS */}
        {/* ======================================================== */}
        <Section>
          <SectionTitle>KPIs do Período</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <KPICard
              icon={<Users size={16} className="text-accent" />}
              label="Leads captados"
              value={kpis.leads_total}
              format={fmtInt}
              delay={0}
            />
            <KPICard
              icon={<DollarSign size={16} className="text-accent" />}
              label="Investimento"
              value={kpis.investimento}
              format={fmtBRL}
              delay={0.08}
            />
            <KPICard
              icon={<Target size={16} className="text-accent" />}
              label="Custo por Lead"
              value={kpis.cpl}
              format={fmtBRL}
              delay={0.16}
            />
            <KPICard
              icon={<ShoppingCart size={16} className="text-success" />}
              label="Vendas fechadas"
              value={kpis.vendas}
              format={fmtInt}
              delay={0.24}
              accent="success"
            />
            <KPICard
              icon={<TrendingUp size={16} className="text-success" />}
              label="Receita gerada"
              value={kpis.receita}
              format={fmtBRL}
              delay={0.32}
              accent="success"
            />
            {kpis.orcamentos > 0 && (
              <KPICard
                icon={<Target size={16} className="text-warning" />}
                label="Orçamentos"
                value={kpis.orcamentos}
                format={fmtInt}
                delay={0.40}
                accent="warning"
              />
            )}
          </div>
        </Section>

        {/* ======================================================== */}
        {/* 4. GRÁFICO DE PERFORMANCE */}
        {/* ======================================================== */}
        {chart.length > 0 && (
          <Section>
            <SectionTitle>Performance Semanal</SectionTitle>
            <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chart} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--color-text-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--color-text-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="leads" name="leads" fill="#5b6ef5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line dataKey="vendas" name="vendas" type="monotone" stroke="#22d37a" strokeWidth={2} dot={{ r: 4, fill: "#22d37a" }} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-3 justify-center">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="w-3 h-3 rounded-sm bg-accent" />
                  Leads
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="w-3 h-0.5 bg-success" />
                  Vendas
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ======================================================== */}
        {/* 5. CAMPANHAS EM DESTAQUE */}
        {/* ======================================================== */}
        {topCampanhas.length > 0 && (
          <Section>
            <SectionTitle>Campanhas em Destaque</SectionTitle>
            <div className="flex flex-col gap-3">
              {topCampanhas.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                  className="rounded-2xl border border-bg-border bg-bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-semibold text-text text-sm">{c.nome}</p>
                      {c.objetivo && (
                        <p className="text-xs text-text-subtle mt-0.5">{c.objetivo}</p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      c.status === "ativa"
                        ? "bg-success/10 text-success"
                        : "bg-text-subtle/10 text-text-subtle"
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Investimento", value: fmtBRL(c.gasto) },
                      { label: "Leads",        value: fmtInt(c.leads) },
                      { label: "CTR",          value: fmtPct(c.ctr) },
                      { label: "Frequência",   value: c.frequencia.toFixed(1) },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl bg-bg-surface2 px-3 py-2.5 text-center">
                        <p className="text-[10px] text-text-subtle mb-1 uppercase tracking-wide">{m.label}</p>
                        <p className="text-sm font-bold text-text">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ======================================================== */}
        {/* 6. FUNIL DE LEADS */}
        {/* ======================================================== */}
        <Section>
          <SectionTitle>Funil de Leads</SectionTitle>
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-6">
            <FunnelChart funil={funil} />
          </div>
        </Section>

        {/* ======================================================== */}
        {/* 7. INSIGHTS E RECOMENDAÇÕES */}
        {/* ======================================================== */}
        {insights && (
          <Section>
            <SectionTitle>Insights e Recomendações</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InsightCategoryCard category="destaques"     items={insights.destaques     ?? []} />
              <InsightCategoryCard category="oportunidades" items={insights.oportunidades ?? []} />
              <InsightCategoryCard category="atencao"       items={insights.atencao       ?? []} />
              <InsightCategoryCard category="alertas"       items={insights.alertas       ?? []} />
            </div>
          </Section>
        )}

        {/* ======================================================== */}
        {/* 8. PRÓXIMOS PASSOS */}
        {/* ======================================================== */}
        {insights?.proximos_passos && insights.proximos_passos.length > 0 && (
          <Section>
            <SectionTitle>Próximos Passos</SectionTitle>
            <div className="rounded-2xl border border-bg-border bg-bg-surface p-6 flex flex-col gap-4">
              {insights.proximos_passos.map((passo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
                  className="flex items-start gap-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex items-start gap-3 pt-1.5">
                    <CheckCircle2 size={16} className="shrink-0 text-success mt-0.5" />
                    <p className="text-sm text-text-muted leading-relaxed">{passo}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* ======================================================== */}
      {/* 9. FOOTER */}
      {/* ======================================================== */}
      <footer className="border-t border-bg-border py-10 text-center">
        <div className="flex justify-center mb-2">
          <Logo size="sm" />
        </div>
        <p className="text-xs text-text-subtle">Relatório gerado automaticamente por CRM 2G</p>
        <p className="text-xs text-text-subtle mt-1">{inicio} — {fim}</p>
      </footer>
    </div>
  );
}

// ================================================================
// KPICard — animated counter card
// ================================================================

function KPICard({
  icon,
  label,
  value,
  format,
  delay = 0,
  accent = "accent",
}: {
  icon:   React.ReactNode;
  label:  string;
  value:  number;
  format: (v: number) => string;
  delay?: number;
  accent?: "accent" | "success" | "warning";
}) {
  const ref      = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const ringColor = {
    accent:  "ring-accent/20",
    success: "ring-success/20",
    warning: "ring-warning/20",
  }[accent];

  const bgColor = {
    accent:  "bg-accent/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
  }[accent];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="rounded-2xl border border-bg-border bg-bg-surface p-5 flex flex-col gap-3"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${bgColor} ${ringColor}`}>
        {icon}
      </div>
      <div>
        <AnimatedCounter value={value} format={format} className="font-display text-2xl font-bold text-text" />
        <p className="text-xs text-text-subtle mt-1">{label}</p>
      </div>
    </motion.div>
  );
}
