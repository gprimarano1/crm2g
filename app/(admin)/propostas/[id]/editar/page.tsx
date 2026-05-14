import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { getPropostaById } from "@/lib/actions/propostas";
import { NovaPropostaForm } from "@/components/propostas/NovaPropostaForm";

export const metadata: Metadata = { title: "Editar Proposta" };

export default async function EditarPropostaPage({ params }: { params: { id: string } }) {
  const proposta = await getPropostaById(params.id);
  if (!proposta) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/propostas/${params.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-bg-border text-text-subtle hover:text-text transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <Edit size={17} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text">Editar Proposta</h1>
          <p className="text-sm text-text-muted">{proposta.empresa} — {proposta.prospect_nome}</p>
        </div>
      </div>

      <NovaPropostaForm propostaExistente={proposta} baseUrl={baseUrl} />
    </div>
  );
}
