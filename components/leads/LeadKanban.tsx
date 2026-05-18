"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Upload, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { LeadKanbanCard } from "./LeadKanbanCard";
import { LeadPanel } from "./LeadPanel";
import {
  iniciarAtendimento,
  desqualificarLead,
  marcarOrcamento,
  fecharVenda,
  uploadLeadArquivo,
} from "@/lib/actions/leads";
import type { Lead, LeadStatus, LeadStatusHistory } from "@/lib/actions/leads";

// ================================================================
// Kanban columns config
// ================================================================

const KANBAN_COLS = [
  {
    id:          "novos",
    label:       "Novos",
    statuses:    ["novo"] as LeadStatus[],
    color:       "text-accent",
    bg:          "bg-accent/10",
    border:      "border-accent/20",
    dot:         "bg-accent",
    topBorder:   "border-t-accent",
  },
  {
    id:          "atendimento",
    label:       "Em Atendimento",
    statuses:    ["em_contato", "qualificado"] as LeadStatus[],
    color:       "text-warning",
    bg:          "bg-warning/10",
    border:      "border-warning/20",
    dot:         "bg-warning",
    topBorder:   "border-t-warning",
  },
  {
    id:          "desqualificado",
    label:       "Desqualificado",
    statuses:    ["perdido"] as LeadStatus[],
    color:       "text-danger",
    bg:          "bg-danger/10",
    border:      "border-danger/20",
    dot:         "bg-danger",
    topBorder:   "border-t-danger",
  },
  {
    id:          "orcamento",
    label:       "Orçamento",
    statuses:    ["orcamento_enviado"] as LeadStatus[],
    color:       "text-[#a78bfa]",
    bg:          "bg-[#a78bfa]/10",
    border:      "border-[#a78bfa]/20",
    dot:         "bg-[#a78bfa]",
    topBorder:   "border-t-[#a78bfa]",
  },
  {
    id:          "fechado",
    label:       "Fechado",
    statuses:    ["venda_fechada"] as LeadStatus[],
    color:       "text-success",
    bg:          "bg-success/10",
    border:      "border-success/20",
    dot:         "bg-success",
    topBorder:   "border-t-success",
  },
] as const;

type ColId = typeof KANBAN_COLS[number]["id"];

// ================================================================
// Modal types
// ================================================================

type ModalState =
  | { type: null }
  | { type: "atendimento";   lead: Lead }
  | { type: "desqualificar"; lead: Lead }
  | { type: "orcamento";     lead: Lead }
  | { type: "fechar_venda";  lead: Lead };

// ================================================================
// Modal backdrop + container
// ================================================================

function ModalWrapper({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-bg-border bg-bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function ModalHeader({ title, leadNome, onClose }: { title: string; leadNome: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-bg-border px-5 py-4">
      <div>
        <p className="font-display text-base font-semibold text-text">{title}</p>
        <p className="mt-0.5 text-xs text-text-muted truncate">{leadNome}</p>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded-lg p-1.5 text-text-subtle transition-colors hover:bg-bg-surface2 hover:text-text"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function ModalError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
      <AlertCircle size={13} className="shrink-0" />
      {message}
    </div>
  );
}

// ================================================================
// AtendimentoModal
// ================================================================

function AtendimentoModal({
  lead,
  onClose,
  onSuccess,
}: {
  lead: Lead;
  onClose: () => void;
  onSuccess: (updated: Lead) => void;
}) {
  const [nome, setNome]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit() {
    if (!nome.trim()) { setError("Informe o nome do atendente."); return; }
    setError("");
    setLoading(true);
    try {
      const result = await iniciarAtendimento(lead.id, nome);
      if (!result.success) { setError(result.error ?? "Erro ao atualizar."); return; }
      onSuccess(result.lead!);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Iniciar Atendimento" leadNome={lead.nome} onClose={onClose} />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">Quem vai atender esse lead?</label>
          <input
            ref={inputRef}
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="Nome do atendente"
            className="w-full rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </div>
        {error && <ModalError message={error} />}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">Confirmar</Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ================================================================
// DesqualificarModal
// ================================================================

function DesqualificarModal({
  lead,
  onClose,
  onSuccess,
}: {
  lead: Lead;
  onClose: () => void;
  onSuccess: (updated: Lead) => void;
}) {
  const [motivo, setMotivo]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (motivo.trim().length < 5) { setError("Descreva o motivo (mínimo 5 caracteres)."); return; }
    setError("");
    setLoading(true);
    try {
      const result = await desqualificarLead(lead.id, motivo);
      if (!result.success) { setError(result.error ?? "Erro ao atualizar."); return; }
      onSuccess(result.lead!);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Desqualificar Lead" leadNome={lead.nome} onClose={onClose} />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">
            Motivo da desqualificação <span className="text-danger">*</span>
          </label>
          <textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: sem perfil, orçamento fora do esperado, não atendeu..."
            className="w-full resize-none rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-subtle focus:border-danger focus:ring-2 focus:ring-danger/15"
          />
        </div>
        {error && <ModalError message={error} />}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleSubmit} loading={loading} className="flex-1">
            Desqualificar
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ================================================================
// FileInput — reusável para orçamento e venda
// ================================================================

function FileInput({ onChange }: { onChange: (file: File | null) => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? null);
    onChange(file);
  }

  return (
    <div>
      <label className="text-xs font-medium text-text-muted">Arquivo (PDF ou imagem, opcional)</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-1.5 flex w-full items-center gap-2 rounded-xl border border-dashed border-bg-border bg-bg-surface2 px-3 py-2.5 text-xs text-text-muted transition-colors hover:border-accent/40 hover:text-text"
      >
        <Upload size={14} className="shrink-0 text-text-subtle" />
        <span className="truncate">{fileName ?? "Clique para selecionar arquivo"}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ================================================================
// OrcamentoModal
// ================================================================

function OrcamentoModal({
  lead,
  onClose,
  onSuccess,
}: {
  lead: Lead;
  onClose: () => void;
  onSuccess: (updated: Lead) => void;
}) {
  const [valor, setValor]     = useState("");
  const [file, setFile]       = useState<File | null>(null);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const v = parseFloat(valor.replace(",", "."));
    if (!valor || isNaN(v) || v <= 0) { setError("Informe um valor válido maior que zero."); return; }
    setError("");
    setLoading(true);
    try {
      let arquivoUrl: string | undefined;
      if (file) {
        const fd = new FormData();
        fd.append("arquivo", file);
        const up = await uploadLeadArquivo(fd);
        if (up.error) { setError(`Erro no upload: ${up.error}`); return; }
        arquivoUrl = up.url;
      }
      const result = await marcarOrcamento(lead.id, v, arquivoUrl);
      if (!result.success) { setError(result.error ?? "Erro ao atualizar."); return; }
      onSuccess(result.lead!);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Marcar como Orçamento" leadNome={lead.nome} onClose={onClose} />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">
            Valor do orçamento (R$) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="w-full rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-subtle focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/15"
          />
        </div>
        <FileInput onChange={setFile} />
        {error && <ModalError message={error} />}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            {loading ? "Enviando…" : "Confirmar Orçamento"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ================================================================
// FecharVendaModal
// ================================================================

function FecharVendaModal({
  lead,
  onClose,
  onSuccess,
}: {
  lead: Lead;
  onClose: () => void;
  onSuccess: (updated: Lead) => void;
}) {
  const [valor, setValor]     = useState(lead.orcamento_valor ? String(lead.orcamento_valor) : "");
  const [file, setFile]       = useState<File | null>(null);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const v = parseFloat(valor.replace(",", "."));
    if (!valor || isNaN(v) || v <= 0) { setError("Informe um valor válido maior que zero."); return; }
    setError("");
    setLoading(true);
    try {
      let pedidoUrl: string | undefined;
      if (file) {
        const fd = new FormData();
        fd.append("arquivo", file);
        const up = await uploadLeadArquivo(fd);
        if (up.error) { setError(`Erro no upload: ${up.error}`); return; }
        pedidoUrl = up.url;
      }
      const result = await fecharVenda(lead.id, v, pedidoUrl);
      if (!result.success) { setError(result.error ?? "Erro ao atualizar."); return; }
      onSuccess(result.lead!);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <ModalHeader title="Fechar Venda" leadNome={lead.nome} onClose={onClose} />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-muted">
            Valor da venda (R$) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="w-full rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-subtle focus:border-success focus:ring-2 focus:ring-success/15"
          />
        </div>
        <FileInput onChange={setFile} />
        {error && <ModalError message={error} />}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            {loading ? "Salvando…" : "Confirmar Venda"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ================================================================
// KanbanColumn
// ================================================================

type KanbanCol = typeof KANBAN_COLS[number];

function KanbanColumn({
  col,
  leads,
  newLeadIds,
  onAction,
  onCardClick,
}: {
  col: KanbanCol;
  leads: Lead[];
  newLeadIds: Set<string>;
  onAction: (type: "atendimento" | "desqualificar" | "orcamento" | "fechar_venda", lead: Lead) => void;
  onCardClick: (lead: Lead) => void;
}) {
  return (
    <div className={cn(
      "flex min-w-[175px] flex-1 flex-col rounded-2xl border border-t-2 bg-bg-surface",
      col.topBorder,
      "border-bg-border"
    )}>
      {/* Column header */}
      <div className={cn("flex items-center justify-between px-3.5 py-3 border-b border-bg-border")}>
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", col.dot)} />
          <span className={cn("text-xs font-semibold", col.color)}>{col.label}</span>
        </div>
        <span className={cn(
          "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
          col.bg, col.color
        )}>
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 230px)" }}>
        <AnimatePresence mode="popLayout">
          {leads.map((lead) => (
            <motion.div
              key={lead.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <LeadKanbanCard
                lead={lead}
                isNew={newLeadIds.has(lead.id)}
                onAction={(type) => onAction(type, lead)}
                onClick={() => onCardClick(lead)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
            <span className={cn("h-8 w-8 rounded-full", col.bg, "flex items-center justify-center")}>
              <span className={cn("h-2.5 w-2.5 rounded-full", col.dot)} />
            </span>
            <p className="text-[11px] text-text-subtle">Nenhum lead</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// LeadKanban — componente principal
// ================================================================

interface LeadKanbanProps {
  clienteId: string;
  initialLeads: Lead[];
  showClientSelector?: boolean;
  clientes?: Array<{ id: string; nome_empresa: string }>;
}

export function LeadKanban({
  clienteId,
  initialLeads,
  showClientSelector = false,
  clientes = [],
}: LeadKanbanProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [leads, setLeads]           = useState<Lead[]>(initialLeads);
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());
  const [modal, setModal]           = useState<ModalState>({ type: null });
  const [refreshing, setRefreshing] = useState(false);

  // Panel state
  const [selectedLead, setSelectedLead]   = useState<Lead | null>(null);
  const [panelHistory, setPanelHistory]   = useState<LeadStatusHistory[]>([]);
  const [panelOpen, setPanelOpen]         = useState(false);

  // Agrupar leads por coluna
  const leadsByCol = KANBAN_COLS.reduce<Record<ColId, Lead[]>>((acc, col) => {
    acc[col.id] = leads.filter((l) => (col.statuses as readonly string[]).includes(l.status));
    return acc;
  }, {} as Record<ColId, Lead[]>);

  // ── Realtime subscription (sem filter server-side — filtra no cliente) ─

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`kanban:${clienteId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "leads",
      }, (payload) => {
        const newLead = payload.new as Lead;
        if (newLead.cliente_id !== clienteId) return;
        setLeads((prev) => prev.some((l) => l.id === newLead.id) ? prev : [newLead, ...prev]);
        setNewLeadIds((prev) => { const s = new Set(prev); s.add(newLead.id); return s; });
        setTimeout(() => {
          setNewLeadIds((prev) => { const s = new Set(prev); s.delete(newLead.id); return s; });
        }, 8000);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "leads",
      }, (payload) => {
        const updated = payload.new as Lead;
        if (updated.cliente_id !== clienteId) return;
        setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l));
        setSelectedLead((prev) => prev?.id === updated.id ? updated : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clienteId]);

  // ── Polling via server endpoint — fallback confiável a cada 15s ──

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/leads/kanban?cliente_id=${clienteId}`);
        if (!active || !res.ok) return;
        const body = await res.json() as { leads?: Lead[] };
        const fresh = body.leads;
        if (!active || !Array.isArray(fresh)) return;
        setLeads((prev) => {
          // Não substitui se o retorno estiver vazio e o estado atual tiver leads
          // (evita limpar kanban por falha temporária)
          if (fresh.length === 0 && prev.length > 0) return prev;
          const hasChange =
            fresh.length !== prev.length ||
            fresh.some((d) => {
              const e = prev.find((p) => p.id === d.id);
              return !e || e.status !== d.status || e.updated_at !== d.updated_at;
            });
          return hasChange ? fresh : prev;
        });
      } catch {
        // ignora falhas de rede
      }
    }

    const interval = setInterval(poll, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [clienteId]);

  // ── Abrir panel ──────────────────────────────────────────────

  const openPanel = useCallback(async (lead: Lead) => {
    setSelectedLead(lead);
    setPanelOpen(true);
    setPanelHistory([]);
    try {
      const res = await fetch(`/api/leads/${lead.id}/history`);
      if (res.ok) {
        const data = await res.json() as { history: LeadStatusHistory[] };
        setPanelHistory(data.history);
      }
    } catch {}
  }, []);

  // ── Modal success handler ────────────────────────────────────

  function handleModalSuccess(updated: Lead) {
    setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l));
    if (selectedLead?.id === updated.id) setSelectedLead(updated);
    setModal({ type: null });
  }

  // ── Navigate to different cliente ───────────────────────────

  function navigateToCliente(id: string) {
    const p = new URLSearchParams({ cliente_id: id });
    router.push(`${pathname}?${p.toString()}`);
  }

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Toolbar: cliente selector + refresh button */}
      <div className="flex items-center gap-2">
        {showClientSelector && clientes.length > 0 && (
          <div className="relative inline-flex">
            <select
              defaultValue={clienteId}
              onChange={(e) => navigateToCliente(e.target.value)}
              className="h-9 appearance-none rounded-xl border border-bg-border bg-bg-surface2 pl-3 pr-8 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 cursor-pointer"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome_empresa}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
          </div>
        )}
        <button
          onClick={handleRefresh}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-bg-border bg-bg-surface2 px-3 text-xs font-medium text-text-muted transition-colors hover:bg-bg-surface hover:text-text"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-2 overflow-x-auto pb-4">
        {KANBAN_COLS.map((col) => (
          <KanbanColumn
            key={col.id}
            col={col}
            leads={leadsByCol[col.id] ?? []}
            newLeadIds={newLeadIds}
            onAction={(type, lead) => setModal({ type, lead })}
            onCardClick={openPanel}
          />
        ))}
      </div>

      {/* Lead Panel (drawer) */}
      <LeadPanel
        lead={selectedLead}
        history={panelHistory}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onLeadUpdate={(updated) => {
          setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l));
          setSelectedLead(updated);
        }}
      />

      {/* Modals */}
      {modal.type === "atendimento" && (
        <AtendimentoModal
          lead={modal.lead}
          onClose={() => setModal({ type: null })}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal.type === "desqualificar" && (
        <DesqualificarModal
          lead={modal.lead}
          onClose={() => setModal({ type: null })}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal.type === "orcamento" && (
        <OrcamentoModal
          lead={modal.lead}
          onClose={() => setModal({ type: null })}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal.type === "fechar_venda" && (
        <FecharVendaModal
          lead={modal.lead}
          onClose={() => setModal({ type: null })}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
