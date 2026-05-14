"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Zap, Target, BarChart2, Users, Link2, MessageSquare, Settings, Palette,
  CheckCircle2, TrendingUp, Shield, Clock, Star, ChevronRight,
} from "lucide-react";
import { registrarVisualizacao } from "@/lib/actions/propostas";
import { Logo } from "@/components/ui/Logo";
import { PropostaAcoes } from "@/components/propostas/PropostaAcoes";
import type { Proposta, PropostaServico } from "@/lib/actions/propostas";

// ================================================================
// ViewTracker
// ================================================================

function ViewTracker({ slug }: { slug: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    registrarVisualizacao(slug).catch(() => {});
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
      initial={{ opacity: 0, y: 36 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl sm:text-3xl font-bold text-text mb-2">{children}</h2>;
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return <p className="text-text-muted text-base mb-8 max-w-xl">{children}</p>;
}

// ================================================================
// Service icons
// ================================================================

const SERVICE_ICON_MAP: Record<string, React.ElementType> = {
  "meta-ads":    Zap,
  "criativos":   Palette,
  "estrategia":  Target,
  "relatorios":  BarChart2,
  "lead-ads":    Users,
  "capi":        Link2,
  "consultoria": MessageSquare,
};

function getServiceIcon(id: string): React.ElementType {
  return SERVICE_ICON_MAP[id] ?? Settings;
}

// ================================================================
// Cronograma hardcoded
// ================================================================

const CRONOGRAMA = [
  {
    semana: "Semana 1",
    titulo: "Onboarding & Setup",
    itens:  ["Acesso às contas e pixels", "Configuração de rastreamento", "Auditoria completa", "Definição de públicos"],
    color:  "bg-accent text-white",
  },
  {
    semana: "Semana 2",
    titulo: "Criação & Lançamento",
    itens:  ["Desenvolvimento de criativos", "Criação das campanhas", "Configuração de segmentação", "Go-live das campanhas"],
    color:  "bg-success text-white",
  },
  {
    semana: "Semana 3",
    titulo: "Otimização & Testes",
    itens:  ["Análise de dados iniciais", "Testes A/B de criativos", "Ajuste de lances e públicos", "Escala do que funciona"],
    color:  "bg-warning text-bg",
  },
  {
    semana: "Semana 4",
    titulo: "Relatório & Alinhamento",
    itens:  ["Relatório completo de performance", "Reunião de alinhamento", "Definição de próximos passos", "Planejamento do mês 2"],
    color:  "bg-accent text-white",
  },
];

// ================================================================
// PropostaPagina
// ================================================================

interface Props {
  proposta: Proposta;
  slug:     string;
}

export function PropostaPagina({ proposta, slug }: Props) {
  const servicosIncluidos = proposta.servicos.filter((s: PropostaServico) => s.incluido);
  const total             = servicosIncluidos.reduce((s, c) => s + (c.valor ?? 0), 0);
  const fmtBRL            = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen bg-bg text-text overflow-x-hidden">
      <ViewTracker slug={slug} />

      {/* ============================================================ */}
      {/* 1. HERO — fullscreen with animated gradient blobs              */}
      {/* ============================================================ */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg">
        {/* Animated blobs */}
        <motion.div
          className="pointer-events-none absolute top-[-10%] left-[-15%] w-[700px] h-[700px] rounded-full bg-accent/15 blur-3xl"
          animate={{ x: [0, 80, -40, 0], y: [0, -60, 80, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute bottom-[-10%] right-[-15%] w-[500px] h-[500px] rounded-full bg-success/10 blur-3xl"
          animate={{ x: [0, -60, 40, 0], y: [0, 50, -70, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-accent/8 blur-2xl"
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            {proposta.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proposta.logo_url}
                alt={proposta.empresa}
                className="h-16 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
                <Zap size={28} className="text-accent" />
              </div>
            )}
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 mb-6"
          >
            <Star size={12} className="text-accent" />
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">Proposta Exclusiva</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-text leading-tight mb-4"
          >
            Proposta para<br />
            <span className="text-accent">{proposta.empresa}</span>
          </motion.h1>

          {proposta.mensagem_personalizada && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="text-text-muted text-lg max-w-2xl mx-auto mb-8 leading-relaxed"
            >
              {proposta.mensagem_personalizada}
            </motion.p>
          )}

          {proposta.prospect_nome && !proposta.mensagem_personalizada && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-text-subtle text-base mb-8"
            >
              Olá, <span className="font-medium text-text-muted">{proposta.prospect_nome}</span> — preparamos esta proposta com cuidado para você.
            </motion.p>
          )}

          {proposta.segmento && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-block rounded-full border border-bg-border bg-bg-surface px-4 py-1.5 text-sm text-text-muted"
            >
              {proposta.segmento}
            </motion.span>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-12"
          >
            <a
              href="#servicos"
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
            >
              Ver proposta completa
              <motion.span
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ↓
              </motion.span>
            </a>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-40 flex flex-col gap-24">

        {/* ============================================================ */}
        {/* 2. APRESENTAÇÃO                                               */}
        {/* ============================================================ */}
        <Section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1 mb-4">
                <Zap size={11} className="text-accent" />
                <span className="text-[11px] font-semibold text-accent uppercase tracking-wide">Quem somos</span>
              </div>
              <SectionTitle>Especialistas em Performance Digital</SectionTitle>
              <p className="text-text-muted leading-relaxed">
                Somos a <span className="font-semibold text-text">CRM 2G</span>, uma agência focada em tráfego pago e geração de leads qualificados via Meta Ads.
                Trabalhamos com dados, criatividade e estratégia para transformar investimento em resultado real para o seu negócio.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Clientes",    valor: "+50"  },
                { label: "Leads/mês",  valor: "+3k"  },
                { label: "Anos",       valor: "3+"   },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-bg-border bg-bg-surface p-4 text-center">
                  <p className="font-display text-2xl font-bold text-accent">{s.valor}</p>
                  <p className="text-xs text-text-subtle mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ============================================================ */}
        {/* 3. O QUE ESTÁ INCLUÍDO                                        */}
        {/* ============================================================ */}
        {servicosIncluidos.length > 0 && (
          <Section>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1 mb-4">
              <CheckCircle2 size={11} className="text-accent" />
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wide">Escopo de serviços</span>
            </div>
            <SectionTitle>O que está incluído</SectionTitle>
            <SectionSubtitle>Cada serviço foi selecionado especificamente para as necessidades de {proposta.empresa}.</SectionSubtitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {servicosIncluidos.map((s, i) => {
                const Icon = getServiceIcon(s.id);
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.5, delay: i * 0.07, ease: "easeOut" }}
                    className="rounded-2xl border border-bg-border bg-bg-surface p-5 flex flex-col gap-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/15">
                      <Icon size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-text text-sm">{s.nome}</p>
                      {s.descricao && <p className="text-xs text-text-muted mt-1 leading-relaxed">{s.descricao}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ============================================================ */}
        {/* 4. RESULTADOS ESPERADOS — KPIs                               */}
        {/* ============================================================ */}
        {proposta.kpis.length > 0 && (
          <Section>
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/8 px-3 py-1 mb-4">
              <TrendingUp size={11} className="text-success" />
              <span className="text-[11px] font-semibold text-success uppercase tracking-wide">Metas e resultados</span>
            </div>
            <SectionTitle>Resultados esperados</SectionTitle>
            <SectionSubtitle>KPIs que nos comprometemos a buscar para {proposta.empresa}.</SectionSubtitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {proposta.kpis.map((k, i) => (
                <motion.div
                  key={k.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                  className="rounded-2xl border border-success/20 bg-success/5 p-6 text-center flex flex-col items-center gap-2"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15">
                    <CheckCircle2 size={18} className="text-success" />
                  </div>
                  <p className="font-display text-lg font-bold text-text">{k.texto}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ============================================================ */}
        {/* 5. INVESTIMENTO                                               */}
        {/* ============================================================ */}
        <Section>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1 mb-4">
            <Target size={11} className="text-accent" />
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wide">Investimento</span>
          </div>
          <SectionTitle>Tabela de investimento</SectionTitle>

          <div className="rounded-2xl border border-bg-border bg-bg-surface overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_120px] gap-4 border-b border-bg-border bg-bg-surface2 px-6 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle">Serviço</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle text-right">Valor/mês</span>
            </div>

            {servicosIncluidos.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="grid grid-cols-[1fr_120px] gap-4 items-center border-b border-bg-border last:border-0 px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={14} className="text-success shrink-0" />
                  <span className="text-sm text-text">{s.nome}</span>
                </div>
                <span className="text-sm font-medium text-text text-right tabular-nums">
                  {s.valor > 0 ? fmtBRL(s.valor) : <span className="text-text-subtle text-xs">Incluso</span>}
                </span>
              </motion.div>
            ))}

            {/* Total */}
            <div className="grid grid-cols-[1fr_120px] gap-4 items-center bg-accent/5 border-t-2 border-accent/20 px-6 py-5">
              <div>
                <p className="font-semibold text-text">Total mensal</p>
                {proposta.prazo_contrato && (
                  <p className="text-xs text-text-muted mt-0.5">Contrato: {proposta.prazo_contrato}</p>
                )}
              </div>
              <div className="text-right">
                {total > 0 ? (
                  <p className="font-display text-xl font-bold text-accent">{fmtBRL(total)}<span className="text-xs font-normal text-text-muted">/mês</span></p>
                ) : (
                  <p className="text-sm font-medium text-text-muted">A combinar</p>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* ============================================================ */}
        {/* 6. CRONOGRAMA                                                 */}
        {/* ============================================================ */}
        <Section>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1 mb-4">
            <Clock size={11} className="text-accent" />
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wide">Linha do tempo</span>
          </div>
          <SectionTitle>Cronograma de onboarding</SectionTitle>
          <SectionSubtitle>Como será a sua jornada nas primeiras 4 semanas.</SectionSubtitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CRONOGRAMA.map((semana, i) => (
              <motion.div
                key={semana.semana}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                className="rounded-2xl border border-bg-border bg-bg-surface p-5 flex flex-col gap-3"
              >
                <span className={`self-start rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${semana.color}`}>
                  {semana.semana}
                </span>
                <p className="font-semibold text-text text-sm">{semana.titulo}</p>
                <ul className="flex flex-col gap-1.5">
                  {semana.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-text-muted">
                      <ChevronRight size={11} className="shrink-0 mt-0.5 text-text-subtle" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ============================================================ */}
        {/* 7. POR QUE A GENTE — Diferenciais                            */}
        {/* ============================================================ */}
        {proposta.diferenciais.length > 0 && (
          <Section>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1 mb-4">
              <Shield size={11} className="text-accent" />
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wide">Nossos diferenciais</span>
            </div>
            <SectionTitle>Por que a CRM 2G?</SectionTitle>
            <SectionSubtitle>O que nos diferencia e por que somos a escolha certa para {proposta.empresa}.</SectionSubtitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {proposta.diferenciais.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                  className="flex items-start gap-4 rounded-2xl border border-bg-border bg-bg-surface p-5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/10 ring-1 ring-success/20">
                    <CheckCircle2 size={16} className="text-success" />
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed pt-1.5">{d.texto}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ============================================================ */}
        {/* 8. CTA FINAL                                                  */}
        {/* ============================================================ */}
        <Section>
          <div className="rounded-2xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 p-8 sm:p-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 ring-1 ring-accent/20">
                  <Zap size={22} className="text-accent" />
                </div>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-text mb-3">
                Pronto para decolar?
              </h2>
              <p className="text-text-muted mb-8 max-w-md mx-auto">
                Aceite a proposta, tire suas dúvidas ou nos conte o que achou. Estamos aqui para você.
              </p>
              <p className="text-xs text-text-subtle">Use os botões abaixo para interagir com esta proposta.</p>
            </motion.div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <footer className="border-t border-bg-border py-8 text-center mb-24 sm:mb-0">
        <div className="flex justify-center mb-1">
          <Logo size="sm" />
        </div>
        <p className="text-xs text-text-subtle">Proposta gerada pela plataforma CRM 2G</p>
      </footer>

      {/* Fixed action bar */}
      <PropostaAcoes slug={slug} statusInicial={proposta.status} />
    </div>
  );
}
