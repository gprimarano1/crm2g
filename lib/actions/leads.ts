"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendCAPIEvent } from "@/lib/capi/client";

// ================================================================
// Types
// ================================================================

export type LeadStatus =
  | "novo"
  | "em_contato"
  | "qualificado"
  | "orcamento_enviado"
  | "venda_fechada"
  | "perdido";

export type Lead = {
  id: string;
  cliente_id: string;
  meta_lead_id: string | null;
  nome: string;
  telefone: string | null;
  email: string | null;
  campanha_origem: string | null;
  conjunto_origem: string | null;
  formulario_id: string | null;
  status: LeadStatus;
  capi_enviado: boolean;
  notas: string | null;
  valor_venda: number | null;
  atendente_nome: string | null;
  atendente_assigned_at: string | null;
  desqualificado_motivo: string | null;
  orcamento_valor: number | null;
  orcamento_arquivo_url: string | null;
  orcamento_link_url: string | null;
  venda_pedido_url: string | null;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  qualified_at: string | null;
  sold_at: string | null;
};

export type LeadStatusHistory = {
  id: string;
  lead_id: string;
  status_anterior: string | null;
  status_novo: string;
  notas: string | null;
  created_at: string;
};

export type LeadStatusCounts = Record<LeadStatus | "total", number>;

export type LeadsPage = {
  leads: Lead[];
  total: number;
  hasMore: boolean;
};

// ================================================================
// getLeads — lista paginada com filtros
// ================================================================

export async function getLeads(opts: {
  clienteId: string;
  status?: string;
  campanha?: string;
  periodo?: string;
  page?: number;
  pageSize?: number;
}): Promise<LeadsPage> {
  const supabase = await createClient();
  const { clienteId, status, campanha, periodo = "7d", page = 1, pageSize = 20 } = opts;

  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "todos") query = query.eq("status", status);
  if (campanha) query = query.ilike("campanha_origem", `%${campanha}%`);
  if (periodo !== "todos") {
    const since = getPeriodoSince(periodo);
    if (since) query = query.gte("created_at", since.toISOString());
  }

  const { data, count } = await query;
  return {
    leads:   (data ?? []) as Lead[],
    total:   count ?? 0,
    hasMore: from + pageSize < (count ?? 0),
  };
}

// ================================================================
// getLeadsParaKanban — todos os leads sem paginação
// ================================================================

export async function getLeadsParaKanban(clienteId: string): Promise<Lead[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(300);
  return (data ?? []) as Lead[];
}

// ================================================================
// getLeadById — lead + histórico de status
// ================================================================

export async function getLeadById(
  id: string
): Promise<{ lead: Lead | null; history: LeadStatusHistory[] }> {
  const supabase = await createClient();
  const [leadRes, historyRes] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    supabase
      .from("lead_status_history")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
  ]);
  return {
    lead:    (leadRes.data ?? null) as Lead | null,
    history: (historyRes.data ?? []) as LeadStatusHistory[],
  };
}

// ================================================================
// getLeadStatusCounts — contadores por status
// ================================================================

export async function getLeadStatusCounts(
  clienteId: string,
  periodo?: string
): Promise<LeadStatusCounts> {
  const supabase = await createClient();
  let query = supabase.from("leads").select("status").eq("cliente_id", clienteId);
  if (periodo && periodo !== "todos") {
    const since = getPeriodoSince(periodo);
    if (since) query = query.gte("created_at", since.toISOString());
  }
  const { data } = await query;
  const counts: Record<string, number> = {
    novo: 0, em_contato: 0, qualificado: 0,
    orcamento_enviado: 0, venda_fechada: 0, perdido: 0, total: 0,
  };
  (data ?? []).forEach(({ status }) => {
    if (status in counts) counts[status]++;
    counts.total++;
  });
  return counts as LeadStatusCounts;
}

// ================================================================
// updateLeadNotes
// ================================================================

export async function updateLeadNotes(
  leadId: string,
  notas: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ notas }).eq("id", leadId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/leads");
  revalidatePath("/painel");
  revalidatePath("/dashboard");
  return { success: true };
}

// ================================================================
// getLeadCampanhas — campanhas únicas para filtro
// ================================================================

export async function getLeadCampanhas(clienteId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("campanha_origem")
    .eq("cliente_id", clienteId)
    .not("campanha_origem", "is", null)
    .order("campanha_origem");
  const seen: Record<string, true> = {};
  const unique: string[] = [];
  for (const d of data ?? []) {
    const v = d.campanha_origem as string | null;
    if (v && !seen[v]) { seen[v] = true; unique.push(v); }
  }
  return unique;
}

// ================================================================
// transitionLeadStatus — helper compartilhado pelas transições
// ================================================================

async function transitionLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  extraData: Record<string, unknown>,
  historyNotas: string | null,
  capiEventName: string | null,
  capiValor?: number
): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  const supabase = await createAdminClient();

  // Busca lead e cliente separadamente para evitar problemas com join !inner no PostgREST
  const { data: leadRows, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .limit(1);

  if (leadError) return { success: false, error: leadError.message };
  const lead = leadRows?.[0] ?? null;
  if (!lead) return { success: false, error: "Lead não encontrado" };

  const { data: clienteRows } = await supabase
    .from("clientes")
    .select("meta_pixel_id, meta_capi_token")
    .eq("id", lead.cliente_id)
    .limit(1);
  const cliente = clienteRows?.[0] ?? null;

  const { data: updatedRows, error: updateError } = await supabase
    .from("leads")
    .update({ status: newStatus, ...extraData })
    .eq("id", leadId)
    .select("*");

  if (updateError) return { success: false, error: updateError.message };
  const updatedLead = updatedRows?.[0] ?? null;
  if (!updatedLead) return { success: false, error: "Atualização não aplicada ao banco de dados" };

  if (lead.status !== newStatus) {
    await supabase.from("lead_status_history").insert({
      lead_id:         leadId,
      status_anterior: lead.status,
      status_novo:     newStatus,
      notas:           historyNotas,
    });
  }

  if (capiEventName) {
    if (cliente?.meta_pixel_id && cliente?.meta_capi_token) {
      sendCAPIEvent(
        lead.cliente_id, leadId, capiEventName,
        {
          email:    lead.email    ?? undefined,
          telefone: lead.telefone ?? undefined,
          nome:     lead.nome     ?? undefined,
          valor:    capiValor,
        },
        { pixelId: cliente.meta_pixel_id, capiToken: cliente.meta_capi_token }
      ).then((r) => {
        if (r.success) supabase.from("leads").update({ capi_enviado: true }).eq("id", leadId);
      }).catch(() => {});
    }
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/clientes", "layout");
  return { success: true, lead: updatedLead as Lead };
}

// ================================================================
// iniciarAtendimento — Novo → Em Atendimento  |  CAPI: Contact
// ================================================================

export async function iniciarAtendimento(
  leadId: string,
  atendenteNome: string
): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  return transitionLeadStatus(
    leadId, "em_contato",
    {
      atendente_nome:        atendenteNome.trim(),
      atendente_assigned_at: new Date().toISOString(),
      contacted_at:          new Date().toISOString(),
    },
    `Atendente: ${atendenteNome.trim()}`,
    "Contact"
  );
}

// ================================================================
// desqualificarLead — Em Atendimento → Desqualificado  |  sem CAPI
// ================================================================

export async function desqualificarLead(
  leadId: string,
  motivo: string
): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  return transitionLeadStatus(
    leadId, "perdido",
    { desqualificado_motivo: motivo.trim() },
    `Motivo: ${motivo.trim()}`,
    null
  );
}

// ================================================================
// marcarOrcamento — Em Atendimento → Orçamento  |  CAPI: SubmitApplication
// ================================================================

export async function marcarOrcamento(
  leadId: string,
  valor: number,
  arquivoUrl?: string,
  linkUrl?: string
): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  return transitionLeadStatus(
    leadId, "orcamento_enviado",
    {
      orcamento_valor: valor,
      ...(arquivoUrl ? { orcamento_arquivo_url: arquivoUrl } : {}),
      ...(linkUrl    ? { orcamento_link_url:    linkUrl    } : {}),
    },
    `Orçamento: R$ ${valor.toFixed(2)}`,
    "SubmitApplication",
    valor
  );
}

// ================================================================
// fecharVenda — Orçamento → Fechado  |  CAPI: Purchase
// ================================================================

export async function fecharVenda(
  leadId: string,
  valor: number,
  pedidoUrl?: string
): Promise<{ success: boolean; lead?: Lead; error?: string }> {
  return transitionLeadStatus(
    leadId, "venda_fechada",
    {
      valor_venda: valor,
      sold_at:     new Date().toISOString(),
      ...(pedidoUrl ? { venda_pedido_url: pedidoUrl } : {}),
    },
    `Venda fechada: R$ ${valor.toFixed(2)}`,
    "Purchase",
    valor
  );
}

// ================================================================
// uploadLeadArquivo — upload para bucket "leads-arquivos"
// ================================================================

export async function uploadLeadArquivo(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createAdminClient();
  const file = formData.get("arquivo") as File | null;
  if (!file || file.size === 0) return { error: "Nenhum arquivo selecionado" };

  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  await supabase.storage.createBucket("leads-arquivos", { public: true }).catch(() => {});

  const { data, error } = await supabase.storage
    .from("leads-arquivos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from("leads-arquivos").getPublicUrl(data.path);
  return { url: urlData.publicUrl };
}

// ================================================================
// getPeriodoSince
// ================================================================

function getPeriodoSince(periodo: string): Date | null {
  const now = new Date();
  switch (periodo) {
    case "hoje": return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":   return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "mes":  return new Date(now.getFullYear(), now.getMonth(), 1);
    default:     return null;
  }
}
