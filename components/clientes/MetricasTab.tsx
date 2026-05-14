"use client";

import { useState, useTransition } from "react";
import type { MetricaManual, MetricasAutomaticas } from "@/lib/types/metricas";
import {
  addMetricaManual,
  updateMetricaManual,
  deleteMetricaManual,
} from "@/lib/actions/metricas";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Plus, Pencil, Trash2, CheckCircle2, AlertCircle,
  FileText, ShoppingCart, Bot, User, Sigma,
} from "lucide-react";

// ── Formatters ────────────────────────────────────────────────────

const fmtR$ = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function fmtDate(s: string) {
  return new Date(s + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ── Totais calculados ────────────────────────────────────────────

function computeTotals(manuais: MetricaManual[]) {
  const reduce = (tipo: string) =>
    manuais
      .filter((m) => m.tipo === tipo)
      .reduce(
        (acc, m) => ({ quantidade: acc.quantidade + m.quantidade, valor: acc.valor + Number(m.valor) }),
        { quantidade: 0, valor: 0 },
      );
  return { orcamentos: reduce("orcamento"), vendas: reduce("venda") };
}

// ── Summary card ─────────────────────────────────────────────────

function SummaryCard({
  title,
  icon,
  color,
  auto,
  manual,
  total,
  unit,
}: {
  title: string;
  icon: React.ReactNode;
  color: "warning" | "success";
  auto: { quantidade: number; valor: number };
  manual: { quantidade: number; valor: number };
  total: { quantidade: number; valor: number };
  unit: string;
}) {
  const colorMap = {
    warning: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", badge: "bg-warning/10 text-warning" },
    success: { bg: "bg-success/10", text: "text-success", border: "border-success/20", badge: "bg-success/10 text-success" },
  };
  const c = colorMap[color];

  return (
    <div className={`rounded-2xl border ${c.border} bg-bg-surface p-5 flex flex-col gap-4`}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
          {icon}
        </div>
        <h3 className="font-display text-base font-semibold text-text">{title}</h3>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2.5">
        {/* Automático */}
        <div className="flex items-center justify-between rounded-xl bg-bg px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Bot size={14} />
            <span>Automático (kanban)</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-text tabular-nums">
              {auto.quantidade} {unit}
            </span>
            <span className="ml-2 text-sm text-text-muted tabular-nums">
              {fmtR$(auto.valor)}
            </span>
          </div>
        </div>

        {/* Manual */}
        <div className="flex items-center justify-between rounded-xl bg-bg px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <User size={14} />
            <span>Manual (lançamentos)</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-text tabular-nums">
              {manual.quantidade} {unit}
            </span>
            <span className="ml-2 text-sm text-text-muted tabular-nums">
              {fmtR$(manual.valor)}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className={`flex items-center justify-between rounded-xl border ${c.border} ${c.bg} px-4 py-3`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${c.text}`}>
            <Sigma size={14} />
            <span>TOTAL</span>
          </div>
          <div className="text-right">
            <span className={`text-base font-bold tabular-nums ${c.text}`}>
              {total.quantidade} {unit}
            </span>
            <span className={`ml-2 text-sm font-semibold tabular-nums ${c.text}`}>
              {fmtR$(total.valor)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline form fields ────────────────────────────────────────────

type FormState = {
  tipo: "orcamento" | "venda";
  dataRegistro: string;
  quantidade: number;
  valor: number;
  observacao: string;
};

const emptyForm: FormState = {
  tipo: "orcamento",
  dataRegistro: new Date().toISOString().slice(0, 10),
  quantidade: 1,
  valor: 0,
  observacao: "",
};

function MetricaFormFields({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Tipo toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-muted">Tipo</label>
        <div className="inline-flex rounded-xl border border-bg-border bg-bg p-1 gap-1">
          {(["orcamento", "venda"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ ...form, tipo: t })}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                form.tipo === t
                  ? t === "orcamento"
                    ? "bg-warning/15 text-warning border border-warning/30 shadow-sm"
                    : "bg-success/15 text-success border border-success/30 shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {t === "orcamento" ? <FileText size={14} /> : <ShoppingCart size={14} />}
              {t === "orcamento" ? "Orçamento" : "Venda"}
            </button>
          ))}
        </div>
      </div>

      {/* Date + Qty + Valor */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-muted">Data</label>
          <input
            type="date"
            value={form.dataRegistro}
            onChange={(e) => onChange({ ...form, dataRegistro: e.target.value })}
            className="rounded-xl border border-bg-border bg-bg px-4 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-muted">Quantidade</label>
          <input
            type="number"
            min={1}
            value={form.quantidade}
            onChange={(e) => onChange({ ...form, quantidade: Math.max(1, parseInt(e.target.value) || 1) })}
            className="rounded-xl border border-bg-border bg-bg px-4 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-muted">Valor total (R$)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.valor}
            onChange={(e) => onChange({ ...form, valor: parseFloat(e.target.value) || 0 })}
            className="rounded-xl border border-bg-border bg-bg px-4 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {/* Observação */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-muted">
          Observação <span className="text-text-subtle">(opcional)</span>
        </label>
        <textarea
          value={form.observacao}
          onChange={(e) => onChange({ ...form, observacao: e.target.value })}
          rows={2}
          placeholder="Detalhes adicionais..."
          className="resize-none rounded-xl border border-bg-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-subtle outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────

function Toast({
  msg,
  type,
  onDismiss,
}: {
  msg: string;
  type: "success" | "error";
  onDismiss: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
        type === "success"
          ? "border-success/20 bg-success/10 text-success"
          : "border-danger/20 bg-danger/8 text-danger"
      }`}
    >
      {type === "success" ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
      {msg}
      <button onClick={onDismiss} className="ml-auto opacity-60 hover:opacity-100">×</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

interface MetricasTabProps {
  clienteId: string;
  initialManuais: MetricaManual[];
  initialAutomatico: MetricasAutomaticas;
}

export function MetricasTab({
  clienteId,
  initialManuais,
  initialAutomatico,
}: MetricasTabProps) {
  const [manuais, setManuais]           = useState<MetricaManual[]>(initialManuais);
  const automatico                       = initialAutomatico;
  const [addForm, setAddForm]           = useState<FormState>(emptyForm);
  const [editForm, setEditForm]         = useState<FormState>(emptyForm);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [deleteId, setDeleteId]         = useState<string | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isPendingAdd, startAdd]        = useTransition();
  const [isPendingEdit, startEdit]      = useTransition();
  const [isPendingDelete, startDelete]  = useTransition();

  const manualTotals = computeTotals(manuais);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    startAdd(async () => {
      const res = await addMetricaManual({
        clienteId,
        tipo:          addForm.tipo,
        quantidade:    addForm.quantidade,
        valor:         addForm.valor,
        dataRegistro:  addForm.dataRegistro,
        observacao:    addForm.observacao,
      });
      if (!res.success) {
        showToast(res.error ?? "Erro ao adicionar lançamento.", "error");
        return;
      }
      if (res.data) {
        setManuais((prev) => {
          const updated = [res.data!, ...prev];
          updated.sort((a, b) => {
            if (b.data_registro !== a.data_registro) return b.data_registro.localeCompare(a.data_registro);
            return b.created_at.localeCompare(a.created_at);
          });
          return updated;
        });
      }
      setAddForm({ ...emptyForm, tipo: addForm.tipo, dataRegistro: addForm.dataRegistro });
      showToast("Lançamento adicionado!");
    });
  }

  function openEdit(m: MetricaManual) {
    setEditForm({
      tipo:          m.tipo as "orcamento" | "venda",
      dataRegistro:  m.data_registro,
      quantidade:    m.quantidade,
      valor:         Number(m.valor),
      observacao:    m.observacao ?? "",
    });
    setEditingId(m.id);
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    startEdit(async () => {
      const res = await updateMetricaManual({
        id:            editingId,
        clienteId,
        tipo:          editForm.tipo,
        quantidade:    editForm.quantidade,
        valor:         editForm.valor,
        dataRegistro:  editForm.dataRegistro,
        observacao:    editForm.observacao,
      });
      if (!res.success) {
        showToast(res.error ?? "Erro ao editar lançamento.", "error");
        return;
      }
      if (res.data) {
        setManuais((prev) => {
          const updated = prev.map((m) => m.id === editingId ? res.data! : m);
          updated.sort((a, b) => {
            if (b.data_registro !== a.data_registro) return b.data_registro.localeCompare(a.data_registro);
            return b.created_at.localeCompare(a.created_at);
          });
          return updated;
        });
      }
      setEditingId(null);
      showToast("Lançamento atualizado!");
    });
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      const res = await deleteMetricaManual(id, clienteId);
      if (!res.success) {
        showToast(res.error ?? "Erro ao excluir lançamento.", "error");
        return;
      }
      setManuais((prev) => prev.filter((m) => m.id !== id));
      setDeleteId(null);
      showToast("Lançamento excluído.");
    });
  }

  const tipoLabel = (tipo: string) => tipo === "orcamento" ? "Orçamento" : "Venda";
  const tipoBadge = (tipo: string) =>
    tipo === "orcamento"
      ? "bg-warning/10 text-warning border border-warning/20"
      : "bg-success/10 text-success border border-success/20";

  return (
    <div className="flex flex-col gap-8 max-w-4xl">

      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      {/* ── Totalizadores ── */}
      <div>
        <h2 className="font-display text-base font-semibold text-text mb-4">
          Resumo combinado
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SummaryCard
            title="Orçamentos"
            icon={<FileText size={18} />}
            color="warning"
            auto={automatico.orcamentos}
            manual={manualTotals.orcamentos}
            total={{
              quantidade: automatico.orcamentos.quantidade + manualTotals.orcamentos.quantidade,
              valor:      automatico.orcamentos.valor      + manualTotals.orcamentos.valor,
            }}
            unit="orç."
          />
          <SummaryCard
            title="Vendas"
            icon={<ShoppingCart size={18} />}
            color="success"
            auto={automatico.vendas}
            manual={manualTotals.vendas}
            total={{
              quantidade: automatico.vendas.quantidade + manualTotals.vendas.quantidade,
              valor:      automatico.vendas.valor      + manualTotals.vendas.valor,
            }}
            unit="vda."
          />
        </div>
      </div>

      {/* ── Formulário de adição ── */}
      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-display text-base font-semibold text-text mb-5">
          Novo lançamento
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-5">
          <MetricaFormFields form={addForm} onChange={setAddForm} />
          <div className="flex justify-end">
            <Button type="submit" loading={isPendingAdd} icon={<Plus size={15} />}>
              Adicionar lançamento
            </Button>
          </div>
        </form>
      </div>

      {/* ── Listagem ── */}
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-base font-semibold text-text">
          Lançamentos registrados
          {manuais.length > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-bg-surface2 px-1.5 text-xs font-medium text-text-muted">
              {manuais.length}
            </span>
          )}
        </h2>

        {manuais.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-bg-border">
            <p className="text-sm text-text-muted">Nenhum lançamento registrado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bg-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border bg-bg-surface2">
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium text-text-muted">Qtd</th>
                  <th className="px-4 py-3 text-right font-medium text-text-muted">Valor</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Observação</th>
                  <th className="px-4 py-3 text-right font-medium text-text-muted">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border">
                {manuais.map((m) => (
                  <tr key={m.id} className="bg-bg-surface hover:bg-bg-surface2 transition-colors">
                    <td className="px-4 py-3 text-text tabular-nums whitespace-nowrap">
                      {fmtDate(m.data_registro)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ${tipoBadge(m.tipo)}`}>
                        {tipoLabel(m.tipo)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-text tabular-nums">
                      {m.quantidade}
                    </td>
                    <td className="px-4 py-3 text-right text-text tabular-nums font-medium whitespace-nowrap">
                      {fmtR$(Number(m.valor))}
                    </td>
                    <td className="px-4 py-3 text-text-muted max-w-xs truncate">
                      {m.observacao ?? <span className="text-text-subtle">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {deleteId === m.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-text-muted">Confirmar?</span>
                          <button
                            onClick={() => handleDelete(m.id)}
                            disabled={isPendingDelete}
                            className="rounded-lg bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="rounded-lg border border-bg-border px-2.5 py-1 text-xs text-text-muted hover:bg-bg-surface2 transition-colors"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(m)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-surface2 hover:text-accent"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteId(m.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/8 hover:text-danger"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de edição ── */}
      <Modal
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        title="Editar lançamento"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancelar
            </Button>
            <Button
              loading={isPendingEdit}
              onClick={(e) => handleEdit(e as React.FormEvent)}
            >
              Salvar alterações
            </Button>
          </>
        }
      >
        <MetricaFormFields form={editForm} onChange={setEditForm} />
      </Modal>
    </div>
  );
}
