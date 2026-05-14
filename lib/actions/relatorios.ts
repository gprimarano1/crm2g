"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { format, startOfWeek, endOfWeek, subWeeks, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ================================================================
// Types
// ================================================================

export type RelatorioStatus = "gerado" | "enviado" | "visualizado";

export type RelatorioDados = {
  cliente:    { nome_empresa: string; segmento: string | null };
  kpis:       { investimento: number; leads_total: number; cpl: number; vendas: number; receita: number; orcamentos: number };
  funil:      { novo: number; em_contato: number; qualificado: number; orcamento_enviado: number; venda_fechada: number; perdido: number };
  campanhas:  Array<{ nome: string; objetivo: string | null; gasto: number; leads: number; ctr: number; frequencia: number; cpl: number; status: string }>;
  chart:      Array<{ label: string; leads: number; vendas: number }>;
  insights:   {
    resumo_executivo: string;
    destaques:        string[];
    atencao:          string[];
    alertas:          string[];
    oportunidades:    string[];
    proximos_passos:  string[];
  } | null;
};

export type Relatorio = {
  id:             string;
  cliente_id:     string;
  slug:           string;
  periodo_inicio: string;
  periodo_fim:    string;
  titulo:         string;
  dados:          RelatorioDados;
  insights_id:    string | null;
  status:         RelatorioStatus;
  visualizacoes:  number;
  created_at:     string;
  clientes:       { nome_empresa: string } | null;
};

export type InsightOption = {
  id:         string;
  periodo:    string | null;
  conteudo:   string;
  created_at: string;
};

// ================================================================
// getRelatorios
// ================================================================

export async function getRelatorios(): Promise<Relatorio[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("relatorios")
    .select("*, clientes(nome_empresa)")
    .order("created_at", { ascending: false });
  return (data ?? []) as Relatorio[];
}

// ================================================================
// getRelatorioBySlug — usa adminClient (acesso público sem auth)
// ================================================================

export async function getRelatorioBySlug(slug: string): Promise<Relatorio | null> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("relatorios")
    .select("*, clientes(nome_empresa)")
    .eq("slug", slug)
    .single();
  return (data as Relatorio | null) ?? null;
}

// ================================================================
// getInsightsParaCliente — para o formulário de novo relatório
// ================================================================

export async function getInsightsParaCliente(clienteId: string): Promise<InsightOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("insights")
    .select("id, periodo, conteudo, created_at")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(8);
  return (data ?? []) as InsightOption[];
}

// ================================================================
// getClientesParaRelatorio — clientes ativos para o seletor
// ================================================================

export async function getClientesParaRelatorio(): Promise<
  Array<{ id: string; nome_empresa: string }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select("id, nome_empresa")
    .eq("status", "ativo")
    .order("nome_empresa");
  return data ?? [];
}

// ================================================================
// getSemanas — últimas 8 semanas como opções de período
// ================================================================

export async function getSemanas() {
  const now = new Date();
  const semanas: Array<{ inicio: string; fim: string; label: string }> = [];

  for (let i = 0; i < 8; i++) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd   = endOfWeek(weekStart, { weekStartsOn: 1 });
    semanas.push({
      inicio: format(weekStart, "yyyy-MM-dd"),
      fim:    format(weekEnd,   "yyyy-MM-dd"),
      label:  `${format(weekStart, "dd/MM", { locale: ptBR })} – ${format(weekEnd, "dd/MM/yy", { locale: ptBR })}`,
    });
  }
  return semanas;
}

// ================================================================
// criarRelatorio — gera snapshot e salva no banco
// ================================================================

export async function criarRelatorio(args: {
  clienteId:     string;
  periodoInicio: string;
  periodoFim:    string;
  insightId?:    string | null;
}): Promise<{ success: boolean; slug?: string; error?: string }> {
  const supabase     = await createAdminClient();
  const { clienteId, periodoInicio, periodoFim, insightId } = args;

  const inicioDate = parseISO(periodoInicio);
  const fimDate    = parseISO(periodoFim);

  const [clienteRes, campanhasRes, leadsRes, metricasRes, insightRes] =
    await Promise.all([
      supabase.from("clientes").select("nome_empresa, segmento").eq("id", clienteId).single(),

      supabase.from("campanhas")
        .select("nome, objetivo, gasto_total, leads, ctr, frequencia, cpl_medio, status")
        .eq("cliente_id", clienteId)
        .eq("status", "ativa"),

      supabase.from("leads")
        .select("status, valor_venda, created_at")
        .eq("cliente_id", clienteId)
        .gte("created_at", inicioDate.toISOString())
        .lte("created_at", new Date(fimDate.getTime() + 24 * 60 * 60 * 1000).toISOString()),

      supabase.from("metricas_manuais")
        .select("tipo, quantidade, valor, data_registro")
        .eq("cliente_id", clienteId)
        .gte("data_registro", periodoInicio)
        .lte("data_registro", periodoFim)
        .order("data_registro"),

      insightId
        ? supabase.from("insights").select("dados, conteudo").eq("id", insightId).single()
        : Promise.resolve({ data: null }),
    ]);

  if (!clienteRes.data) return { success: false, error: "Cliente não encontrado" };

  const cliente   = clienteRes.data;
  const campanhas = campanhasRes.data ?? [];
  const leads     = leadsRes.data     ?? [];
  const metricas  = metricasRes.data  ?? [];

  // KPIs (combinados: automático do kanban + lançamentos manuais)
  const investimento = campanhas.reduce((s, c) => s + (c.gasto_total ?? 0), 0);
  const leads_total  = leads.length;
  const cpl          = leads_total > 0 ? investimento / leads_total : 0;

  const receita_leads   = leads.reduce((s, l) => s + (l.valor_venda ?? 0), 0);
  const receita_manual  = metricas.filter((m) => m.tipo === "venda").reduce((s, m) => s + Number(m.valor ?? 0), 0);
  const receita         = receita_leads + receita_manual;

  const vendas_leads    = leads.filter((l) => l.status === "venda_fechada").length;
  const vendas_manual   = metricas.filter((m) => m.tipo === "venda").reduce((s, m) => s + (m.quantidade ?? 0), 0);
  const vendas          = vendas_leads + vendas_manual;

  const orcamentos_leads   = leads.filter((l) => l.status === "orcamento_enviado").length;
  const orcamentos_manual  = metricas.filter((m) => m.tipo === "orcamento").reduce((s, m) => s + (m.quantidade ?? 0), 0);
  const orcamentos         = orcamentos_leads + orcamentos_manual;

  // Funil
  const funil = { novo: 0, em_contato: 0, qualificado: 0, orcamento_enviado: 0, venda_fechada: 0, perdido: 0 };
  for (const l of leads) {
    if (l.status in funil) (funil as Record<string, number>)[l.status]++;
  }

  // Chart — 4 semanas até periodo_fim
  const chart: Array<{ label: string; leads: number; vendas: number }> = [];
  for (let i = 3; i >= 0; i--) {
    const wStart    = startOfWeek(subWeeks(fimDate, i), { weekStartsOn: 1 });
    const wEnd      = endOfWeek(wStart, { weekStartsOn: 1 });
    const wStartStr = format(wStart, "yyyy-MM-dd");
    const wEndStr   = format(wEnd,   "yyyy-MM-dd");
    const wLeads    = leads.filter((l) => {
      const d = l.created_at.slice(0, 10);
      return d >= wStartStr && d <= wEndStr;
    }).length;
    const wVendas = leads.filter((l) => {
      const d = l.created_at.slice(0, 10);
      return l.status === "venda_fechada" && d >= wStartStr && d <= wEndStr;
    }).length + metricas
      .filter((m) => m.tipo === "venda" && m.data_registro >= wStartStr && m.data_registro <= wEndStr)
      .reduce((s, m) => s + (m.quantidade ?? 0), 0);
    chart.push({ label: format(wStart, "dd/MM", { locale: ptBR }), leads: wLeads, vendas: wVendas });
  }

  // Insights
  type InsightRaw = { dados?: Record<string, unknown>; conteudo?: string } | null;
  const insightRaw = insightRes.data as InsightRaw;
  let insights: RelatorioDados["insights"] = null;
  if (insightRaw) {
    const d = insightRaw.dados as Record<string, string[]> | null;
    insights = {
      resumo_executivo: (insightRaw.conteudo ?? "") as string,
      destaques:        (d?.destaques        ?? []) as string[],
      atencao:          (d?.atencao          ?? []) as string[],
      alertas:          (d?.alertas          ?? []) as string[],
      oportunidades:    (d?.oportunidades    ?? []) as string[],
      proximos_passos:  (d?.proximos_passos  ?? []) as string[],
    };
  }

  // Snapshot
  const dados: RelatorioDados = {
    cliente:   { nome_empresa: cliente.nome_empresa, segmento: cliente.segmento ?? null },
    kpis:      { investimento, leads_total, cpl, vendas, receita, orcamentos },
    funil,
    campanhas: campanhas.map((c) => ({
      nome:       c.nome,
      objetivo:   c.objetivo ?? null,
      gasto:      c.gasto_total ?? 0,
      leads:      c.leads ?? 0,
      ctr:        c.ctr ?? 0,
      frequencia: c.frequencia ?? 0,
      cpl:        c.cpl_medio ?? 0,
      status:     c.status,
    })),
    chart,
    insights,
  };

  const slug = crypto.randomBytes(6).toString("base64url");
  const titulo = `Relatório ${format(inicioDate, "dd/MM", { locale: ptBR })}–${format(fimDate, "dd/MM/yy", { locale: ptBR })} — ${cliente.nome_empresa}`;

  const { error } = await supabase.from("relatorios").insert({
    cliente_id:     clienteId,
    slug,
    periodo_inicio: periodoInicio,
    periodo_fim:    periodoFim,
    titulo,
    dados,
    insights_id:    insightId ?? null,
    status:         "gerado",
    visualizacoes:  0,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/relatorios");
  return { success: true, slug };
}

// ================================================================
// marcarEnviado
// ================================================================

export async function marcarEnviado(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("relatorios").update({ status: "enviado" }).eq("id", id).eq("status", "gerado");
  revalidatePath("/relatorios");
}

// ================================================================
// incrementVisualizacoes — chamado pelo ViewTracker (public page)
// ================================================================

export async function incrementVisualizacoes(slug: string): Promise<void> {
  const supabase = await createAdminClient();
  const { data } = await supabase.from("relatorios").select("id, visualizacoes, status").eq("slug", slug).single();
  if (!data) return;
  await supabase.from("relatorios").update({
    visualizacoes: (data.visualizacoes ?? 0) + 1,
    status:        "visualizado",
  }).eq("id", data.id);
}
