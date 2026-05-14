import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendCAPIEvent } from "@/lib/capi/client";
import type { LeadStatus } from "@/lib/actions/leads";

const CAPI_TRIGGERS: Partial<Record<LeadStatus, string>> = {
  em_contato:        "Contact",
  orcamento_enviado: "SubmitApplication",
  venda_fechada:     "Purchase",
};

const STATUS_TIMESTAMPS: Partial<Record<LeadStatus, string>> = {
  em_contato:    "contacted_at",
  qualificado:   "qualified_at",
  venda_fechada: "sold_at",
};

interface PatchBody {
  status:                LeadStatus;
  notas?:                string;
  valor_venda?:          number;
  atendente_nome?:       string;
  orcamento_valor?:      number;
  orcamento_arquivo_url?: string;
  venda_pedido_url?:     string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createAdminClient();
  const leadId   = params.id;

  let body: PatchBody;
  try {
    body = await request.json() as PatchBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const {
    status, notas, valor_venda,
    atendente_nome, orcamento_valor, orcamento_arquivo_url, venda_pedido_url,
  } = body;

  const validStatuses: LeadStatus[] = [
    "novo", "em_contato", "qualificado", "orcamento_enviado", "venda_fechada", "perdido",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*, clientes!inner(meta_pixel_id, meta_capi_token)")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const statusAnterior = lead.status as LeadStatus;

  const updateData: Record<string, unknown> = { status };
  if (notas                 !== undefined) updateData.notas                  = notas;
  if (valor_venda           !== undefined) updateData.valor_venda            = valor_venda;
  if (atendente_nome        !== undefined) updateData.atendente_nome         = atendente_nome;
  if (orcamento_valor       !== undefined) updateData.orcamento_valor        = orcamento_valor;
  if (orcamento_arquivo_url !== undefined) updateData.orcamento_arquivo_url  = orcamento_arquivo_url;
  if (venda_pedido_url      !== undefined) updateData.venda_pedido_url       = venda_pedido_url;

  const tsField = STATUS_TIMESTAMPS[status];
  if (tsField && !lead[tsField]) updateData[tsField] = new Date().toISOString();

  const { data: updatedLead, error: updateError } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", leadId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (statusAnterior !== status) {
    await supabase.from("lead_status_history").insert({
      lead_id:         leadId,
      status_anterior: statusAnterior,
      status_novo:     status,
      notas:           notas ?? null,
    });
  }

  const capiEventName = CAPI_TRIGGERS[status];
  const cliente = lead.clientes as { meta_pixel_id: string | null; meta_capi_token: string | null } | null;

  if (capiEventName && statusAnterior !== status && cliente?.meta_pixel_id && cliente?.meta_capi_token) {
    const capiValor = status === "orcamento_enviado" ? orcamento_valor : valor_venda;
    sendCAPIEvent(
      lead.cliente_id, leadId, capiEventName,
      { email: lead.email ?? undefined, telefone: lead.telefone ?? undefined, nome: lead.nome ?? undefined, valor: capiValor },
      { pixelId: cliente.meta_pixel_id, capiToken: cliente.meta_capi_token }
    ).then((r) => {
      if (r.success) supabase.from("leads").update({ capi_enviado: true }).eq("id", leadId);
    }).catch(() => {});
  }

  return NextResponse.json({ lead: updatedLead });
}
