"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  Edit3,
  ArrowLeft,
  Calendar,
  Tag,
  Clock,
  Eye,
} from "lucide-react";
import type { Orcamento } from "@/lib/actions/orcamentos";

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  rascunho:    { label: "Rascunho",    bg: "bg-bg-surface2", text: "text-text-muted" },
  enviado:     { label: "Enviado",     bg: "bg-accent/15",    text: "text-accent" },
  visualizado: { label: "Visualizado", bg: "bg-warning/15",   text: "text-warning" },
  aceito:      { label: "Aceito",      bg: "bg-success/15",   text: "text-success" },
  recusado:    { label: "Recusado",    bg: "bg-danger/15",    text: "text-danger" },
};

function brl(v: number): string {
  return Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmt(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

interface Props {
  orcamento: Orcamento;
  basePath:  string;
}

export function OrcamentoDetalhe({ orcamento: o, basePath }: Props) {
  const [copied, setCopied] = useState(false);

  async function copiar() {
    const url = `${window.location.origin}/orcamento/${o.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition hover:text-text"
        >
          <ArrowLeft size={14} /> Voltar para orçamentos
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copiar}
            className="inline-flex items-center gap-1.5 rounded-lg border border-bg-border bg-bg-surface px-3 py-2 text-xs font-medium text-text transition hover:bg-bg-surface2"
          >
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            {copied ? "Copiado" : "Copiar link público"}
          </button>
          <a
            href={`/orcamento/${o.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-bg-border bg-bg-surface px-3 py-2 text-xs font-medium text-text transition hover:bg-bg-surface2"
          >
            <ExternalLink size={13} /> Abrir página
          </a>
          <Link
            href={`${basePath}/${o.id}/editar`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <Edit3 size={13} /> Editar
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-text-subtle">
              {o.numero ?? "Orçamento"}
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold text-text">
              {o.cliente_nome}
            </h1>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-text-muted">
              {o.cliente_email && <span>{o.cliente_email}</span>}
              {o.cliente_telefone && <span>{o.cliente_telefone}</span>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_META[o.status].bg} ${STATUS_META[o.status].text}`}
            >
              {STATUS_META[o.status].label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-bg-surface2 px-3 py-1 text-xs text-text-muted">
              <Eye size={12} /> {o.visualizacoes}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-bg-border pt-5 md:grid-cols-4">
          <Info label="Emitido em" icon={<Calendar size={12} />} value={fmt(o.data_emissao)} />
          <Info label="Válido até" icon={<Clock size={12} />} value={fmt(o.data_validade)} />
          <Info label="Itens" value={`${o.produtos.length}`} />
          <Info
            label="Total"
            value={brl(o.total)}
            valueClass="text-accent font-bold"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-bg-border bg-bg-surface p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-text">
          Produtos ({o.produtos.length})
        </h2>
        <div className="flex flex-col gap-3">
          {o.produtos.map((p, idx) => (
            <div
              key={p.id ?? idx}
              className="grid grid-cols-[80px_1fr_auto] gap-4 rounded-xl border border-bg-border bg-bg p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-bg-surface2">
                {p.imagem_url ? (
                  <Image
                    src={p.imagem_url}
                    alt={p.nome}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-text-subtle">
                    Sem foto
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-text">{p.nome}</h3>
                  {p.em_promocao && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                      <Tag size={9} /> Promoção
                    </span>
                  )}
                </div>
                {p.descricao && (
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                    {p.descricao}
                  </p>
                )}
                {p.prazo_entrega && (
                  <div className="mt-1 text-[11px] text-text-subtle">
                    Entrega: {p.prazo_entrega}
                  </div>
                )}
              </div>

              <div className="text-right">
                {p.em_promocao && p.valor_de && (
                  <div className="text-[11px] text-text-subtle line-through">
                    {brl(p.valor_de)}
                  </div>
                )}
                <div className="font-display text-base font-bold text-text">
                  {brl(p.valor)}
                </div>
                {p.quantidade > 1 && (
                  <div className="text-[11px] text-text-subtle">×{p.quantidade}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {o.formas_pagamento && (
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-6">
            <h3 className="mb-2 text-[11px] uppercase tracking-wider text-text-subtle">
              Formas de pagamento
            </h3>
            <p className="whitespace-pre-line text-sm text-text">{o.formas_pagamento}</p>
          </div>
        )}
        {o.observacoes && (
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-6">
            <h3 className="mb-2 text-[11px] uppercase tracking-wider text-text-subtle">
              Observações
            </h3>
            <p className="whitespace-pre-line text-sm text-text">{o.observacoes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  icon,
  valueClass = "text-text",
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-text-subtle">
        {icon} {label}
      </div>
      <div className={`mt-1 text-sm ${valueClass}`}>{value}</div>
    </div>
  );
}
