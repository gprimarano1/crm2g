import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Tipo = "duvida" | "aceitar" | "recusar";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body: { tipo: Tipo; texto?: string } = await request.json();
    const { tipo, texto } = body;

    if (!tipo || !["duvida", "aceitar", "recusar"].includes(tipo)) {
      return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
    }

    if (tipo === "duvida" && !texto?.trim()) {
      return NextResponse.json({ error: "texto é obrigatório para dúvidas" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    const { data: proposta } = await supabase
      .from("propostas")
      .select("id, status, visualizada_em")
      .eq("slug", params.slug)
      .single();

    if (!proposta) {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
    }

    const now             = new Date().toISOString();
    const primeiraVisita  = !proposta.visualizada_em;

    if (tipo === "duvida") {
      await supabase.from("proposta_duvidas").insert({
        proposta_id: proposta.id,
        texto:       texto!.trim(),
      });

      if (primeiraVisita) {
        await supabase
          .from("propostas")
          .update({ visualizada_em: now, status: "visualizada" })
          .eq("id", proposta.id)
          .eq("status", "pendente");
      }

      return NextResponse.json({ success: true });
    }

    if (tipo === "aceitar") {
      await supabase
        .from("propostas")
        .update({
          status:       "aceita",
          aceita_em:    now,
          ...(primeiraVisita ? { visualizada_em: now } : {}),
        })
        .eq("id", proposta.id);

      return NextResponse.json({ success: true });
    }

    if (tipo === "recusar") {
      await supabase
        .from("propostas")
        .update({
          status:        "recusada",
          recusada_em:   now,
          motivo_recusa: texto?.trim() || null,
          ...(primeiraVisita ? { visualizada_em: now } : {}),
        })
        .eq("id", proposta.id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  } catch (err) {
    console.error("[interacao]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
