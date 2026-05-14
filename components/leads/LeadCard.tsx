"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  ChevronDown,
  Clock,
  Megaphone,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/lib/actions/leads";

// ================================================================
// Configuração de status
// ================================================================

export const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  novo:              { label: "Novo",             color: "text-accent",       bg: "bg-accent/10",   border: "border-accent/20",   dot: "bg-accent" },
  em_contato:        { label: "Em contato",       color: "text-warning",      bg: "bg-warning/10",  border: "border-warning/20",  dot: "bg-warning" },
  qualificado:       { label: "Qualificado",      color: "text-[#a78bfa]",    bg: "bg-[#a78bfa]/10", border: "border-[#a78bfa]/20", dot: "bg-[#a78bfa]" },
  orcamento_enviado: { label: "Orçamento",        color: "text-accent",       bg: "bg-accent/10",   border: "border-accent/20",   dot: "bg-accent" },
  venda_fechada:     { label: "Venda fechada",    color: "text-success",      bg: "bg-success/10",  border: "border-success/20",  dot: "bg-success" },
  perdido:           { label: "Perdido",          color: "text-danger",       bg: "bg-danger/10",   border: "border-danger/20",   dot: "bg-danger" },
};

const STATUS_ORDER: LeadStatus[] = [
  "novo", "em_contato", "qualificado", "orcamento_enviado", "venda_fechada", "perdido",
];

// ================================================================
// Props
// ================================================================

interface LeadCardProps {
  lead: Lead;
  isNew?: boolean;
  isHighlighted?: boolean;
  compact?: boolean;
  onStatusChange?: (lead: Lead) => void;
  onClick?: () => void;
}

// ================================================================
// Helpers
// ================================================================

function formatWhatsApp(telefone: string): string {
  const digits = telefone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1)  return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  if (hrs < 48)  return "ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ================================================================
// StatusDropdown
// ================================================================

export function StatusDropdown({
  leadId,
  status,
  onStatusChange,
  size = "sm",
}: {
  leadId: string;
  status: LeadStatus;
  onStatusChange?: (updated: Lead) => void;
  size?: "sm" | "md";
}) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const cfg = STATUS_CONFIG[status];

  async function changeStatus(newStatus: LeadStatus) {
    if (newStatus === status) { setOpen(false); return; }
    setOpen(false);
    setLoading(true);

    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const { lead } = await res.json() as { lead: Lead };
        onStatusChange?.(lead);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium transition-all",
          size === "md" ? "text-xs gap-2 px-3 py-1" : "text-[11px]",
          cfg.color, cfg.bg, cfg.border,
          "hover:brightness-110 disabled:opacity-60"
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
        {cfg.label}
        <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-bg-border bg-bg-surface shadow-card py-1">
            {STATUS_ORDER.map((s) => {
              const c = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); changeStatus(s); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors",
                    s === status
                      ? "font-semibold " + c.color
                      : "text-text-muted hover:bg-bg-surface2 hover:text-text"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", c.dot)} />
                  {c.label}
                  {s === status && <span className="ml-auto text-[10px] opacity-60">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ================================================================
// LeadCard
// ================================================================

export function LeadCard({
  lead,
  isNew = false,
  isHighlighted = false,
  compact = false,
  onStatusChange,
  onClick,
}: LeadCardProps) {
  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -16, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "rounded-2xl border bg-bg-surface p-4 transition-all duration-300",
        onClick && "cursor-pointer hover:border-accent/30 hover:shadow-glow-sm",
        isHighlighted
          ? "border-accent/40 bg-accent/5 shadow-glow-sm"
          : "border-bg-border",
        compact && "p-3"
      )}
    >
      {/* New lead indicator */}
      {isNew && (
        <div className="mb-2 flex items-center gap-1.5">
          <Zap size={11} className="text-accent" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
            Novo lead
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Info principal */}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text truncate leading-tight">
            {lead.nome}
          </p>

          {lead.telefone && (
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {lead.telefone}
            </p>
          )}

          {!compact && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {lead.campanha_origem && (
                <span className="flex items-center gap-1 text-[11px] text-text-subtle">
                  <Megaphone size={10} />
                  <span className="truncate max-w-[140px]">{lead.campanha_origem}</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-text-subtle">
                <Clock size={10} />
                {formatTime(lead.created_at)}
              </span>
            </div>
          )}
        </div>

        {/* Lado direito */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusDropdown
            leadId={lead.id}
            status={lead.status}
            onStatusChange={onStatusChange}
          />

          {compact && (
            <span className="text-[11px] text-text-subtle">
              {formatTime(lead.created_at)}
            </span>
          )}
        </div>
      </div>

      {/* WhatsApp button */}
      {lead.telefone && (
        <a
          href={`https://wa.me/${formatWhatsApp(lead.telefone)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "mt-3 flex items-center justify-center gap-2 rounded-xl border border-bg-border",
            "py-2 text-xs font-medium text-text-muted transition-all",
            "hover:border-success/30 hover:bg-success/8 hover:text-success",
            compact && "mt-2"
          )}
        >
          <MessageCircle size={13} />
          Abrir no WhatsApp
        </a>
      )}
    </motion.div>
  );
}

// Variantes para animação do grid
export const leadCardVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0 },
};

export const leadGridVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.04 } },
};
