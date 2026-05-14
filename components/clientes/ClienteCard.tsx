"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Users2, TrendingUp, DollarSign, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { ClienteComMetricas } from "@/lib/actions/clientes";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface ClienteCardProps {
  cliente: ClienteComMetricas;
}

export function ClienteCard({ cliente }: ClienteCardProps) {
  return (
    <Link href={`/clientes/${cliente.id}`} className="block group">
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-5 shadow-card transition-all duration-200 hover:border-accent/30 hover:shadow-glow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
              <Building2 size={18} className="text-accent" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-text truncate leading-tight group-hover:text-accent transition-colors">
                {cliente.nome_empresa}
              </p>
              <p className="text-xs text-text-subtle truncate mt-0.5">
                {cliente.responsavel}
              </p>
            </div>
          </div>
          <Badge variant={cliente.status} dot className="shrink-0" />
        </div>

        {/* Segmento */}
        {cliente.segmento && (
          <p className="text-xs text-text-muted mb-4 px-2 py-1 rounded-lg bg-bg-surface2 inline-block">
            {cliente.segmento}
          </p>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-bg-border">
          <KPIStat
            icon={<Users2 size={13} />}
            label="Leads / sem"
            value={String(cliente.leads_semana)}
            highlight={cliente.leads_semana > 0}
          />
          <KPIStat
            icon={<TrendingUp size={13} />}
            label="CPL médio"
            value={cliente.cpl_medio > 0 ? formatCurrency(cliente.cpl_medio) : "—"}
          />
          <KPIStat
            icon={<DollarSign size={13} />}
            label="Receita / sem"
            value={
              cliente.receita_semana > 0
                ? formatCurrency(cliente.receita_semana)
                : "—"
            }
            highlight={cliente.receita_semana > 0}
          />
        </div>
      </div>
    </Link>
  );
}

function KPIStat({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-text-subtle">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={`text-sm font-semibold tabular-nums ${
          highlight ? "text-success" : "text-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// Variantes de animação (usadas no container)
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

// Wrapper animado para usar no grid
export function AnimatedClienteGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedClienteCard({ cliente }: ClienteCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <ClienteCard cliente={cliente} />
    </motion.div>
  );
}
