import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrcamentos } from "@/lib/actions/orcamentos";
import { OrcamentosList } from "@/components/orcamentos/OrcamentosList";

export const metadata: Metadata = { title: "Orçamentos" };

async function getClienteId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("perfis")
    .select("cliente_id")
    .eq("id", user.id)
    .single();
  return profile?.cliente_id ?? null;
}

export default async function OrcamentosClientePage() {
  const clienteId = await getClienteId();
  if (!clienteId) redirect("/login");

  const orcamentos = await getOrcamentos({ clienteId });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <FileText size={17} className="text-accent" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text">
              Orçamentos
            </h1>
            <p className="text-sm text-text-muted">
              Gere orçamentos para enviar aos seus clientes por link.
            </p>
          </div>
        </div>

        <Link
          href="/painel/orcamentos/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={15} /> Novo orçamento
        </Link>
      </div>

      <OrcamentosList orcamentos={orcamentos} basePath="/painel/orcamentos" />
    </div>
  );
}
