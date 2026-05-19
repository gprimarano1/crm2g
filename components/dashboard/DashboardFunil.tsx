"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users2, Receipt, ShoppingCart, TrendingDown } from "lucide-react";
import type { FunilStage } from "@/lib/types/dashboard";

const META: Record<string, { icon: React.ElementType; color: string; bar: string; ring: string }> = {
  Leads: {
    icon:  Users2,
    color: "text-accent",
    bar:   "bg-accent",
    ring:  "ring-accent/20",
  },
  Orçamentos: {
    icon:  Receipt,
    color: "text-warning",
    bar:   "bg-warning",
    ring:  "ring-warning/20",
  },
  Vendas: {
    icon:  ShoppingCart,
    color: "text-success",
    bar:   "bg-success",
    ring:  "ring-success/20",
  },
};

interface Props {
  stages: FunilStage[];
}

export function DashboardFunil({ stages }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const max = Math.max(1, ...stages.map((s) => s.count));
  const topo = stages[0]?.count ?? 0;

  if (stages.every((s) => s.count === 0)) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-bg-border">
        <p className="text-sm text-text-subtle">Sem dados no período</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col gap-4">
      {stages.map((stage, idx) => {
        const meta     = META[stage.label] ?? META.Leads;
        const Icon     = meta.icon;
        const pct      = max > 0 ? (stage.count / max) * 100 : 0;
        const prev     = idx > 0 ? stages[idx - 1].count : stage.count;
        const conversao = idx > 0 && prev > 0 ? (stage.count / prev) * 100 : null;
        const queda    = conversao !== null ? 100 - conversao : null;

        return (
          <motion.div
            key={stage.label}
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: idx * 0.12, ease: "easeOut" }}
            className="flex items-center gap-4"
          >
            {/* Ícone + label */}
            <div className="flex w-32 shrink-0 items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-bg-surface2 ring-1 ${meta.ring}`}>
                <Icon size={16} className={meta.color} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-text">{stage.label}</div>
                {queda !== null && queda > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-text-subtle">
                    <TrendingDown size={9} />
                    {queda.toFixed(0)}% perda
                  </div>
                )}
              </div>
            </div>

            {/* Barra */}
            <div className="relative h-9 flex-1 overflow-hidden rounded-full bg-bg-surface2">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${meta.bar}`}
                initial={{ width: 0 }}
                animate={inView ? { width: `${pct}%` } : {}}
                transition={{ duration: 0.8, delay: idx * 0.12 + 0.1, ease: "easeOut" }}
              />
              {conversao !== null && (
                <div className="absolute inset-y-0 right-3 flex items-center text-[11px] font-medium text-text-muted">
                  {conversao.toFixed(0)}% do estágio anterior
                </div>
              )}
            </div>

            {/* Count */}
            <div className="w-16 shrink-0 text-right">
              <div className="font-display text-xl font-bold text-text tabular-nums">
                {stage.count.toLocaleString("pt-BR")}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Conversão global Leads → Vendas */}
      {topo > 0 && stages.length >= 2 && (
        <div className="mt-2 flex items-center justify-end gap-2 border-t border-bg-border pt-3 text-xs">
          <span className="text-text-subtle">Conversão total (leads → vendas):</span>
          <span className="font-display text-sm font-bold text-success">
            {(((stages[stages.length - 1].count) / topo) * 100).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
