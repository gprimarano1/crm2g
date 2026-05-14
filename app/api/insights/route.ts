import { NextRequest, NextResponse } from "next/server";
import { generateInsights } from "@/lib/claude/insights";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { cliente_id: string; periodo?: string };

    if (!body.cliente_id) {
      return NextResponse.json({ error: "cliente_id obrigatório" }, { status: 400 });
    }

    const result = await generateInsights(body.cliente_id, body.periodo ?? "30d");
    return NextResponse.json(result);
  } catch (err) {
    console.error("[API Insights] Erro:", err);
    return NextResponse.json({ error: "Falha ao gerar insights" }, { status: 500 });
  }
}
