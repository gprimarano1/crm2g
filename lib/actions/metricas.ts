"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MetricaManual, MetricasAutomaticas } from "@/lib/types/metricas";

// ================================================================
// getMetricasAutomaticas — conta leads orcamento_enviado / venda_fechada
// ================================================================

export async function getMetricasAutomaticas(
  clienteId: string,
): Promise<MetricasAutomaticas> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("status, orcamento_valor, valor_venda")
    .eq("cliente_id", clienteId)
    .in("status", ["orcamento_enviado", "venda_fechada"]);

  const leads = data ?? [];
  const orcLeads = leads.filter((l) => l.status === "orcamento_enviado");
  const vendLeads = leads.filter((l) => l.status === "venda_fechada");

  return {
    orcamentos: {
      quantidade: orcLeads.length,
      valor: orcLeads.reduce((s, l) => s + (l.orcamento_valor ?? 0), 0),
    },
    vendas: {
      quantidade: vendLeads.length,
      valor: vendLeads.reduce((s, l) => s + (l.valor_venda ?? 0), 0),
    },
  };
}

// ================================================================
// getMetricasManuais — lista todos os lançamentos de um cliente
// ================================================================

export async function getMetricasManuais(
  clienteId: string,
): Promise<MetricaManual[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("metricas_manuais")
    .select("id, cliente_id, tipo, quantidade, valor, data_registro, observacao, created_at")
    .eq("cliente_id", clienteId)
    .order("data_registro", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as MetricaManual[];
}

// ================================================================
// addMetricaManual — insere novo lançamento
// ================================================================

export async function addMetricaManual(args: {
  clienteId: string;
  tipo: string;
  quantidade: number;
  valor: number;
  dataRegistro: string;
  observacao?: string;
}): Promise<{ success: boolean; data?: MetricaManual; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("metricas_manuais")
    .insert({
      cliente_id:    args.clienteId,
      tipo:          args.tipo,
      quantidade:    args.quantidade,
      valor:         args.valor,
      data_registro: args.dataRegistro,
      observacao:    args.observacao || null,
    })
    .select("id, cliente_id, tipo, quantidade, valor, data_registro, observacao, created_at")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/clientes/${args.clienteId}`);
  return { success: true, data: data as MetricaManual };
}

// ================================================================
// updateMetricaManual — edita lançamento existente
// ================================================================

export async function updateMetricaManual(args: {
  id: string;
  clienteId: string;
  tipo: string;
  quantidade: number;
  valor: number;
  dataRegistro: string;
  observacao?: string;
}): Promise<{ success: boolean; data?: MetricaManual; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("metricas_manuais")
    .update({
      tipo:          args.tipo,
      quantidade:    args.quantidade,
      valor:         args.valor,
      data_registro: args.dataRegistro,
      observacao:    args.observacao || null,
    })
    .eq("id", args.id)
    .select("id, cliente_id, tipo, quantidade, valor, data_registro, observacao, created_at")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/clientes/${args.clienteId}`);
  return { success: true, data: data as MetricaManual };
}

// ================================================================
// deleteMetricaManual — remove lançamento
// ================================================================

export async function deleteMetricaManual(
  id: string,
  clienteId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("metricas_manuais")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/clientes/${clienteId}`);
  return { success: true };
}
