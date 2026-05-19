"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Calendar, X, Filter } from "lucide-react";

type Cliente = { id: string; nome_empresa: string };

interface Props {
  /** Lista de clientes para filtro (apenas admin) */
  clientes?: Cliente[];
}

const STATUS_OPCOES = [
  { value: "todos",       label: "Todos" },
  { value: "rascunho",    label: "Rascunho" },
  { value: "enviado",     label: "Enviado" },
  { value: "visualizado", label: "Visualizado" },
  { value: "aceito",      label: "Aceito" },
  { value: "recusado",    label: "Recusado" },
];

export function OrcamentosFiltros({ clientes }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Estado local sincronizado com a URL
  const [dataInicio, setDataInicio] = useState(searchParams.get("data_inicio") ?? "");
  const [dataFim,    setDataFim]    = useState(searchParams.get("data_fim")    ?? "");
  const [status,     setStatus]     = useState(searchParams.get("status")      ?? "todos");
  const [cliente,    setCliente]    = useState(searchParams.get("cliente")     ?? "todos");

  // Sincroniza estado se a URL mudar (ex.: voltar do navegador)
  useEffect(() => {
    setDataInicio(searchParams.get("data_inicio") ?? "");
    setDataFim(searchParams.get("data_fim") ?? "");
    setStatus(searchParams.get("status") ?? "todos");
    setCliente(searchParams.get("cliente") ?? "todos");
  }, [searchParams]);

  function aplicar() {
    const params = new URLSearchParams();
    if (dataInicio) params.set("data_inicio", dataInicio);
    if (dataFim)    params.set("data_fim", dataFim);
    if (status && status !== "todos")   params.set("status", status);
    if (clientes && cliente && cliente !== "todos") params.set("cliente", cliente);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function limpar() {
    setDataInicio("");
    setDataFim("");
    setStatus("todos");
    setCliente("todos");
    startTransition(() => router.push(pathname));
  }

  const haAlgumFiltro =
    !!dataInicio || !!dataFim || (status && status !== "todos") || (cliente && cliente !== "todos");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-bg-border bg-bg-surface p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-subtle">
        <Filter size={12} /> Filtros
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
            <Calendar size={10} /> De
          </span>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
            <Calendar size={10} /> Até
          </span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-text-muted">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          >
            {STATUS_OPCOES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>

        {clientes && (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-text-muted">Cliente</span>
            <select
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            >
              <option value="todos">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome_empresa}</option>
              ))}
            </select>
          </label>
        )}

        <div className={`flex items-end gap-2 ${clientes ? "" : "lg:col-start-5"}`}>
          <button
            type="button"
            onClick={aplicar}
            disabled={pending}
            className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Aplicar
          </button>
          {haAlgumFiltro && (
            <button
              type="button"
              onClick={limpar}
              disabled={pending}
              className="flex items-center gap-1 rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text-muted transition hover:text-text disabled:opacity-50"
              title="Limpar filtros"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
