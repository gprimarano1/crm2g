"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropostaStatus } from "@/lib/actions/propostas";

// ================================================================
// Modal
// ================================================================

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-auto px-4"
          >
            <div className="rounded-2xl border border-bg-border bg-bg-surface shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-text text-lg">{title}</h3>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:text-text transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ================================================================
// PropostaAcoes
// ================================================================

interface Props {
  slug:          string;
  statusInicial: PropostaStatus;
}

type ModalType = "duvida" | "aceitar" | "recusar" | null;

export function PropostaAcoes({ slug, statusInicial }: Props) {
  const [status,  setStatus]  = useState<PropostaStatus>(statusInicial);
  const [modal,   setModal]   = useState<ModalType>(null);
  const [texto,   setTexto]   = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function send(tipo: "duvida" | "aceitar" | "recusar") {
    setLoading(true);
    try {
      const res = await fetch(`/api/propostas/${slug}/interacao`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tipo, texto: texto.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        if (tipo === "aceitar")  { setStatus("aceita");   setFeedback("Proposta aceita! Em breve entraremos em contato."); }
        if (tipo === "recusar")  { setStatus("recusada"); setFeedback("Obrigado pelo seu retorno. Se mudar de ideia, estamos aqui."); }
        if (tipo === "duvida")   { setFeedback("Dúvida enviada! Responderemos em breve."); }
        setModal(null);
        setTexto("");
      } else {
        setFeedback("Algo deu errado. Tente novamente.");
      }
    } catch {
      setFeedback("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-[88px] sm:bottom-[80px] left-1/2 -translate-x-1/2 z-40 max-w-sm w-full mx-auto px-4"
          >
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success shrink-0" />
                <p className="text-sm text-text">{feedback}</p>
              </div>
              <button onClick={() => setFeedback(null)} className="text-text-subtle hover:text-text transition-colors">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-bg-border bg-bg/95 backdrop-blur-md px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-3">

          {/* Dúvida */}
          <button
            onClick={() => { setModal("duvida"); setTexto(""); setFeedback(null); }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all",
              "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15",
            )}
          >
            <MessageSquare size={15} />
            <span className="hidden sm:inline">💬</span>
            <span>Tenho uma dúvida</span>
          </button>

          {/* Aceitar */}
          {status === "aceita" ? (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 py-3 text-sm font-semibold text-success">
              <CheckCircle2 size={15} />
              <span>Proposta aceita!</span>
            </div>
          ) : (
            <button
              onClick={() => { setModal("aceitar"); setFeedback(null); }}
              disabled={status === "recusada"}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all",
                status === "recusada"
                  ? "border-bg-border bg-bg-surface2 text-text-subtle opacity-50 cursor-not-allowed"
                  : "border-success/30 bg-success text-white hover:bg-success/90",
              )}
            >
              <ThumbsUp size={15} />
              <span className="hidden sm:inline">✅</span>
              <span>Aceitar Proposta</span>
            </button>
          )}

          {/* Recusar */}
          {status === "recusada" ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-bg-border bg-bg-surface2 px-4 py-3 text-sm text-text-subtle">
              <ThumbsDown size={14} />
              <span className="hidden sm:inline">Recusada</span>
            </div>
          ) : (
            <button
              onClick={() => { setModal("recusar"); setTexto(""); setFeedback(null); }}
              disabled={status === "aceita"}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                status === "aceita"
                  ? "border-bg-border text-text-subtle opacity-40 cursor-not-allowed"
                  : "border-danger/20 text-danger hover:bg-danger/8 hover:border-danger/30",
              )}
            >
              <ThumbsDown size={14} />
              <span className="hidden sm:inline">❌</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal — Dúvida */}
      <Modal open={modal === "duvida"} onClose={() => !loading && setModal(null)} title="💬 Qual é a sua dúvida?">
        <p className="text-sm text-text-muted mb-4">
          Envie sua pergunta e retornaremos o quanto antes.
        </p>
        <textarea
          rows={4}
          className="w-full rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-text-subtle resize-none mb-4"
          placeholder="Digite sua dúvida aqui…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={() => send("duvida")}
          disabled={!texto.trim() || loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-warning px-4 py-3 text-sm font-semibold text-bg disabled:opacity-50 hover:bg-warning/90 transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
          {loading ? "Enviando…" : "Enviar dúvida"}
        </button>
      </Modal>

      {/* Modal — Aceitar */}
      <Modal open={modal === "aceitar"} onClose={() => !loading && setModal(null)} title="✅ Aceitar proposta">
        <div className="rounded-xl border border-success/20 bg-success/8 p-4 mb-5">
          <p className="text-sm text-text-muted">
            Ao aceitar, nossa equipe receberá uma notificação imediata e entraremos em contato para dar início ao seu projeto!
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setModal(null)}
            disabled={loading}
            className="flex-1 rounded-xl border border-bg-border py-3 text-sm font-medium text-text-muted hover:bg-bg-surface2 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => send("aceitar")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-success/90 transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ThumbsUp size={15} />}
            {loading ? "Confirmando…" : "Confirmar"}
          </button>
        </div>
      </Modal>

      {/* Modal — Recusar */}
      <Modal open={modal === "recusar"} onClose={() => !loading && setModal(null)} title="❌ Não tenho interesse">
        <p className="text-sm text-text-muted mb-4">
          Lamentamos que não podemos avançar juntos desta vez. Pode nos contar o motivo?
        </p>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-text-subtle resize-none mb-4"
          placeholder="Opcional: orçamento acima do esperado, timing não é o ideal…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          disabled={loading}
        />
        <div className="flex gap-3">
          <button
            onClick={() => setModal(null)}
            disabled={loading}
            className="flex-1 rounded-xl border border-bg-border py-3 text-sm font-medium text-text-muted hover:bg-bg-surface2 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => send("recusar")}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 py-3 text-sm font-semibold text-danger disabled:opacity-50 hover:bg-danger/15 transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ThumbsDown size={15} />}
            {loading ? "Enviando…" : "Confirmar"}
          </button>
        </div>
      </Modal>
    </>
  );
}
