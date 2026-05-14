"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { sendCAPIEvent } from "@/lib/capi/client";
import { revalidatePath } from "next/cache";

// ================================================================
// Types
// ================================================================

export type CAPIEvento = {
  id:            string;
  cliente_id:    string;
  lead_id:       string | null;
  event_name:    string;
  event_id:      string;
  pixel_id:      string | null;
  status:        "sucesso" | "erro" | "pendente";
  payload:       Record<string, unknown> | null;
  response:      Record<string, unknown> | null;
  error_message: string | null;
  created_at:    string;
  leads:         { nome: string; telefone: string | null; email: string | null } | null;
};

export type CAPIStats = {
  total:        number;
  sucesso:      number;
  erro:         number;
  taxa_sucesso: number;
};

// ================================================================
// getCAPIEventos — lista paginada de eventos com stats globais
// ================================================================

export async function getCAPIEventos(
  clienteId: string,
  page      = 1,
  pageSize  = 50
): Promise<{ eventos: CAPIEvento[]; total: number; stats: CAPIStats }> {
  const supabase = await createAdminClient();

  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const [eventosRes, statsRes] = await Promise.all([
    supabase
      .from("capi_eventos")
      .select("*, leads(nome, telefone, email)", { count: "exact" })
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("capi_eventos")
      .select("status")
      .eq("cliente_id", clienteId),
  ]);

  const eventos     = (eventosRes.data ?? []) as CAPIEvento[];
  const total       = eventosRes.count ?? 0;
  const allStatuses = statsRes.data ?? [];

  const sucesso    = allStatuses.filter((e) => e.status === "sucesso").length;
  const erro       = allStatuses.filter((e) => e.status === "erro").length;
  const statsTotal = allStatuses.length;

  const stats: CAPIStats = {
    total:        statsTotal,
    sucesso,
    erro,
    taxa_sucesso: statsTotal > 0 ? Math.round((sucesso / statsTotal) * 100) : 0,
  };

  return { eventos, total, stats };
}

// ================================================================
// reenviarCAPIEvento — reprocessa um evento com erro
// ================================================================

export async function reenviarCAPIEvento(
  eventoId:  string,
  clienteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();

  const { data: evento } = await supabase
    .from("capi_eventos")
    .select("*, leads(nome, telefone, email)")
    .eq("id", eventoId)
    .single();

  if (!evento) return { success: false, error: "Evento não encontrado" };

  const lead = evento.leads as {
    nome:     string;
    telefone: string | null;
    email:    string | null;
  } | null;

  const result = await sendCAPIEvent(
    evento.cliente_id,
    evento.lead_id,
    evento.event_name,
    {
      email:    lead?.email    ?? undefined,
      telefone: lead?.telefone ?? undefined,
      nome:     lead?.nome     ?? undefined,
    }
  );

  revalidatePath(`/clientes/${clienteId}`, "page");
  return result;
}
