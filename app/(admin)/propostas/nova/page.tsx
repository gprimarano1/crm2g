import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { NovaPropostaForm } from "@/components/propostas/NovaPropostaForm";

export const metadata: Metadata = { title: "Nova Proposta" };

export default function NovaPropostaPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/propostas"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:text-text transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <FileText size={17} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text">Nova Proposta</h1>
          <p className="text-sm text-text-muted">Crie uma proposta comercial animada em 3 passos</p>
        </div>
      </div>

      <NovaPropostaForm baseUrl={baseUrl} />
    </div>
  );
}
