import type { Metadata } from "next";
import { Suspense } from "react";
import { Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadKanban } from "@/components/leads/LeadKanban";
import { getLeadsParaKanban } from "@/lib/actions/leads";

export const metadata: Metadata = { title: "Leads" };

interface PageProps {
  searchParams: {
    cliente_id?: string;
  };
}

async function getClientes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select("id, nome_empresa")
    .eq("status", "ativo")
    .order("nome_empresa");
  return data ?? [];
}

async function LeadsFeed({ searchParams }: PageProps) {
  const clientes  = await getClientes();
  const clienteId = searchParams.cliente_id ?? clientes[0]?.id;

  if (!clienteId) {
    return (
      <EmptyState
        icon={<Users2 size={24} />}
        title="Nenhum cliente ativo"
        description="Cadastre um cliente para começar a receber leads."
      />
    );
  }

  const leads = await getLeadsParaKanban(clienteId);

  return (
    <LeadKanban
      key={clienteId}
      clienteId={clienteId}
      initialLeads={leads}
      showClientSelector={clientes.length > 1}
      clientes={clientes}
    />
  );
}

export default function LeadsPage({ searchParams }: PageProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Leads</h1>
        <p className="mt-0.5 text-sm text-text-muted">
          Kanban em tempo real · atualizado via Meta Lead Ads
        </p>
      </div>

      <Suspense
        key={searchParams.cliente_id ?? "default"}
        fallback={
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-96 w-72 shrink-0 animate-pulse rounded-2xl border border-bg-border bg-bg-surface"
              />
            ))}
          </div>
        }
      >
        <LeadsFeed searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
