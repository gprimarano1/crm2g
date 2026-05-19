import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrcamentoById } from "@/lib/actions/orcamentos";
import { OrcamentoDetalhe } from "@/components/orcamentos/OrcamentoDetalhe";

export const metadata: Metadata = { title: "Detalhes do orçamento" };

interface PageProps {
  params: { id: string };
}

export default async function OrcamentoClienteDetalhePage({ params }: PageProps) {
  const orc = await getOrcamentoById(params.id);
  if (!orc) notFound();

  return (
    <div className="p-6">
      <OrcamentoDetalhe orcamento={orc} basePath="/painel/orcamentos" />
    </div>
  );
}
