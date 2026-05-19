import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrcamentoBySlug, registrarVisualizacao } from "@/lib/actions/orcamentos";
import { OrcamentoPublico } from "@/components/orcamentos/OrcamentoPublico";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const orc = await getOrcamentoBySlug(params.slug);
  if (!orc) return { title: "Orçamento não encontrado" };
  return {
    title: `Orçamento — ${orc.cliente_nome} | Full House`,
    description: `Orçamento exclusivo Full House Decoração para ${orc.cliente_nome}.`,
  };
}

export default async function OrcamentoPublicoPage({ params }: PageProps) {
  const orc = await getOrcamentoBySlug(params.slug);
  if (!orc) notFound();

  await registrarVisualizacao(params.slug);

  return <OrcamentoPublico orcamento={orc} />;
}
