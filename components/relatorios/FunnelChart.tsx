"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

// ================================================================
// FunnelChart — visualização de funil horizontal animada
// ================================================================

const STEPS = [
  { key: "novo",              label: "Leads recebidos", color: "bg-accent" },
  { key: "em_contato",        label: "Em contato",      color: "bg-accent/80" },
  { key: "qualificado",       label: "Qualificados",    color: "bg-success" },
  { key: "orcamento_enviado", label: "Orçamentos",      color: "bg-warning" },
  { key: "venda_fechada",     label: "Vendas fechadas", color: "bg-success" },
] as const;

interface Props {
  funil: Record<string, number>;
}

export function FunnelChart({ funil }: Props) {
  const ref      = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const max = STEPS.reduce((m, s) => Math.max(m, funil[s.key] ?? 0), 1);

  return (
    <div ref={ref} className="flex flex-col gap-4">
      {STEPS.map(({ key, label, color }, idx) => {
        const count     = funil[key] ?? 0;
        const widthPct  = max > 0 ? (count / max) * 100 : 0;
        const prevCount = idx > 0 ? (funil[STEPS[idx - 1].key] ?? 0) : count;
        const dropRate  = prevCount > 0 && idx > 0
          ? Math.round((1 - count / prevCount) * 100)
          : null;

        return (
          <div key={key} className="flex items-center gap-4">
            {/* Label */}
            <div className="w-40 shrink-0 text-right">
              <p className="text-sm font-medium text-text">{label}</p>
              {dropRate !== null && dropRate > 0 && (
                <p className="text-[11px] text-text-subtle mt-0.5">
                  ↓ {dropRate}% de perda
                </p>
              )}
            </div>

            {/* Bar */}
            <div className="flex-1 h-9 rounded-full bg-white/5 overflow-hidden relative">
              <motion.div
                className={`h-full rounded-full ${color}`}
                initial={{ width: "0%" }}
                animate={isInView ? { width: `${widthPct}%` } : { width: "0%" }}
                transition={{
                  duration:  0.9,
                  delay:     idx * 0.12,
                  ease:      "easeOut",
                }}
              />
            </div>

            {/* Count */}
            <div className="w-12 shrink-0 text-right">
              <p className="text-base font-bold text-text tabular-nums">{count}</p>
            </div>
          </div>
        );
      })}

      {/* Taxa de conversão total */}
      {(() => {
        const total  = funil.novo ?? 0;
        const vendas = funil.venda_fechada ?? 0;
        if (total === 0) return null;
        const taxa   = ((vendas / total) * 100).toFixed(1);
        return (
          <div className="mt-2 flex items-center justify-end gap-2">
            <span className="text-xs text-text-subtle">Taxa de conversão total:</span>
            <span className="text-sm font-bold text-success">{taxa}%</span>
          </div>
        );
      })()}
    </div>
  );
}
