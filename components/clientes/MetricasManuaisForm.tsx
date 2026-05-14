"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { upsertMetricasManuais, type MetricasFormData } from "@/lib/actions/clientes";

// Gera opções das últimas 8 semanas
function getWeekOptions() {
  const opts = [];
  for (let i = 0; i < 8; i++) {
    const ref = subWeeks(new Date(), i);
    const start = startOfWeek(ref, { weekStartsOn: 1 });
    const end = endOfWeek(ref, { weekStartsOn: 1 });
    opts.push({
      label: `${format(start, "dd/MM", { locale: ptBR })} — ${format(end, "dd/MM", { locale: ptBR })}${i === 0 ? " (atual)" : ""}`,
      semana_inicio: format(start, "yyyy-MM-dd"),
      semana_fim: format(end, "yyyy-MM-dd"),
    });
  }
  return opts;
}

interface MetricasManuaisFormProps {
  clienteId: string;
  existingData?: {
    semana_inicio: string;
    orcamentos_quantidade: number;
    orcamentos_valor: number;
    vendas_quantidade: number;
    vendas_valor: number;
  } | null;
}

export function MetricasManuaisForm({
  clienteId,
  existingData,
}: MetricasManuaisFormProps) {
  const weekOpts = getWeekOptions();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [selectedWeek, setSelectedWeek] = useState(weekOpts[0]);
  const [form, setForm] = useState<Omit<MetricasFormData, "semana_inicio" | "semana_fim">>({
    orcamentos_quantidade: existingData?.orcamentos_quantidade ?? 0,
    orcamentos_valor: existingData?.orcamentos_valor ?? 0,
    vendas_quantidade: existingData?.vendas_quantidade ?? 0,
    vendas_valor: existingData?.vendas_valor ?? 0,
  });

  function handleWeekChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const opt = weekOpts.find((w) => w.semana_inicio === e.target.value);
    if (opt) setSelectedWeek(opt);
  }

  function setNum(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [key]: Number(e.target.value) || 0 }));
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await upsertMetricasManuais(clienteId, {
        ...form,
        semana_inicio: selectedWeek.semana_inicio,
        semana_fim: selectedWeek.semana_fim,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Seletor de semana */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-muted">Semana de referência</label>
        <div className="relative">
          <select
            value={selectedWeek.semana_inicio}
            onChange={handleWeekChange}
            className="w-full max-w-xs appearance-none rounded-xl border border-bg-border bg-bg-surface2 py-2.5 pl-4 pr-9 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
          >
            {weekOpts.map((w) => (
              <option key={w.semana_inicio} value={w.semana_inicio}>
                {w.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Orçamentos */}
        <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
          <h3 className="font-display text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning" />
            Orçamentos enviados
          </h3>
          <div className="flex flex-col gap-3">
            <Input
              label="Quantidade"
              type="number"
              min={0}
              value={form.orcamentos_quantidade}
              onChange={setNum("orcamentos_quantidade")}
            />
            <Input
              label="Valor total (R$)"
              type="number"
              min={0}
              step="0.01"
              value={form.orcamentos_valor}
              onChange={setNum("orcamentos_valor")}
              hint="Soma dos orçamentos enviados"
            />
          </div>
        </div>

        {/* Vendas */}
        <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
          <h3 className="font-display text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            Vendas fechadas
          </h3>
          <div className="flex flex-col gap-3">
            <Input
              label="Quantidade"
              type="number"
              min={0}
              value={form.vendas_quantidade}
              onChange={setNum("vendas_quantidade")}
            />
            <Input
              label="Receita gerada (R$)"
              type="number"
              min={0}
              step="0.01"
              value={form.vendas_valor}
              onChange={setNum("vendas_valor")}
              hint="Valor das vendas concluídas"
            />
          </div>
        </div>
      </div>

      {/* Taxa de conversão (calculada) */}
      {form.orcamentos_quantidade > 0 && (
        <div className="rounded-xl bg-bg-surface2 border border-bg-border px-4 py-3 text-sm text-text-muted">
          Taxa de conversão (orç → venda):{" "}
          <span className="font-semibold text-success">
            {((form.vendas_quantidade / form.orcamentos_quantidade) * 100).toFixed(1)}%
          </span>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger"
          >
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </motion.div>
        )}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/8 px-4 py-3 text-sm text-success"
          >
            <CheckCircle2 size={15} className="shrink-0" />
            Métricas salvas com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      <Button type="submit" loading={isPending} className="self-start">
        Salvar métricas
      </Button>
    </form>
  );
}
