"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Users2,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadCard, leadCardVariants, leadGridVariants, STATUS_CONFIG } from "./LeadCard";
import { LeadPanel } from "./LeadPanel";
import type { Lead, LeadStatus, LeadStatusHistory, LeadStatusCounts } from "@/lib/actions/leads";

// ================================================================
// Tipos locais
// ================================================================

interface LeadsContainerProps {
  clienteId: string;
  initialLeads: Lead[];
  initialTotal: number;
  initialCounts: LeadStatusCounts;
  campanhas: string[];
  showClientSelector?: boolean;
  clientes?: Array<{ id: string; nome_empresa: string }>;
  isClienteView?: boolean;
}

// ================================================================
// Status counter chip
// ================================================================

function StatusChip({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all",
        active
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-bg-border bg-bg-surface2 text-text-muted hover:border-bg-border hover:text-text"
      )}
    >
      <span className={cn("text-sm font-bold tabular-nums", active ? "text-accent" : color)}>
        {count}
      </span>
      {label}
    </button>
  );
}

// ================================================================
// Período options
// ================================================================

const PERIODOS = [
  { value: "hoje", label: "Hoje" },
  { value: "7d",   label: "7 dias" },
  { value: "30d",  label: "30 dias" },
  { value: "mes",  label: "Este mês" },
  { value: "todos", label: "Tudo" },
];

// ================================================================
// LeadsContainer — componente principal
// ================================================================

export function LeadsContainer({
  clienteId,
  initialLeads,
  initialTotal,
  initialCounts,
  campanhas,
  showClientSelector = false,
  clientes = [],
  isClienteView = false,
}: LeadsContainerProps) {
  const router    = useRouter();
  const pathname  = usePathname();
  const params    = useSearchParams();

  // Estado dos leads
  const [leads, setLeads]               = useState<Lead[]>(initialLeads);
  const [total, setTotal]               = useState(initialTotal);
  const [counts, setCounts]             = useState<LeadStatusCounts>(initialCounts);
  const [highlightedIds, setHighlighted] = useState<Record<string, true>>({});
  const [newLeadIds, setNewLeadIds]     = useState<Record<string, true>>({});

  // Panel
  const [selectedLead, setSelectedLead]   = useState<Lead | null>(null);
  const [panelHistory, setPanelHistory]   = useState<LeadStatusHistory[]>([]);
  const [panelOpen, setPanelOpen]         = useState(false);
  const [, setPanelLoading]   = useState(false);

  // Filtros (state-based para cliente, URL-based pode ser lido abaixo)
  const [statusFilter, setStatusFilter]   = useState(params.get("status") ?? "todos");
  const [periodoFilter, setPeriodoFilter] = useState(params.get("periodo") ?? "7d");
  const [campanhaFilter, setCampanhaFilter] = useState(params.get("campanha") ?? "");
  const [page, setPage]                  = useState(1);
  const [hasMore, setHasMore]            = useState(initialTotal > initialLeads.length);
  const [loadingMore, startLoadingMore]  = useTransition();

  // Sincroniza filtros com URL (admin)
  function navigate(updates: Record<string, string>) {
    if (isClienteView) return;
    const p = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== "todos" && v !== "7d") p.set(k, v);
      else p.delete(k);
    });
    router.push(`${pathname}?${p.toString()}`);
  }

  function handleStatusFilter(s: string) {
    setStatusFilter(s);
    navigate({ status: s });
  }

  function handlePeriodoFilter(p: string) {
    setPeriodoFilter(p);
    navigate({ periodo: p });
  }

  // ----------------------------------------------------------------
  // Supabase Realtime subscription
  // ----------------------------------------------------------------

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`leads:${clienteId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "leads",
          filter: `cliente_id=eq.${clienteId}`,
        },
        (payload) => {
          const newLead = payload.new as Lead;

          setLeads((prev) => {
            if (prev.some((l) => l.id === newLead.id)) return prev;
            return [newLead, ...prev];
          });

          setTotal((t) => t + 1);

          setCounts((prev) => ({
            ...prev,
            [newLead.status]: (prev[newLead.status as LeadStatus] ?? 0) + 1,
            total: (prev.total ?? 0) + 1,
          }));

          // Highlight por 3 segundos
          setHighlighted((prev) => ({ ...prev, [newLead.id]: true }));
          setNewLeadIds((prev) => ({ ...prev, [newLead.id]: true }));
          setTimeout(() => {
            setHighlighted((prev) => { const s = { ...prev }; delete s[newLead.id]; return s; });
          }, 3000);
          setTimeout(() => {
            setNewLeadIds((prev) => { const s = { ...prev }; delete s[newLead.id]; return s; });
          }, 10000);
        }
      )
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "leads",
          filter: `cliente_id=eq.${clienteId}`,
        },
        (payload) => {
          const updated = payload.new as Lead;
          const old     = payload.old as Partial<Lead>;
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));

          // Atualiza contadores
          if (old.status && old.status !== updated.status) {
            setCounts((prev) => ({
              ...prev,
              [old.status!]:     Math.max(0, (prev[old.status as LeadStatus] ?? 0) - 1),
              [updated.status]:  (prev[updated.status] ?? 0) + 1,
            }));
          }

          // Atualiza panel se aberto
          if (selectedLead?.id === updated.id) {
            setSelectedLead(updated);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clienteId, selectedLead?.id]);

  // ----------------------------------------------------------------
  // Abrir panel com histórico
  // ----------------------------------------------------------------

  const openPanel = useCallback(async (lead: Lead) => {
    setSelectedLead(lead);
    setPanelOpen(true);
    setPanelHistory([]);
    setPanelLoading(true);

    try {
      const res = await fetch(`/api/leads/${lead.id}/history`);
      if (res.ok) {
        const data = await res.json() as { history: LeadStatusHistory[] };
        setPanelHistory(data.history);
      }
    } finally {
      setPanelLoading(false);
    }
  }, []);

  // ----------------------------------------------------------------
  // Carregar mais leads
  // ----------------------------------------------------------------

  function loadMore() {
    startLoadingMore(async () => {
      const nextPage = page + 1;
      const p = new URLSearchParams({
        cliente_id: clienteId,
        page:       String(nextPage),
        status:     statusFilter !== "todos" ? statusFilter : "",
        periodo:    periodoFilter,
        campanha:   campanhaFilter,
      });

      const res = await fetch(`/api/leads?${p.toString()}`);
      if (res.ok) {
        const data = await res.json() as { leads: Lead[]; hasMore: boolean };
        setLeads((prev) => {
          const existing = new Set(prev.map((l) => l.id));
          return [...prev, ...data.leads.filter((l) => !existing.has(l.id))];
        });
        setPage(nextPage);
        setHasMore(data.hasMore);
      }
    });
  }

  // ----------------------------------------------------------------
  // Filtro local dos leads exibidos
  // ----------------------------------------------------------------

  const filteredLeads = leads.filter((l) => {
    if (statusFilter !== "todos" && l.status !== statusFilter) return false;
    if (campanhaFilter && !l.campanha_origem?.toLowerCase().includes(campanhaFilter.toLowerCase())) return false;
    return true;
  });

  // ================================================================
  // Render
  // ================================================================

  return (
    <div className="flex flex-col gap-5">
      {/* Cliente selector (admin) */}
      {showClientSelector && clientes.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={clienteId}
              onChange={(e) => navigate({ cliente_id: e.target.value })}
              className="h-9 appearance-none rounded-xl border border-bg-border bg-bg-surface2 pl-3 pr-8 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 cursor-pointer"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome_empresa}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
          </div>
        </div>
      )}

      {/* Contadores por status */}
      <div className="flex gap-2 flex-wrap">
        <StatusChip
          label="Todos"
          count={counts.total}
          color="text-text"
          active={statusFilter === "todos"}
          onClick={() => handleStatusFilter("todos")}
        />
        {(Object.entries(STATUS_CONFIG) as [LeadStatus, typeof STATUS_CONFIG[LeadStatus]][]).map(([s, cfg]) => (
          counts[s] > 0 && (
            <StatusChip
              key={s}
              label={cfg.label}
              count={counts[s]}
              color={cfg.color}
              active={statusFilter === s}
              onClick={() => handleStatusFilter(s)}
            />
          )
        ))}
      </div>

      {/* Filtros secundários */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Período */}
        <div className="relative">
          <select
            value={periodoFilter}
            onChange={(e) => handlePeriodoFilter(e.target.value)}
            className="h-8 appearance-none rounded-lg border border-bg-border bg-bg-surface2 pl-2.5 pr-7 text-xs text-text-muted outline-none focus:border-accent cursor-pointer"
          >
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-subtle" />
        </div>

        {/* Campanha */}
        {campanhas.length > 0 && (
          <div className="relative">
            <select
              value={campanhaFilter}
              onChange={(e) => setCampanhaFilter(e.target.value)}
              className="h-8 appearance-none rounded-lg border border-bg-border bg-bg-surface2 pl-2.5 pr-7 text-xs text-text-muted outline-none focus:border-accent cursor-pointer"
            >
              <option value="">Todas as campanhas</option>
              {campanhas.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-subtle" />
          </div>
        )}

        <span className="ml-auto text-xs text-text-subtle">
          {filteredLeads.length} de {total}
        </span>
      </div>

      {/* Lista de leads */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={<Users2 size={22} />}
          title="Nenhum lead encontrado"
          description="Aguardando leads via webhook do Meta Lead Ads."
        />
      ) : (
        <motion.div
          variants={leadGridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredLeads.map((lead) => (
              <motion.div
                key={lead.id}
                variants={leadCardVariants}
                layout
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <LeadCard
                  lead={lead}
                  isNew={!!newLeadIds[lead.id]}
                  isHighlighted={!!highlightedIds[lead.id]}
                  onStatusChange={(updated) => {
                    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
                    if (selectedLead?.id === updated.id) setSelectedLead(updated);
                  }}
                  onClick={() => openPanel(lead)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Carregar mais */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            loading={loadingMore}
            icon={<RefreshCw size={14} />}
          >
            Carregar mais
          </Button>
        </div>
      )}

      {/* Lead Panel drawer */}
      <LeadPanel
        lead={selectedLead}
        history={panelHistory}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onLeadUpdate={(updated) => {
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          setSelectedLead(updated);
        }}
      />
    </div>
  );
}
