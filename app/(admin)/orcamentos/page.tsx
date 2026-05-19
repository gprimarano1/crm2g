import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrcamentos } from "@/lib/actions/orcamentos";
import { OrcamentosList } from "@/components/orcamentos/OrcamentosList";

export const metadata: Metadata = { title: "Orçamentos" };

interface PageProps {
  searchParams: { cliente?: string; status?: string };
}

export default async function OrcamentosAdminPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome_empresa")
    .eq("status", "ativo")
    .order("nome_empresa");

  const orcamentos = await getOrcamentos({
    clienteId: searchParams.cliente && searchParams.cliente !== "todos" ? searchParams.cliente : undefined,
    status:    searchParams.status,
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <FileText size={17} className="text-accent" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text">Orçamentos</h1>
            <p className="text-sm text-text-muted">
              Gere e gerencie orçamentos enviáveis por link.
            </p>
          </div>
        </div>

        <Link
          href="/orcamentos/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={15} /> Novo orçamento
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-bg-border bg-bg-surface px-4 py-3">
        <span className="text-xs font-medium text-text-muted">Filtrar:</span>
        <FiltroLink href="/orcamentos" label="Todos" active={!searchParams.cliente || searchParams.cliente === "todos"} />
        {(clientes ?? []).map((c) => (
          <FiltroLink
            key={c.id}
            href={`/orcamentos?cliente=${c.id}`}
            label={c.nome_empresa}
            active={searchParams.cliente === c.id}
          />
        ))}
      </div>

      <OrcamentosList orcamentos={orcamentos} basePath="/orcamentos" showCliente />
    </div>
  );
}

function FiltroLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active ? "bg-accent text-white" : "bg-bg text-text-muted hover:text-text"
      }`}
    >
      {label}
    </Link>
  );
}
