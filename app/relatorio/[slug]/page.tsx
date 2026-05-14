import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRelatorioBySlug } from "@/lib/actions/relatorios";
import { RelatorioPagina } from "@/components/relatorios/RelatorioPagina";

interface Props {
  params: { slug: string };
}

// ================================================================
// OG Meta tags para preview no WhatsApp / redes sociais
// ================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rel = await getRelatorioBySlug(params.slug);
  if (!rel) return { title: "Relatório não encontrado" };

  const inicio = new Date(rel.periodo_inicio + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  const fim    = new Date(rel.periodo_fim    + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const nome   = (rel.clientes as { nome_empresa: string } | null)?.nome_empresa ?? "";
  const leads  = rel.dados?.kpis?.leads_total ?? 0;

  return {
    title:       `Relatório de Performance — ${nome}`,
    description: `Período: ${inicio} a ${fim}. ${leads} leads captados. Análise completa de campanhas e resultados.`,
    openGraph: {
      title:       `Relatório CRM 2G — ${nome}`,
      description: `Performance de ${inicio} a ${fim}: ${leads} leads, campanhas e insights.`,
      type:        "website",
    },
    twitter: {
      card:        "summary",
      title:       `Relatório CRM 2G — ${nome}`,
      description: `${leads} leads captados de ${inicio} a ${fim}.`,
    },
  };
}

// ================================================================
// Page — Server Component
// ================================================================

export default async function RelatorioPublicoPage({ params }: Props) {
  const rel = await getRelatorioBySlug(params.slug);

  if (!rel) notFound();

  return <RelatorioPagina relatorio={rel} slug={params.slug} />;
}
