"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Upload,
  Save,
  Send,
  ImageIcon,
  Tag,
  Calendar,
  User,
  Phone,
  Mail,
  Package,
  StickyNote,
  CreditCard,
} from "lucide-react";
import {
  criarOrcamento,
  atualizarOrcamento,
  uploadProdutoImagem,
  type OrcamentoProduto,
  type CriarOrcamentoInput,
} from "@/lib/actions/orcamentos";

type Modo = "criar" | "editar";

interface NovoOrcamentoFormProps {
  modo:        Modo;
  clienteId:   string;
  clienteEmpresa?: string;
  redirectBase: string; // "/orcamentos" ou "/painel/orcamentos"
  orcamento?: {
    id:               string;
    cliente_nome:     string;
    cliente_email:    string | null;
    cliente_telefone: string | null;
    data_emissao:     string;
    data_validade:    string;
    produtos:         OrcamentoProduto[];
    formas_pagamento: string | null;
    observacoes:      string | null;
  };
}

function novoProdutoVazio(): OrcamentoProduto {
  return {
    id:            crypto.randomUUID(),
    imagem_url:    null,
    nome:          "",
    descricao:     "",
    valor:         0,
    em_promocao:   false,
    valor_de:      null,
    prazo_entrega: "",
    quantidade:    1,
  };
}

function hojeStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function maisDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function NovoOrcamentoForm({
  modo,
  clienteId,
  clienteEmpresa,
  redirectBase,
  orcamento,
}: NovoOrcamentoFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [clienteNome,     setClienteNome]     = useState(orcamento?.cliente_nome     ?? "");
  const [clienteEmail,    setClienteEmail]    = useState(orcamento?.cliente_email    ?? "");
  const [clienteTelefone, setClienteTelefone] = useState(orcamento?.cliente_telefone ?? "");
  const [dataEmissao,     setDataEmissao]     = useState(orcamento?.data_emissao     ?? hojeStr());
  const [dataValidade,    setDataValidade]    = useState(orcamento?.data_validade    ?? maisDias(15));
  const [formasPagamento, setFormasPagamento] = useState(orcamento?.formas_pagamento ?? "À vista (5% desconto) • PIX • Cartão até 12x");
  const [observacoes,     setObservacoes]     = useState(orcamento?.observacoes      ?? "");
  const [produtos, setProdutos] = useState<OrcamentoProduto[]>(
    orcamento?.produtos?.length ? orcamento.produtos : [novoProdutoVazio()],
  );

  const total = produtos.reduce((s, p) => s + Number(p.valor || 0) * Number(p.quantidade || 1), 0);

  function atualizarProduto(idx: number, patch: Partial<OrcamentoProduto>) {
    setProdutos((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function removerProduto(idx: number) {
    setProdutos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function fazerUpload(idx: number, file: File) {
    const fd = new FormData();
    fd.append("imagem", file);
    const res = await uploadProdutoImagem(fd);
    if (res.error) {
      setErro(res.error);
      return;
    }
    if (res.url) atualizarProduto(idx, { imagem_url: res.url });
  }

  function submeter(statusFinal: "rascunho" | "enviado") {
    setErro(null);

    if (!clienteNome.trim()) { setErro("Informe o nome do cliente"); return; }
    if (produtos.length === 0) { setErro("Adicione ao menos um produto"); return; }
    for (let i = 0; i < produtos.length; i++) {
      const p = produtos[i];
      if (!p.nome.trim()) { setErro(`Produto ${i + 1}: informe o nome`); return; }
      if (!p.valor || p.valor <= 0) { setErro(`Produto ${i + 1}: informe um valor válido`); return; }
    }

    startTransition(async () => {
      const payload: CriarOrcamentoInput = {
        cliente_id:        clienteId,
        cliente_nome:      clienteNome,
        cliente_email:     clienteEmail || undefined,
        cliente_telefone:  clienteTelefone || undefined,
        data_emissao:      dataEmissao,
        data_validade:     dataValidade,
        produtos,
        formas_pagamento:  formasPagamento || undefined,
        observacoes:       observacoes || undefined,
        status:            statusFinal,
      };

      if (modo === "criar") {
        const res = await criarOrcamento(payload);
        if (!res.success || !res.id) {
          setErro(res.error ?? "Erro ao criar orçamento");
          return;
        }
        router.push(`${redirectBase}/${res.id}`);
        router.refresh();
      } else if (orcamento) {
        const res = await atualizarOrcamento(orcamento.id, { ...payload, status: statusFinal });
        if (!res.success) {
          setErro(res.error ?? "Erro ao atualizar orçamento");
          return;
        }
        router.push(`${redirectBase}/${orcamento.id}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {clienteEmpresa && (
        <div className="rounded-2xl border border-bg-border bg-bg-surface px-4 py-3 text-sm text-text-muted">
          Orçamento para: <span className="font-semibold text-text">{clienteEmpresa}</span>
        </div>
      )}

      {/* Dados do cliente final */}
      <section className="rounded-2xl border border-bg-border bg-bg-surface p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-text">
          <User size={16} className="text-accent" /> Cliente
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Nome *</span>
            <input
              type="text"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Nome do cliente"
              className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-text-muted">
              <Mail size={11} /> E-mail
            </span>
            <input
              type="email"
              value={clienteEmail}
              onChange={(e) => setClienteEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-text-muted">
              <Phone size={11} /> Telefone
            </span>
            <input
              type="tel"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-text-muted">
              <Calendar size={11} /> Data de emissão
            </span>
            <input
              type="date"
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
              className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-text-muted">
              <Calendar size={11} /> Válido até *
            </span>
            <input
              type="date"
              value={dataValidade}
              onChange={(e) => setDataValidade(e.target.value)}
              className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </label>
        </div>
      </section>

      {/* Produtos */}
      <section className="rounded-2xl border border-bg-border bg-bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-text">
            <Package size={16} className="text-accent" /> Produtos
          </h2>
          <button
            type="button"
            onClick={() => setProdutos((p) => [...p, novoProdutoVazio()])}
            className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20"
          >
            <Plus size={13} /> Adicionar produto
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {produtos.map((p, idx) => (
            <ProdutoCard
              key={p.id}
              produto={p}
              index={idx}
              total={produtos.length}
              onUpdate={(patch) => atualizarProduto(idx, patch)}
              onRemove={() => removerProduto(idx)}
              onUpload={(file) => fazerUpload(idx, file)}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 border-t border-bg-border pt-4">
          <span className="text-sm text-text-muted">Total:</span>
          <span className="font-display text-xl font-bold text-accent">
            {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </div>
      </section>

      {/* Pagamento + Observações */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-text">
            <CreditCard size={16} className="text-accent" /> Formas de pagamento
          </h2>
          <textarea
            value={formasPagamento}
            onChange={(e) => setFormasPagamento(e.target.value)}
            rows={4}
            placeholder="Ex.: À vista (5% desconto) • PIX • Cartão até 12x sem juros"
            className="w-full rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </div>

        <div className="rounded-2xl border border-bg-border bg-bg-surface p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-text">
            <StickyNote size={16} className="text-accent" /> Observações <span className="text-xs font-normal text-text-subtle">(opcional)</span>
          </h2>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={4}
            placeholder="Observações adicionais sobre o orçamento..."
            className="w-full rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </div>
      </section>

      {erro && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {erro}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => submeter("rascunho")}
          className="flex items-center gap-2 rounded-lg border border-bg-border bg-bg-surface px-4 py-2.5 text-sm font-medium text-text-muted transition hover:text-text disabled:opacity-50"
        >
          <Save size={15} /> Salvar rascunho
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submeter("enviado")}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Send size={15} /> {modo === "criar" ? "Gerar orçamento" : "Salvar e enviar"}
        </button>
      </div>
    </div>
  );
}

// ================================================================
// ProdutoCard
// ================================================================

function ProdutoCard({
  produto,
  index,
  total,
  onUpdate,
  onRemove,
  onUpload,
}: {
  produto: OrcamentoProduto;
  index: number;
  total: number;
  onUpdate: (patch: Partial<OrcamentoProduto>) => void;
  onRemove: () => void;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-bg-border bg-bg p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
          Produto {index + 1}
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-muted transition hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 size={12} /> Remover
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
        {/* Imagem */}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-bg-border bg-bg-surface transition hover:border-accent"
          >
            {produto.imagem_url ? (
              <>
                <Image
                  src={produto.imagem_url}
                  alt={produto.nome}
                  fill
                  sizes="180px"
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-white">
                    <Upload size={13} /> Trocar
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-text-subtle">
                <ImageIcon size={22} />
                <span className="text-[11px]">Adicionar foto</span>
              </div>
            )}
          </button>
        </div>

        {/* Campos */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={produto.nome}
            onChange={(e) => onUpdate({ nome: e.target.value })}
            placeholder="Nome do produto *"
            className="rounded-lg border border-bg-border bg-bg-surface px-3 py-2 text-sm font-medium text-text outline-none focus:border-accent"
          />

          <textarea
            value={produto.descricao}
            onChange={(e) => onUpdate({ descricao: e.target.value })}
            placeholder="Descrição (medidas, material, acabamento...)"
            rows={2}
            className="rounded-lg border border-bg-border bg-bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-text-muted">Valor (R$) *</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={produto.valor || ""}
                onChange={(e) => onUpdate({ valor: Number(e.target.value) })}
                placeholder="0,00"
                className="rounded-lg border border-bg-border bg-bg-surface px-3 py-2 text-sm font-semibold text-text outline-none focus:border-accent"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-text-muted">Quantidade</span>
              <input
                type="number"
                min="1"
                step="1"
                value={produto.quantidade}
                onChange={(e) => onUpdate({ quantidade: Math.max(1, Number(e.target.value)) })}
                className="rounded-lg border border-bg-border bg-bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </label>

            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-text-muted">Prazo de entrega</span>
              <input
                type="text"
                value={produto.prazo_entrega}
                onChange={(e) => onUpdate({ prazo_entrega: e.target.value })}
                placeholder="Ex.: 30 a 45 dias úteis"
                className="rounded-lg border border-bg-border bg-bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-3">
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={produto.em_promocao}
                onChange={(e) =>
                  onUpdate({
                    em_promocao: e.target.checked,
                    valor_de: e.target.checked ? produto.valor_de ?? 0 : null,
                  })
                }
                className="h-4 w-4 rounded border-bg-border bg-bg accent-accent"
              />
              <Tag size={13} className="text-accent" />
              <span>Em promoção (De / Por)</span>
            </label>

            {produto.em_promocao && (
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-text-muted">DE (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={produto.valor_de ?? ""}
                    onChange={(e) => onUpdate({ valor_de: Number(e.target.value) || null })}
                    placeholder="0,00"
                    className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm text-text-muted line-through outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-text-muted">POR (R$)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={produto.valor || ""}
                    onChange={(e) => onUpdate({ valor: Number(e.target.value) })}
                    placeholder="0,00"
                    className="rounded-lg border border-bg-border bg-bg px-3 py-2 text-sm font-semibold text-accent outline-none focus:border-accent"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
