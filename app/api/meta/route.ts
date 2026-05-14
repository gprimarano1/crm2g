import { NextRequest, NextResponse } from "next/server";
import { metaFetch } from "@/lib/meta/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adAccountId = searchParams.get("account_id");
  const resource = searchParams.get("resource") ?? "insights";
  const datePreset = searchParams.get("date_preset") ?? "last_30d";

  if (!adAccountId) {
    return NextResponse.json({ error: "account_id obrigatório" }, { status: 400 });
  }

  const accessToken = process.env.META_SYSTEM_USER_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "Token não configurado" }, { status: 500 });
  }

  try {
    if (resource === "campaigns") {
      const data = await metaFetch<{ data: unknown[] }>(
        `act_${adAccountId}/campaigns`,
        accessToken,
        { fields: "id,name,status,objective,daily_budget,lifetime_budget", limit: "100" }
      );
      return NextResponse.json({ data: data.data });
    }

    const fields = "impressions,clicks,spend,reach,cpm,cpc,ctr,actions,cost_per_action_type";
    const data = await metaFetch<{ data: unknown[] }>(
      `act_${adAccountId}/insights`,
      accessToken,
      { fields, date_preset: datePreset }
    );
    return NextResponse.json({ data: data.data?.[0] ?? {} });
  } catch (err) {
    console.error("[API Meta] Erro:", err);
    return NextResponse.json({ error: "Falha ao buscar dados do Meta" }, { status: 500 });
  }
}
