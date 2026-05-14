import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPropostaBySlug } from "@/lib/actions/propostas";
import { PropostaPagina } from "@/components/propostas/PropostaPagina";

interface Props {
  params: { slug: string };
}

// ================================================================
// OG Meta tags para preview no WhatsApp / redes sociais
// ================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const proposta = await getPropostaBySlug(params.slug);
  if (!proposta) return { title: "Proposta não encontrada" };

  const servicosIncluidos = proposta.servicos.filter((s) => s.incluido).length;

  return {
    title:       `Proposta CRM 2G — ${proposta.empresa}`,
    description: `Proposta exclusiva para ${proposta.empresa}. ${servicosIncluidos} serviços incluídos. Acesse para ver todos os detalhes.`,
    openGraph: {
      title:       `Proposta CRM 2G para ${proposta.empresa}`,
      description: `${proposta.prospect_nome ? `Para ${proposta.prospect_nome} · ` : ""}${servicosIncluidos} serviços · ${proposta.prazo_contrato ?? "Contrato flexível"}`,
      type:        "website",
    },
    twitter: {
      card:        "summary",
      title:       `Proposta para ${proposta.empresa}`,
      description: `Proposta comercial exclusiva — ${servicosIncluidos} serviços incluídos.`,
    },
  };
}

// ================================================================
// Page
// ================================================================

export default async function PropostaPublicaPage({ params }: Props) {
  const proposta = await getPropostaBySlug(params.slug);

  if (!proposta) notFound();

  return <PropostaPagina proposta={proposta} slug={params.slug} />;
}
