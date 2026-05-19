import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrcamentoById } from "@/lib/actions/orcamentos";
import { NovoOrcamentoForm } from "@/components/orcamentos/NovoOrcamentoForm";

export const metadata: Metadata = { title: "Editar orçamento" };

interface PageProps {
  params: { id: string };
}

export default async function EditarOrcamentoAdminPage({ params }: PageProps) {
  const orc = await getOrcamentoById(params.id);
  if (!orc) notFound();

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("nome_empresa")
    .eq("id", orc.cliente_id)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link
        href={`/orcamentos/${orc.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft size={14} /> Voltar
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <FileText size={17} className="text-accent" />
        </div>
        <h1 className="font-display text-xl font-bold text-text">Editar orçamento</h1>
      </div>

      <NovoOrcamentoForm
        modo="editar"
        clienteId={orc.cliente_id}
        clienteEmpresa={cliente?.nome_empresa}
        redirectBase="/orcamentos"
        orcamento={{
          id:               orc.id,
          cliente_nome:     orc.cliente_nome,
          cliente_email:    orc.cliente_email,
          cliente_telefone: orc.cliente_telefone,
          data_emissao:     orc.data_emissao,
          data_validade:    orc.data_validade,
          produtos:         orc.produtos,
          formas_pagamento: orc.formas_pagamento,
          observacoes:      orc.observacoes,
        }}
      />
    </div>
  );
}
