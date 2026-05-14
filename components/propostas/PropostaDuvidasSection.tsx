"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Check, Clock, ChevronDown, ChevronUp, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { responderDuvida } from "@/lib/actions/propostas";
import type { PropostaDuvida } from "@/lib/actions/propostas";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

interface DuvidaItemProps {
  duvida:     PropostaDuvida;
  propostaId: string;
}

function DuvidaItem({ duvida, propostaId }: DuvidaItemProps) {
  const [open,     setOpen]   = useState(!duvida.respondida_em);
  const [resposta, setResposta] = useState(duvida.resposta ?? "");
  const [saved,    setSaved]  = useState(!!duvida.resposta);
  const [pending,  startAction] = useTransition();
  const [error,    setError]  = useState("");

  function handleSalvar() {
    if (!resposta.trim()) return;
    setError("");
    startAction(async () => {
      const res = await responderDuvida(duvida.id, resposta.trim(), propostaId);
      if (res.success) {
        setSaved(true);
      } else {
        setError(res.error ?? "Erro ao salvar");
      }
    });
  }

  return (
    <div className={cn(
      "rounded-xl border transition-colors",
      duvida.respondida_em
        ? "border-bg-border bg-bg-surface2"
        : "border-warning/20 bg-warning/5",
    )}>
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <div className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          duvida.respondida_em ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
        )}>
          {duvida.respondida_em ? <Check size={13} /> : <Clock size={13} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text leading-relaxed">{duvida.texto}</p>
          <p className="text-[11px] text-text-subtle mt-1">{formatDate(duvida.created_at)}</p>
        </div>
        <button className="text-text-subtle shrink-0">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Response area */}
      {open && (
        <div className="border-t border-bg-border px-4 pb-4 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle mb-2">
            {saved ? "Anotação interna" : "Adicionar anotação interna"}
          </p>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-bg-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-text-subtle resize-none"
            placeholder="Sua resposta ou anotação interna…"
            value={resposta}
            onChange={(e) => { setResposta(e.target.value); setSaved(false); }}
            disabled={pending}
          />
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSalvar}
              disabled={!resposta.trim() || saved || pending}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all",
                saved
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-accent text-white hover:bg-accent/90 disabled:opacity-50",
              )}
            >
              {saved ? <><Check size={12} /> Salvo</> : pending ? "Salvando…" : <><Send size={12} /> Salvar</>}
            </button>
            {duvida.respondida_em && (
              <span className="text-[11px] text-success flex items-center gap-1">
                <Check size={10} /> Marcada como respondida em {formatDate(duvida.respondida_em)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
// PropostaDuvidasSection
// ================================================================

interface Props {
  duvidas:    PropostaDuvida[];
  propostaId: string;
}

export function PropostaDuvidasSection({ duvidas, propostaId }: Props) {
  const pendentes  = duvidas.filter((d) => !d.respondida_em).length;
  const respondidas = duvidas.filter((d) => d.respondida_em).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 ring-1 ring-warning/20">
          <MessageSquare size={16} className="text-warning" />
        </div>
        <div>
          <h2 className="font-display font-bold text-text">Dúvidas do prospect</h2>
          <div className="flex items-center gap-3 text-xs text-text-subtle">
            {pendentes > 0 && (
              <span className="text-warning font-medium">{pendentes} pendente{pendentes > 1 ? "s" : ""}</span>
            )}
            {respondidas > 0 && (
              <span className="text-success">{respondidas} respondida{respondidas > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
        {pendentes > 0 && (
          <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-warning text-bg text-[11px] font-bold px-1.5">
            {pendentes}
          </span>
        )}
      </div>

      {duvidas.length === 0 ? (
        <div className="rounded-xl border border-bg-border bg-bg-surface2 p-6 text-center">
          <MessageSquare size={20} className="text-text-subtle mx-auto mb-2" />
          <p className="text-sm text-text-muted">Nenhuma dúvida enviada ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {duvidas.map((d) => (
            <DuvidaItem key={d.id} duvida={d} propostaId={propostaId} />
          ))}
        </div>
      )}
    </div>
  );
}
