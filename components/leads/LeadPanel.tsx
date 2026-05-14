"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageCircle,
  Clock,
  Megaphone,
  Mail,
  Phone,
  FileText,
  DollarSign,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { STATUS_CONFIG } from "./LeadCard";
import type { Lead, LeadStatus, LeadStatusHistory } from "@/lib/actions/leads";

// ================================================================
// Types
// ================================================================

interface LeadPanelProps {
  lead: Lead | null;
  history: LeadStatusHistory[];
  open: boolean;
  onClose: () => void;
  onLeadUpdate: (lead: Lead) => void;
}

// ================================================================
// Helpers
// ================================================================

function formatWhatsApp(telefone: string): string {
  const d = telefone.replace(/\D/g, "");
  return d.startsWith("55") ? d : `55${d}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "2-digit",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "2-digit"
  });
}

// ================================================================
// InfoRow — linha de detalhe
// ================================================================

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-text-subtle">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-text-subtle uppercase tracking-wide">{label}</p>
        <p className="text-sm text-text break-words">{value}</p>
      </div>
    </div>
  );
}

// ================================================================
// HistoryItem
// ================================================================

function HistoryItem({ item }: { item: LeadStatusHistory }) {
  const cfg = STATUS_CONFIG[item.status_novo as LeadStatus] ?? STATUS_CONFIG.novo;
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
        <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {item.status_anterior && (
            <>
              <span className="text-xs text-text-subtle">{STATUS_CONFIG[item.status_anterior as LeadStatus]?.label ?? item.status_anterior}</span>
              <ChevronRight size={12} className="text-text-subtle shrink-0" />
            </>
          )}
          <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
        </div>
        {item.notas && (
          <p className="mt-0.5 text-xs text-text-muted">{item.notas}</p>
        )}
        <p className="mt-0.5 text-[11px] text-text-subtle">{formatDateTime(item.created_at)}</p>
      </div>
    </div>
  );
}

// ================================================================
// LeadPanel — drawer lateral
// ================================================================

export function LeadPanel({ lead, history, open, onClose, onLeadUpdate }: LeadPanelProps) {
  const [notas, setNotas]             = useState("");
  const [valorVenda, setValorVenda]   = useState("");
  const [savingNotas, setSavingNotas] = useState(false);
  const [notesSaved, setNotesSaved]   = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);

  // Fecha ao pressionar Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Trava scroll do body
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Sincroniza campos ao trocar de lead (intencional: só re-executa quando o ID muda)
  useEffect(() => {
    if (lead) {
      setNotas(lead.notas ?? "");
      setValorVenda(lead.valor_venda ? String(lead.valor_venda) : "");
      setNotesSaved(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id]);

  async function handleSaveNotas() {
    if (!lead) return;
    setSavingNotas(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: lead.status, notas }),
      });
      if (res.ok) {
        const { lead: updated } = await res.json() as { lead: Lead };
        onLeadUpdate(updated);
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      }
    } finally {
      setSavingNotas(false);
    }
  }

  async function handleStatusWithValue(newStatus: LeadStatus) {
    if (!lead) return;
    setPendingStatus(newStatus);
  }

  async function handleConfirmStatusChange() {
    if (!lead || !pendingStatus) return;
    setSavingStatus(true);
    try {
      const val = valorVenda ? parseFloat(valorVenda.replace(",", ".")) : undefined;
      const res = await fetch(`/api/leads/${lead.id}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          status:      pendingStatus,
          notas:       notas || undefined,
          valor_venda: val,
        }),
      });
      if (res.ok) {
        const { lead: updated } = await res.json() as { lead: Lead };
        onLeadUpdate(updated);
        setPendingStatus(null);
      }
    } finally {
      setSavingStatus(false);
    }
  }

  if (!lead) return null;

  const cfg = STATUS_CONFIG[lead.status];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-bg-border bg-bg-surface shadow-card overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-bg-border px-5 py-4">
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-text truncate">
                  {lead.nome}
                </p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                    cfg.color, cfg.bg, cfg.border
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-text-subtle">
                    {formatDate(lead.created_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-text-subtle transition-colors hover:bg-bg-surface2 hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scroll body */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-6 p-5">

                {/* Detalhes de contato */}
                <section className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Contato
                  </h3>
                  <div className="flex flex-col gap-3 rounded-2xl border border-bg-border bg-bg-surface2 p-4">
                    <InfoRow icon={<Phone size={14} />}    label="Telefone"  value={lead.telefone} />
                    <InfoRow icon={<Mail size={14} />}     label="E-mail"    value={lead.email} />
                    <InfoRow icon={<Megaphone size={14} />} label="Campanha" value={lead.campanha_origem} />
                    <InfoRow icon={<FileText size={14} />} label="Conjunto"  value={lead.conjunto_origem} />
                    <InfoRow icon={<Clock size={14} />}    label="Recebido"  value={formatDateTime(lead.created_at)} />
                  </div>

                  {lead.telefone && (
                    <a
                      href={`https://wa.me/${formatWhatsApp(lead.telefone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl border border-bg-border py-2.5 text-sm font-medium text-text-muted transition-all hover:border-success/30 hover:bg-success/8 hover:text-success"
                    >
                      <MessageCircle size={15} />
                      Abrir no WhatsApp
                    </a>
                  )}
                </section>

                {/* Mudança de status */}
                <section className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Status
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(["novo", "em_contato", "qualificado", "orcamento_enviado", "venda_fechada", "perdido"] as LeadStatus[]).map((s) => {
                      const c = STATUS_CONFIG[s];
                      const active = lead.status === s;
                      const isSale = s === "venda_fechada";
                      return (
                        <button
                          key={s}
                          onClick={() => isSale ? handleStatusWithValue(s) : void (async () => {
                            const res = await fetch(`/api/leads/${lead.id}/status`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: s, notas: notas || undefined }),
                            });
                            if (res.ok) {
                              const { lead: updated } = await res.json() as { lead: Lead };
                              onLeadUpdate(updated);
                            }
                          })()}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all",
                            active
                              ? cn("font-semibold shadow-glow-sm", c.color, c.bg, c.border)
                              : "border-bg-border text-text-muted hover:bg-bg-surface2 hover:text-text"
                          )}
                        >
                          <span className={cn("h-2 w-2 rounded-full shrink-0", c.dot)} />
                          {c.label}
                          {active && <CheckCircle2 size={11} className="ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo de valor para venda fechada */}
                  {(pendingStatus === "venda_fechada" || lead.status === "venda_fechada") && (
                    <div className="rounded-xl border border-success/20 bg-success/5 p-3">
                      <label className="text-xs font-medium text-text-muted block mb-1.5">
                        Valor da venda (R$)
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            value={valorVenda}
                            onChange={(e) => setValorVenda(e.target.value)}
                            className="w-full rounded-lg border border-bg-border bg-bg-surface2 pl-8 pr-3 py-2 text-sm text-text outline-none focus:border-success focus:ring-2 focus:ring-success/15"
                          />
                        </div>
                        {pendingStatus === "venda_fechada" && (
                          <Button
                            size="sm"
                            onClick={handleConfirmStatusChange}
                            loading={savingStatus}
                          >
                            Salvar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* Notas */}
                <section className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Notas internas
                  </h3>
                  <textarea
                    rows={4}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Adicione observações sobre este lead…"
                    className="w-full resize-none rounded-xl border border-bg-border bg-bg-surface2 px-4 py-3 text-sm text-text outline-none placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/15"
                  />
                  <div className="flex items-center justify-between">
                    {notesSaved && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle2 size={12} /> Salvo
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveNotas}
                      loading={savingNotas}
                      className="ml-auto"
                    >
                      Salvar notas
                    </Button>
                  </div>
                </section>

                {/* Histórico de status */}
                {history.length > 0 && (
                  <section className="flex flex-col gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                      Histórico
                    </h3>
                    <div className="flex flex-col gap-3 rounded-2xl border border-bg-border bg-bg-surface2 p-4">
                      {history.map((item) => (
                        <HistoryItem key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
