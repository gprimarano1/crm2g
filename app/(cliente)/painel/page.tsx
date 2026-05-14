import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getLeadsParaKanban } from "@/lib/actions/leads";
import { LeadKanban } from "@/components/leads/LeadKanban";

async function getClienteId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("perfis")
    .select("cliente_id")
    .eq("id", user.id)
    .single();

  return profile?.cliente_id ?? null;
}

async function PainelKanban({ clienteId }: { clienteId: string }) {
  const leads = await getLeadsParaKanban(clienteId);
  return (
    <LeadKanban
      clienteId={clienteId}
      initialLeads={leads}
      showClientSelector={false}
    />
  );
}

export default async function PainelClientePage() {
  const clienteId = await getClienteId();

  if (!clienteId) redirect("/login");

  return (
    <Suspense
      fallback={
        <div className="flex gap-4 overflow-x-auto px-6 py-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[70vh] w-64 shrink-0 animate-pulse rounded-2xl border border-bg-border bg-bg-surface"
            />
          ))}
        </div>
      }
    >
      <PainelKanban clienteId={clienteId} />
    </Suspense>
  );
}
