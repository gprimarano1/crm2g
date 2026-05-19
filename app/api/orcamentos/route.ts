import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clienteId = request.nextUrl.searchParams.get("cliente_id");
  if (!clienteId) {
    return NextResponse.json({ error: "cliente_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orcamentos")
    .select("id, slug, numero, cliente_nome, total, status, created_at")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orcamentos: data ?? [] }, {
    headers: { "Cache-Control": "no-store" },
  });
}
