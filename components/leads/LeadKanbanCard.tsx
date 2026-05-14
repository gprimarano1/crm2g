"use client";

import { MessageCircle, Megaphone, Clock, User2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/lib/actions/leads";

// ================================================================
// Helpers
// ================================================================

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  if (hrs < 48)  return "ontem";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatCurrency(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function formatWhatsApp(telefone: string): string {
  const d = telefone.replace(/\D/g, "");
  return d.startsWith("55") ? d : `55${d}`;
}

// ================================================================
// Action button component
// ================================================================

function ActionBtn({
  label,
  color,
  onClick,
}: {
  label: string;
  color: "accent" | "danger" | "success" | "purple" | "warning";
  onClick: (e: React.MouseEvent) => void;
}) {
  const styles: Record<string, string> = {
    accent:  "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20",
    danger:  "border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
    success: "border-success/30 bg-success/10 text-success hover:bg-success/20",
    purple:  "border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa] hover:bg-[#a78bfa]/20",
    warning: "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-8 flex-1 items-center justify-center rounded-xl border text-[11px] font-semibold transition-colors",
        styles[color]
      )}
    >
      {label}
    </button>
  );
}

// ================================================================
// Props
// ================================================================

type ActionType = "atendimento" | "desqualificar" | "orcamento" | "fechar_venda";

interface LeadKanbanCardProps {
  lead: Lead;
  isNew?: boolean;
  onAction: (type: ActionType) => void;
  onClick: () => void;
}

// ================================================================
// LeadKanbanCard
// ================================================================

export function LeadKanbanCard({ lead, isNew = false, onAction, onClick }: LeadKanbanCardProps) {
  const status = lead.status as LeadStatus;

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-2xl border bg-bg-surface p-3.5 transition-all duration-200",
        "hover:border-accent/25 hover:shadow-[0_0_0_1px_rgba(91,110,245,0.1)]",
        isNew
          ? "border-accent/40 bg-accent/5"
          : "border-bg-border"
      )}
    >
      {/* New badge */}
      {isNew && (
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-accent">Novo</span>
        </div>
      )}

      {/* Header: nome + tempo */}
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 truncate text-sm font-semibold leading-tight text-text">
          {lead.nome}
        </p>
        <span className="flex shrink-0 items-center gap-0.5 text-[11px] text-text-subtle">
          <Clock size={10} />
          {formatTime(lead.created_at)}
        </span>
      </div>

      {/* Contato */}
      {(lead.telefone || lead.email) && (
        <p className="mt-1 truncate text-xs text-text-muted">
          {lead.telefone ?? lead.email}
        </p>
      )}

      {/* Campanha */}
      {lead.campanha_origem && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-text-subtle">
          <Megaphone size={10} className="shrink-0" />
          <span className="truncate">{lead.campanha_origem}</span>
        </div>
      )}

      {/* Info por status */}
      {(status === "em_contato" || status === "qualificado") && lead.atendente_nome && (
        <div className="mt-2 flex items-center gap-1 rounded-lg bg-warning/10 px-2 py-1 text-[11px] text-warning">
          <User2 size={10} className="shrink-0" />
          <span className="truncate">{lead.atendente_nome}</span>
        </div>
      )}

      {status === "orcamento_enviado" && lead.orcamento_valor != null && (
        <div className="mt-2 flex items-center gap-1 rounded-lg bg-[#a78bfa]/10 px-2 py-1 text-[11px] text-[#a78bfa]">
          <DollarSign size={10} className="shrink-0" />
          <span className="font-semibold">{formatCurrency(lead.orcamento_valor)}</span>
          {lead.orcamento_arquivo_url && (
            <a
              href={lead.orcamento_arquivo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto underline opacity-70 hover:opacity-100"
            >
              Ver arquivo
            </a>
          )}
        </div>
      )}

      {status === "venda_fechada" && lead.valor_venda != null && (
        <div className="mt-2 flex items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-[11px] text-success">
          <DollarSign size={10} className="shrink-0" />
          <span className="font-semibold">{formatCurrency(lead.valor_venda)}</span>
          {lead.venda_pedido_url && (
            <a
              href={lead.venda_pedido_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto underline opacity-70 hover:opacity-100"
            >
              Ver pedido
            </a>
          )}
        </div>
      )}

      {status === "perdido" && lead.desqualificado_motivo && (
        <p className="mt-2 line-clamp-2 text-[11px] text-danger/80">
          {lead.desqualificado_motivo}
        </p>
      )}

      {/* Separator */}
      <div className="my-2.5 border-t border-bg-border" />

      {/* Action buttons */}
      <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
        {status === "novo" && (
          <>
            <ActionBtn
              label="Iniciar Atendimento"
              color="accent"
              onClick={() => onAction("atendimento")}
            />
            {lead.telefone && (
              <a
                href={`https://wa.me/${formatWhatsApp(lead.telefone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 items-center justify-center gap-1.5 rounded-xl border border-bg-border text-[11px] font-medium text-text-muted transition-colors hover:border-success/30 hover:text-success"
              >
                <MessageCircle size={12} />
                WhatsApp
              </a>
            )}
          </>
        )}

        {(status === "em_contato" || status === "qualificado") && (
          <>
            <div className="flex gap-1.5">
              <ActionBtn label="Orçamento"    color="purple"  onClick={() => onAction("orcamento")} />
              <ActionBtn label="Desqualificar" color="danger"  onClick={() => onAction("desqualificar")} />
            </div>
            {lead.telefone && (
              <a
                href={`https://wa.me/${formatWhatsApp(lead.telefone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 items-center justify-center gap-1.5 rounded-xl border border-bg-border text-[11px] font-medium text-text-muted transition-colors hover:border-success/30 hover:text-success"
              >
                <MessageCircle size={12} />
                WhatsApp
              </a>
            )}
          </>
        )}

        {status === "orcamento_enviado" && (
          <ActionBtn label="Fechar Venda" color="success" onClick={() => onAction("fechar_venda")} />
        )}
      </div>
    </div>
  );
}
