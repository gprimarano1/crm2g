"use client";

import { motion } from "framer-motion";
import { TrendingUp, Trophy } from "lucide-react";
import type { TopProduto } from "@/lib/orcamentos/agregacoes";

function brl(v: number): string {
  return Number(v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

interface Props {
  itens: TopProduto[];
}

export function TopProdutosCard({ itens }: Props) {
  if (itens.length === 0) {
    return (
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-subtle">
          <TrendingUp size={12} /> Itens mais orçados
        </div>
        <p className="text-sm text-text-muted">Sem produtos no período selecionado.</p>
      </div>
    );
  }

  const maxOcorr = Math.max(...itens.map((i) => i.ocorrencias));

  return (
    <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-accent" />
          <h3 className="font-display text-sm font-semibold text-text">
            Itens mais orçados
          </h3>
        </div>
        <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-subtle">
          top {itens.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {itens.map((p, idx) => {
          const pct = (p.ocorrencias / maxOcorr) * 100;
          return (
            <motion.div
              key={`${p.nome}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
              className="group rounded-lg border border-bg-border/60 bg-bg p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-[11px] font-bold text-accent">
                    {idx + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-text">
                    {p.nome}
                  </span>
                </div>
                <span className="shrink-0 font-display text-sm font-semibold text-text">
                  {brl(p.total)}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg-surface2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.03 }}
                    className="h-full rounded-full bg-accent/70"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[11px] text-text-subtle">
                  <span>
                    <strong className="text-text-muted">{p.ocorrencias}</strong> orç.
                  </span>
                  <span>
                    <strong className="text-text-muted">{p.quantidade}</strong> un.
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
