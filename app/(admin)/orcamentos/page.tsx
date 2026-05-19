import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrcamentos } from "@/lib/actions/orcamentos";
import { agregarTopProdutos } from "@/lib/orcamentos/agregacoes";
import { OrcamentosList } from "@/components/orcamentos/OrcamentosList";
import { OrcamentosFiltros } from "@/components/orcamentos/OrcamentosFiltros";
import { TopProdutosCard } from "@/components/orcamentos/TopProdutosCard";

export const metadata: Metadata = { title: "Orçamentos" };

interface PageProps {
  searchParams: {
    cliente?:     string;
    status?:      string;
    data_inicio?: string;
    data_fim?:    string;
  };
}

export default async function OrcamentosAdminPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome_empresa")
    .eq("status", "ativo")
    .order("nome_empresa");

  const orcamentos = await getOrcamentos({
    clienteId:  searchParams.cliente && searchParams.cliente !== "todos" ? searchParams.cliente : undefined,
    status:     searchParams.status,
    dataInicio: searchParams.data_inicio,
    dataFim:    searchParams.data_fim,
  });

  const topProdutos = agregarTopProdutos(orcamentos, 10);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <FileText size={17} className="text-accent" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text">Orçamentos</h1>
            <p className="text-sm text-text-muted">
              Gere e gerencie orçamentos enviáveis por link.
            </p>
          </div>
        </div>

        <Link
          href="/orcamentos/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={15} /> Novo orçamento
        </Link>
      </div>

      <OrcamentosFiltros clientes={clientes ?? []} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <OrcamentosList orcamentos={orcamentos} basePath="/orcamentos" showCliente />
        <TopProdutosCard itens={topProdutos} />
      </div>
    </div>
  );
}
