"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardAlert } from "@/lib/types/dashboard";

const ALERT_CONFIG = {
  frequencia: {
    icon:      AlertTriangle,
    color:     "text-warning",
    bg:        "bg-warning/8",
    border:    "border-warning/20",
    dot:       "bg-warning",
  },
  ctr: {
    icon:      TrendingDown,
    color:     "text-warning",
    bg:        "bg-warning/8",
    border:    "border-warning/20",
    dot:       "bg-warning",
  },
  orcamento: {
    icon:      DollarSign,
    color:     "text-danger",
    bg:        "bg-danger/8",
    border:    "border-danger/20",
    dot:       "bg-danger",
  },
};

function AlertCard({ alert }: { alert: DashboardAlert }) {
  const cfg  = ALERT_CONFIG[alert.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3",
        cfg.bg, cfg.border
      )}
    >
      <div className={cn("mt-0.5 shrink-0", cfg.color)}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className={cn("text-xs font-semibold", cfg.color)}>{alert.title}</p>
        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{alert.message}</p>
      </div>
    </motion.div>
  );
}

export function DashboardAlerts({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-3 py-2.5">
        <Zap size={14} className="text-success shrink-0" />
        <p className="text-xs text-success font-medium">
          Tudo dentro do esperado — nenhum alerta ativo.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="flex flex-col gap-2">
        {alerts.map((alert, i) => (
          <AlertCard key={`${alert.type}-${i}`} alert={alert} />
        ))}
      </div>
    </AnimatePresence>
  );
}
