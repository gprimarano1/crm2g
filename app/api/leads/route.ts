import { NextRequest, NextResponse } from "next/server";
import { getLeads } from "@/lib/actions/leads";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const clienteId = searchParams.get("cliente_id");
  if (!clienteId) {
    return NextResponse.json({ error: "cliente_id obrigatório" }, { status: 400 });
  }

  const page     = parseInt(searchParams.get("page") ?? "1", 10);
  const status   = searchParams.get("status") ?? undefined;
  const periodo  = searchParams.get("periodo") ?? "7d";
  const campanha = searchParams.get("campanha") ?? undefined;

  const result = await getLeads({ clienteId, status, periodo, campanha, page });

  return NextResponse.json(result);
}
