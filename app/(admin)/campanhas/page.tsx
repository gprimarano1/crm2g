import type { Metadata } from "next";
import { Suspense } from "react";
import { BarChart2, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { CampanhasSyncBar } from "@/components/campanhas/CampanhasSyncBar";
import { CampanhasTable } from "@/components/campanhas/CampanhasTable";
import { getCampanhasCliente } from "@/lib/actions/campanhas";

export const metadata: Metadata = { title: "Campanhas" };

interface PageProps {
  searchParams: {
    cliente_id?: string;
    status?: string;
  };
}

// ================================================================
// Busca clientes elegíveis (com credenciais Meta)
// ================================================================

async function getClientesElegiveis() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select("id, nome_empresa, meta_last_synced_at")
    .not("meta_ad_account_id", "is", null)
    .not("meta_access_token", "is", null)
    .eq("status", "ativo")
    .order("nome_empresa");
  return data ?? [];
}

// ================================================================
// Lista de campanhas (componente async com Suspense)
// ================================================================

async function CampanhasList({
  clienteId,
  status,
}: {
  clienteId: string;
  status?: string;
}) {
  const campanhas = await getCampanhasCliente(clienteId, { status });

  return <CampanhasTable campanhas={campanhas} clienteId={clienteId} />;
}

// ================================================================
// Page
// ================================================================

export default async function CampanhasPage({ searchParams }: PageProps) {
  const clienteId = searchParams.cliente_id ?? null;
  const statusFiltro = searchParams.status ?? "todos";

  const clientes = await getClientesElegiveis();

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Campanhas</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Gestão e sincronização de campanhas Meta Ads
          </p>
        </div>
      </div>

      {/* Sem clientes elegíveis */}
      {clientes.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="Nenhum cliente com Meta Ads configurado"
          description="Configure o Ad Account ID e o Access Token nas configurações de um cliente para começar."
        />
      ) : (
        <>
          {/* Barra de sync + filtros */}
          <Suspense>
            <CampanhasSyncBar
              clientes={clientes as Array<{ id: string; nome_empresa: string; meta_last_synced_at: string | null }>}
              clienteIdAtivo={clienteId}
              statusAtivo={statusFiltro}
            />
          </Suspense>

          {/* Tabela */}
          {!clienteId ? (
            <EmptyState
              icon={<BarChart2 size={24} />}
              title="Selecione um cliente"
              description="Escolha um cliente no seletor acima para visualizar as campanhas."
            />
          ) : (
            <Suspense
              key={`${clienteId}-${statusFiltro}`}
              fallback={
                <div className="h-64 animate-pulse rounded-2xl border border-bg-border bg-bg-surface" />
              }
            >
              <CampanhasList clienteId={clienteId} status={statusFiltro} />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}
