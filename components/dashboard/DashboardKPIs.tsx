"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users2,
  DollarSign,
  ShoppingCart,
  Banknote,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardKPIs } from "@/lib/types/dashboard";

// ================================================================
// Animated counter
// ================================================================

function AnimatedNumber({
  value,
  duration = 1200,
  formatter,
}: {
  value:      number;
  duration?:  number;
  formatter:  (v: number) => string;
}) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    function step(now: number) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{formatter(displayed)}</span>;
}

// ================================================================
// KPI card variants
// ================================================================

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

// ================================================================
// Formatters
// ================================================================

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(v);

const fmtInt = (v: number) => v.toLocaleString("pt-BR");

// ================================================================
// KPICard
// ================================================================

function KPICard({
  icon,
  label,
  value,
  sub,
  iconColor,
  animate,
  formatter,
}: {
  icon:      React.ReactNode;
  label:     string;
  value:     number;
  sub?:      string;
  iconColor: string;
  animate?:  boolean;
  formatter: (v: number) => string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="flex flex-col gap-4 rounded-2xl border border-bg-border bg-bg-surface p-5"
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconColor)}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-text-muted">{label}</p>
        <p className="font-display text-2xl font-bold text-text tabular-nums mt-0.5">
          {animate ? (
            <AnimatedNumber value={value} formatter={formatter} />
          ) : (
            formatter(value)
          )}
        </p>
        {sub && <p className="text-xs text-text-subtle mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ================================================================
// DashboardKPIs — exported
// ================================================================

export function DashboardKPIs({ kpis }: { kpis: DashboardKPIs }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 xl:grid-cols-5"
    >
      <KPICard
        icon={<DollarSign size={20} />}
        label="Investimento total"
        value={kpis.investimento_total}
        iconColor="bg-warning/10 text-warning"
        formatter={fmtBRL}
        animate
      />
      <KPICard
        icon={<Users2 size={20} />}
        label="Leads captados"
        value={kpis.leads_total}
        sub="todos os clientes"
        iconColor="bg-accent/10 text-accent"
        formatter={fmtInt}
        animate
      />
      <KPICard
        icon={<BarChart3 size={20} />}
        label="CPL médio"
        value={kpis.cpl_medio}
        sub="custo por lead"
        iconColor="bg-accent/10 text-accent"
        formatter={fmtBRL}
        animate
      />
      <KPICard
        icon={<ShoppingCart size={20} />}
        label="Vendas fechadas"
        value={kpis.vendas_fechadas}
        iconColor="bg-success/10 text-success"
        formatter={fmtInt}
        animate
      />
      <KPICard
        icon={<Banknote size={20} />}
        label="Receita gerada"
        value={kpis.receita_total}
        iconColor="bg-success/10 text-success"
        formatter={fmtBRL}
        animate
      />
    </motion.div>
  );
}
