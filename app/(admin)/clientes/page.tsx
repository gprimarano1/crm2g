import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  AnimatedClienteGrid,
  AnimatedClienteCard,
} from "@/components/clientes/ClienteCard";
import { ClienteFilters } from "@/components/clientes/ClienteFilters";
import { getClientesComMetricas } from "@/lib/actions/clientes";

export const metadata: Metadata = { title: "Clientes" };

interface PageProps {
  searchParams: { q?: string; status?: string };
}

async function ClientesList({ q, status }: { q?: string; status?: string }) {
  const clientes = await getClientesComMetricas({ q, status });

  if (clientes.length === 0) {
    return (
      <EmptyState
        icon={<Building2 size={24} />}
        title={q || status ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
        description={
          q || status
            ? "Tente ajustar os filtros de busca."
            : "Cadastre seu primeiro cliente para começar."
        }
        action={
          !q && !status ? (
            <Link href="/clientes/novo">
              <Button icon={<Plus size={15} />}>Novo cliente</Button>
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <AnimatedClienteGrid>
      {clientes.map((c) => (
        <AnimatedClienteCard key={c.id} cliente={c} />
      ))}
    </AnimatedClienteGrid>
  );
}

export default function ClientesPage({ searchParams }: PageProps) {
  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Clientes</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Gestão completa dos clientes ativos
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button icon={<Plus size={15} />}>Novo cliente</Button>
        </Link>
      </div>

      {/* Filtros */}
      <Suspense>
        <ClienteFilters />
      </Suspense>

      {/* Lista */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-bg-border bg-bg-surface"
              />
            ))}
          </div>
        }
      >
        <ClientesList q={searchParams.q} status={searchParams.status} />
      </Suspense>
    </div>
  );
}
