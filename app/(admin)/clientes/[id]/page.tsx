import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { ClienteTabs } from "@/components/clientes/ClienteTabs";
import { VisaoGeralTab } from "@/components/clientes/VisaoGeralTab";
import { MetricasTab } from "@/components/clientes/MetricasTab";
import { getMetricasManuais, getMetricasAutomaticas } from "@/lib/actions/metricas";
import { ConfiguracoesTab } from "@/components/clientes/ConfiguracoesTab";
import { CAPITab } from "@/components/clientes/CAPITab";
import { InsightsTab } from "@/components/clientes/InsightsTab";
import type { Cliente, ClienteStatus } from "@/lib/actions/clientes";

interface PageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select("nome_empresa")
    .eq("id", params.id)
    .single();
  return { title: data?.nome_empresa ?? "Cliente" };
}

export default async function ClienteDetailPage({
  params,
  searchParams,
}: PageProps) {
  const tab = searchParams.tab ?? "visao-geral";
  const supabase = await createClient();

  // Busca dados do cliente
  const { data: clienteRaw, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !clienteRaw) notFound();
  const cliente = clienteRaw as Cliente;

  // Busca dados específicos da tab ativa
  let existingAccesses: { id: string; email: string; nome: string | null }[] = [];
  let metricasInitialData: {
    manuais: Awaited<ReturnType<typeof getMetricasManuais>>;
    automatico: Awaited<ReturnType<typeof getMetricasAutomaticas>>;
  } | null = null;

  if (tab === "configuracoes") {
    const { data } = await supabase
      .from("perfis")
      .select("id, email, nome")
      .eq("cliente_id", params.id)
      .eq("role", "cliente")
      .order("created_at", { ascending: true });
    existingAccesses = data ?? [];
  }

  if (tab === "metricas") {
    const [manuais, automatico] = await Promise.all([
      getMetricasManuais(params.id),
      getMetricasAutomaticas(params.id),
    ]);
    metricasInitialData = { manuais, automatico };
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-bg-border bg-bg-surface px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link
              href="/clientes"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:text-text transition-colors"
            >
              <ArrowLeft size={15} />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-xl font-bold text-text">
                  {cliente.nome_empresa}
                </h1>
                <Badge
                  variant={cliente.status as ClienteStatus}
                  dot
                />
              </div>
              <p className="text-sm text-text-muted mt-0.5">
                {cliente.responsavel}
                {cliente.segmento && (
                  <span className="ml-2 text-text-subtle">· {cliente.segmento}</span>
                )}
              </p>
            </div>
          </div>

          <Link
            href={`/clientes/${params.id}?tab=configuracoes`}
            className="flex items-center gap-2 rounded-xl border border-bg-border px-3 py-2 text-sm text-text-muted hover:bg-bg-surface2 hover:text-text transition-all"
          >
            <Pencil size={14} />
            Editar
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <ClienteTabs clienteId={params.id} activeTab={tab} />

      {/* Conteúdo da tab */}
      <div className="p-6">
        {tab === "visao-geral" && (
          <VisaoGeralTab clienteId={params.id} />
        )}

        {tab === "campanhas" && (
          <PlaceholderTab
            title="Campanhas"
            description="As campanhas deste cliente aparecerão aqui após sincronização com o Meta Ads."
          />
        )}

        {tab === "leads" && (
          <PlaceholderTab
            title="Leads"
            description="Os leads captados para este cliente aparecerão aqui em tempo real."
          />
        )}

        {tab === "metricas" && metricasInitialData && (
          <MetricasTab
            clienteId={params.id}
            initialManuais={metricasInitialData.manuais}
            initialAutomatico={metricasInitialData.automatico}
          />
        )}

        {tab === "insights" && (
          <div className="max-w-4xl">
            <InsightsTab clienteId={params.id} />
          </div>
        )}

        {tab === "capi" && (
          <div className="max-w-4xl">
            <CAPITab clienteId={params.id} />
          </div>
        )}

        {tab === "configuracoes" && (
          <div className="max-w-3xl">
            <ConfiguracoesTab
              cliente={cliente}
              existingAccesses={existingAccesses}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-bg-border">
      <div className="text-center">
        <p className="font-display font-semibold text-text">{title}</p>
        <p className="text-sm text-text-muted mt-1 max-w-xs">{description}</p>
      </div>
    </div>
  );
}
