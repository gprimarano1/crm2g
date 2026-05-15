import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getClientesParaRelatorio } from "@/lib/actions/relatorios";
import { NovoRelatorioForm } from "@/components/relatorios/NovoRelatorioForm";

export const metadata: Metadata = { title: "Novo Relatório" };

export default async function NovoRelatorioPage() {
  const clientes = await getClientesParaRelatorio();
  const baseUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/relatorios"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:text-text transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <FileText size={17} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text">Novo Relatório</h1>
          <p className="text-sm text-text-muted">Gere um relatório para compartilhar com o cliente</p>
        </div>
      </div>

      <NovoRelatorioForm clientes={clientes} baseUrl={baseUrl} />
    </div>
  );
}
