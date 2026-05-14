import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { syncClienteCampanhas } from "@/lib/actions/campanhas";

// Valida o Bearer token para chamadas de cron ou internas
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false; // secret não configurado = bloqueado

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { cliente_id?: string; sync_all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Sincroniza todos os clientes ativos com credenciais Meta
  if (body.sync_all) {
    const supabase = await createAdminClient();

    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, nome_empresa")
      .eq("status", "ativo")
      .not("meta_ad_account_id", "is", null)
      .not("meta_access_token", "is", null);

    if (!clientes || clientes.length === 0) {
      return NextResponse.json({ ok: true, message: "Nenhum cliente elegível", synced: 0 });
    }

    const results = await Promise.allSettled(
      clientes.map((c) => syncClienteCampanhas(c.id))
    );

    const summary = results.reduce(
      (acc, r) => {
        if (r.status === "fulfilled" && r.value.success) {
          acc.synced++;
          acc.campaigns += (r.value as { success: true; campaigns: number }).campaigns;
        } else {
          acc.errors++;
        }
        return acc;
      },
      { synced: 0, errors: 0, campaigns: 0 }
    );

    return NextResponse.json({ ok: true, total: clientes.length, ...summary });
  }

  // Sincroniza um único cliente
  if (!body.cliente_id) {
    return NextResponse.json({ error: "cliente_id obrigatório" }, { status: 400 });
  }

  const result = await syncClienteCampanhas(body.cliente_id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, campaigns: result.campaigns });
}
