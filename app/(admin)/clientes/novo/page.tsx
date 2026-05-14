import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NovoClienteForm } from "@/components/clientes/NovoClienteForm";

export const metadata: Metadata = { title: "Novo Cliente" };

export default function NovoClientePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/clientes"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-bg-border bg-bg-surface text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={17} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-text">
            Novo cliente
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Preencha os dados para cadastrar o cliente
          </p>
        </div>
      </div>

      <NovoClienteForm />
    </div>
  );
}
