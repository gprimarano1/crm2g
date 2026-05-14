"use client";

import { useState, useEffect, useTransition } from "react";
import { Play, Pause, ChevronDown, ChevronRight, Loader2, AlertCircle, LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  getAdSetsAction,
  getAnunciosAction,
  toggleAdSetStatusAction,
  toggleAnuncioStatusAction,
  type AdSetMetaData,
  type AnuncioMetaData,
} from "@/lib/actions/campanhas";

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtNum = (v: number) => new Intl.NumberFormat("pt-BR").format(v);

// ================================================================
// Linha de anúncio individual
// ================================================================

function AnuncioRow({
  ad,
  clienteId,
  onStatusChange,
}: {
  ad: AnuncioMetaData;
  clienteId: string;
  onStatusChange: (id: string, status: "ativa" | "pausada") => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const novoStatus = ad.status === "ativa" ? "pausada" : "ativa";
    startTransition(async () => {
      const res = await toggleAnuncioStatusAction(ad.id, clienteId, novoStatus);
      if (res.success) onStatusChange(ad.id, novoStatus);
    });
  }

  const podeToggle = ad.status === "ativa" || ad.status === "pausada";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-bg-surface transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <LayoutTemplate size={12} className="shrink-0 text-text-muted" />
        <span className="text-xs text-text-muted truncate">{ad.nome}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={ad.status} dot />
        {podeToggle && (
          <button
            onClick={handleToggle}
            disabled={isPending}
            title={ad.status === "ativa" ? "Pausar anúncio" : "Ativar anúncio"}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-bg-border text-text-subtle hover:bg-bg-surface2 hover:text-text transition-colors disabled:opacity-40"
          >
            {isPending ? (
              <Loader2 size={10} className="animate-spin" />
            ) : ad.status === "ativa" ? (
              <Pause size={10} />
            ) : (
              <Play size={10} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ================================================================
// Linha de ad set (com expand para anúncios)
// ================================================================

function AdSetRow({
  adSet,
  clienteId,
  onStatusChange,
}: {
  adSet: AdSetMetaData;
  clienteId: string;
  onStatusChange: (id: string, status: "ativa" | "pausada") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [ads, setAds] = useState<AnuncioMetaData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadAds() {
    if (ads !== null) { setExpanded((e) => !e); return; }
    setExpanded(true);
    setLoading(true);
    const res = await getAnunciosAction(adSet.id, clienteId);
    setLoading(false);
    if (res.success) setAds(res.data);
    else setError(res.error);
  }

  function handleAdStatusChange(id: string, status: "ativa" | "pausada") {
    setAds((prev) =>
      prev ? prev.map((a) => (a.id === id ? { ...a, status } : a)) : prev
    );
  }

  function handleToggle() {
    const novoStatus = adSet.status === "ativa" ? "pausada" : "ativa";
    startTransition(async () => {
      const res = await toggleAdSetStatusAction(adSet.id, clienteId, novoStatus);
      if (res.success) onStatusChange(adSet.id, novoStatus);
    });
  }

  const podeToggle = adSet.status === "ativa" || adSet.status === "pausada";

  return (
    <div className="border border-bg-border rounded-xl overflow-hidden">
      {/* Ad set header row */}
      <div className="flex items-center gap-2 bg-bg-surface2/40 px-3 py-2.5">
        <button
          onClick={loadAds}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted hover:text-text transition-colors"
          title="Ver anúncios"
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        {/* Nome */}
        <span className="text-xs font-medium text-text truncate flex-1 min-w-0">
          {adSet.nome}
        </span>

        {/* Métricas inline */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] tabular-nums text-text-muted shrink-0">
          {adSet.gasto > 0 && <span className="text-text font-medium">{fmtBRL(adSet.gasto)}</span>}
          {adSet.impressoes > 0 && <span>{fmtNum(adSet.impressoes)} imp.</span>}
          {adSet.cpm > 0 && <span>CPM {fmtBRL(adSet.cpm)}</span>}
          {adSet.cpc > 0 && <span>CPC {fmtBRL(adSet.cpc)}</span>}
          {adSet.cliques > 0 && <span>{fmtNum(adSet.cliques)} cli.</span>}
          {adSet.leads > 0 && (
            <span className="text-success font-semibold">{adSet.leads} leads</span>
          )}
        </div>

        {/* Status + toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={adSet.status} dot />
          {podeToggle && (
            <button
              onClick={handleToggle}
              disabled={isPending}
              title={adSet.status === "ativa" ? "Pausar conjunto" : "Ativar conjunto"}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-bg-border text-text-subtle hover:bg-bg-surface2 hover:text-text transition-colors disabled:opacity-40"
            >
              {isPending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : adSet.status === "ativa" ? (
                <Pause size={11} />
              ) : (
                <Play size={11} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Métricas mobile */}
      {adSet.gasto > 0 && (
        <div className="sm:hidden flex gap-3 px-3 py-1.5 text-[11px] tabular-nums text-text-muted border-t border-bg-border bg-bg-surface2/20">
          <span className="text-text font-medium">{fmtBRL(adSet.gasto)}</span>
          {adSet.impressoes > 0 && <span>{fmtNum(adSet.impressoes)} imp.</span>}
          {adSet.leads > 0 && <span className="text-success font-semibold">{adSet.leads} leads</span>}
        </div>
      )}

      {/* Anúncios expandidos */}
      {expanded && (
        <div className="border-t border-bg-border bg-bg-surface/50 px-3 py-2 flex flex-col gap-1">
          {loading && (
            <div className="flex items-center gap-2 py-2 text-xs text-text-muted">
              <Loader2 size={12} className="animate-spin" />
              Carregando anúncios…
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 py-2 text-xs text-danger">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
          {ads && ads.length === 0 && (
            <p className="py-2 text-xs text-text-muted">Nenhum anúncio encontrado.</p>
          )}
          {ads &&
            ads.map((ad) => (
              <AnuncioRow
                key={ad.id}
                ad={ad}
                clienteId={clienteId}
                onStatusChange={handleAdStatusChange}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ================================================================
// AdSetsExpansion — painel principal dos ad sets de uma campanha
// ================================================================

export function AdSetsExpansion({
  metaCampaignId,
  clienteId,
}: {
  metaCampaignId: string;
  clienteId: string;
}) {
  const [adSets, setAdSets] = useState<AdSetMetaData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdSetsAction(metaCampaignId, clienteId).then((res) => {
      setLoading(false);
      if (res.success) setAdSets(res.data);
      else setError(res.error);
    });
  }, [metaCampaignId, clienteId]);

  function handleAdSetStatusChange(id: string, status: "ativa" | "pausada") {
    setAdSets((prev) =>
      prev ? prev.map((s) => (s.id === id ? { ...s, status } : s)) : prev
    );
  }

  return (
    <div className="border-t border-bg-border bg-bg/60 px-5 py-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
        Conjuntos de anúncios
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-text-muted py-2">
          <Loader2 size={13} className="animate-spin" />
          Carregando conjuntos…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-danger py-2">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {adSets && adSets.length === 0 && (
        <p className="text-xs text-text-muted py-2">
          Nenhum conjunto de anúncios encontrado para esta campanha.
        </p>
      )}

      {adSets && adSets.length > 0 && (
        <div className="flex flex-col gap-2">
          {adSets.map((adSet) => (
            <AdSetRow
              key={adSet.id}
              adSet={adSet}
              clienteId={clienteId}
              onStatusChange={handleAdSetStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
