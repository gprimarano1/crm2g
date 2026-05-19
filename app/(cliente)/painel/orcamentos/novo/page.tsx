import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NovoOrcamentoForm } from "@/components/orcamentos/NovoOrcamentoForm";

export const metadata: Metadata = { title: "Novo orçamento" };

async function getClienteContexto(): Promise<{ id: string; nome: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("perfis")
    .select("cliente_id, clientes(nome_empresa)")
    .eq("id", user.id)
    .single();

  if (!profile?.cliente_id) return null;
  const data = Array.isArray(profile.clientes)
    ? (profile.clientes[0] as { nome_empresa: string } | undefined)
    : (profile.clientes as { nome_empresa: string } | null | undefined);

  return { id: profile.cliente_id, nome: data?.nome_empresa ?? "Cliente" };
}

export default async function NovoOrcamentoClientePage() {
  const ctx = await getClienteContexto();
  if (!ctx) redirect("/login");

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link
        href="/painel/orcamentos"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft size={14} /> Voltar
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <FileText size={17} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text">Novo orçamento</h1>
          <p className="text-sm text-text-muted">
            Preencha os dados e gere o link para enviar ao seu cliente.
          </p>
        </div>
      </div>

      <NovoOrcamentoForm
        modo="criar"
        clienteId={ctx.id}
        clienteEmpresa={ctx.nome}
        redirectBase="/painel/orcamentos"
      />
    </div>
  );
}
