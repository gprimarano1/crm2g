"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Eye,
  Copy,
  Check,
  Calendar,
  FileText,
  Edit3,
  Trash2,
} from "lucide-react";
import { deletarOrcamento, type OrcamentoComCliente } from "@/lib/actions/orcamentos";
import { useRouter } from "next/navigation";

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  rascunho:    { label: "Rascunho",    bg: "bg-bg-surface2", text: "text-text-muted" },
  enviado:     { label: "Enviado",     bg: "bg-accent/15",    text: "text-accent" },
  visualizado: { label: "Visualizado", bg: "bg-warning/15",   text: "text-warning" },
  aceito:      { label: "Aceito",      bg: "bg-success/15",   text: "text-success" },
  recusado:    { label: "Recusado",    bg: "bg-danger/15",    text: "text-danger" },
};

function brl(v: number): string {
  return Number(v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmt(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

interface Props {
  orcamentos: OrcamentoComCliente[];
  basePath:   string; // "/orcamentos" ou "/painel/orcamentos"
  showCliente?: boolean;
}

export function OrcamentosList({ orcamentos, basePath, showCliente = false }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();

  async function copiarLink(slug: string) {
    const url = `${window.location.origin}/orcamento/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 1600);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este orçamento? A ação não pode ser desfeita.")) return;
    const res = await deletarOrcamento(id);
    if (!res.success) alert(res.error ?? "Erro ao excluir");
    else router.refresh();
  }

  if (orcamentos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-bg-border bg-bg-surface px-6 py-16 text-center">
        <FileText size={28} className="text-text-subtle" />
        <h3 className="font-display text-base font-semibold text-text">
          Nenhum orçamento ainda
        </h3>
        <p className="max-w-md text-sm text-text-muted">
          Clique em <strong>Novo orçamento</strong> para criar o primeiro link
          enviável para seus clientes.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-bg-border bg-bg-surface">
      <table className="w-full text-sm">
        <thead className="border-b border-bg-border bg-bg text-[11px] uppercase tracking-wider text-text-subtle">
          <tr>
            <th className="px-4 py-3 text-left">Cliente</th>
            {showCliente && <th className="px-4 py-3 text-left">Empresa</th>}
            <th className="px-4 py-3 text-left">Emitido</th>
            <th className="px-4 py-3 text-left">Validade</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-center">Views</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {orcamentos.map((o, i) => (
            <motion.tr
              key={o.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.02 }}
              className="border-b border-bg-border/50 transition hover:bg-bg-surface2/40"
            >
              <td className="px-4 py-3">
                <Link
                  href={`${basePath}/${o.id}`}
                  className="font-medium text-text hover:text-accent"
                >
                  {o.cliente_nome}
                </Link>
                <div className="text-[11px] text-text-subtle">{o.numero ?? "—"}</div>
              </td>
              {showCliente && (
                <td className="px-4 py-3 text-text-muted">
                  {o.cliente_empresa ?? "—"}
                </td>
              )}
              <td className="px-4 py-3 text-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} />
                  {fmt(o.data_emissao)}
                </span>
              </td>
              <td className="px-4 py-3 text-text-muted">{fmt(o.data_validade)}</td>
              <td className="px-4 py-3 text-right font-semibold text-text">
                {brl(o.total)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_META[o.status].bg} ${STATUS_META[o.status].text}`}
                >
                  {STATUS_META[o.status].label}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Eye size={12} /> {o.visualizacoes}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => copiarLink(o.slug)}
                    title="Copiar link"
                    className="rounded-lg p-1.5 text-text-muted transition hover:bg-bg-surface2 hover:text-text"
                  >
                    {copied === o.slug ? (
                      <Check size={14} className="text-success" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <a
                    href={`/orcamento/${o.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir página pública"
                    className="rounded-lg p-1.5 text-text-muted transition hover:bg-bg-surface2 hover:text-text"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <Link
                    href={`${basePath}/${o.id}/editar`}
                    title="Editar"
                    className="rounded-lg p-1.5 text-text-muted transition hover:bg-bg-surface2 hover:text-text"
                  >
                    <Edit3 size={14} />
                  </Link>
                  <button
                    onClick={() => excluir(o.id)}
                    title="Excluir"
                    className="rounded-lg p-1.5 text-text-muted transition hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
