"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InsightsDados } from "@/lib/claude/insights";

// ================================================================
// Types
// ================================================================

export type InsightRecord = {
  id:             string;
  cliente_id:     string;
  periodo_inicio: string;
  periodo_fim:    string;
  conteudo:       string;
  dados:          InsightsDados | null;
  periodo:        string | null;
  editado:        boolean;
  created_at:     string;
};

// ================================================================
// getInsights — lista histórico de insights do cliente
// ================================================================

export async function getInsights(
  clienteId: string,
  limit = 10
): Promise<InsightRecord[]> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from("insights")
    .select("id, cliente_id, periodo_inicio, periodo_fim, conteudo, dados, periodo, editado, created_at")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as InsightRecord[];
}

// ================================================================
// saveInsightConteudo — salva edição do resumo executivo
// ================================================================

export async function saveInsightConteudo(
  insightId:  string,
  conteudo:   string,
  clienteId:  string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("insights")
    .update({ conteudo, editado: true })
    .eq("id", insightId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/clientes/${clienteId}`, "page");
  return { success: true };
}
