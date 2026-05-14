"use client";

import { useEffect, useRef } from "react";
import { useInView, animate } from "framer-motion";

// ================================================================
// AnimatedCounter
//
// Anima de 0 até `value` quando entra na viewport.
// Suporta formatadores: moeda (R$), porcentagem e inteiro.
// ================================================================

export type CounterFormatter = (v: number) => string;

export const fmtBRL: CounterFormatter = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(v);

export const fmtPct: CounterFormatter = (v) => `${v.toFixed(1)}%`;

export const fmtInt: CounterFormatter = (v) => v.toLocaleString("pt-BR");

interface Props {
  value:     number;
  format:    CounterFormatter;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, format, duration = 1.6, className }: Props) {
  const ref      = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const started  = useRef(false);

  useEffect(() => {
    if (!isInView || started.current) return;
    started.current = true;

    const controls = animate(0, value, {
      duration,
      ease:     "easeOut",
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = format(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [isInView, value, format, duration]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
