import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NovoOrcamentoForm } from "@/components/orcamentos/NovoOrcamentoForm";

export const metadata: Metadata = { title: "Novo orçamento" };

interface PageProps {
  searchParams: { cliente?: string };
}

export default async function NovoOrcamentoAdminPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome_empresa")
    .eq("status", "ativo")
    .order("nome_empresa");

  // Admin precisa escolher cliente antes de criar
  const clienteId = searchParams.cliente;

  if (!clienteId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Link
          href="/orcamentos"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft size={14} /> Voltar
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <FileText size={17} className="text-accent" />
          </div>
          <h1 className="font-display text-xl font-bold text-text">
            Para qual cliente?
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(clientes ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/orcamentos/novo?cliente=${c.id}`}
              className="rounded-2xl border border-bg-border bg-bg-surface p-5 text-sm font-medium text-text transition hover:border-accent hover:bg-bg-surface2"
            >
              {c.nome_empresa}
            </Link>
          ))}
          {(clientes ?? []).length === 0 && (
            <p className="text-sm text-text-muted">Nenhum cliente ativo cadastrado.</p>
          )}
        </div>
      </div>
    );
  }

  const cliente = (clientes ?? []).find((c) => c.id === clienteId);
  if (!cliente) redirect("/orcamentos/novo");

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link
        href="/orcamentos"
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
          <p className="text-sm text-text-muted">Preencha os dados abaixo.</p>
        </div>
      </div>

      <NovoOrcamentoForm
        modo="criar"
        clienteId={clienteId}
        clienteEmpresa={cliente.nome_empresa}
        redirectBase="/orcamentos"
      />
    </div>
  );
}
