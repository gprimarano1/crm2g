"use server";

import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  DashboardFilters,
  DashboardData,
  DashboardAlert,
  ClienteMiniKPI,
  WeeklyPoint,
} from "@/lib/types/dashboard";

// ================================================================
// getDashboardData — agrega KPIs + gráfico + alertas com filtros
// ================================================================

export async function getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
  const supabase = await createClient();
  const { clienteId, dateFrom, dateTo } = filters;

  const dateFromIso = dateFrom.toISOString();
  const dateToIso   = dateTo.toISOString();
  const dateFromStr = format(dateFrom, "yyyy-MM-dd");
  const dateToStr   = format(dateTo,   "yyyy-MM-dd");

  // ── Queries em paralelo ──────────────────────────────────────

  let clientesQ = supabase
    .from("clientes")
    .select("id, nome_empresa, status")
    .order("nome_empresa");
  if (clienteId) clientesQ = clientesQ.eq("id", clienteId);

  // Campanhas para KPIs: sem filtro de data (dados agregados do último sync, fallback)
  let campanhasKpiQ = supabase
    .from("campanhas")
    .select("id, cliente_id, nome, gasto_total, ctr, frequencia, orcamento_diario, status, periodo_inicio, periodo_fim");
  if (clienteId) campanhasKpiQ = campanhasKpiQ.eq("cliente_id", clienteId);

  // Gastos diários filtrados pelo período selecionado (tabela campanhas_diarias)
  let diariasQ = supabase
    .from("campanhas_diarias")
    .select("campanha_id, cliente_id, gasto, leads, impressoes, cliques")
    .gte("data", dateFromStr)
    .lte("data", dateToStr);
  if (clienteId) diariasQ = diariasQ.eq("cliente_id", clienteId);

  // Campanhas para alertas: sempre ativas, sem filtro de data
  let campanhasAlertasQ = supabase
    .from("campanhas")
    .select("cliente_id, nome, gasto_total, ctr, frequencia, orcamento_diario, status")
    .eq("status", "ativa");
  if (clienteId) campanhasAlertasQ = campanhasAlertasQ.eq("cliente_id", clienteId);

  // Leads: filtrados pelo período selecionado
  let leadsQ = supabase
    .from("leads")
    .select("id, cliente_id, status, valor_venda, created_at")
    .gte("created_at", dateFromIso)
    .lt("created_at",  dateToIso);
  if (clienteId) leadsQ = leadsQ.eq("cliente_id", clienteId);

  // Métricas manuais: filtradas pelo período
  let metricasQ = supabase
    .from("metricas_manuais")
    .select("cliente_id, tipo, quantidade, valor, data_registro")
    .gte("data_registro", dateFromStr)
    .lt("data_registro",  dateToStr);
  if (clienteId) metricasQ = metricasQ.eq("cliente_id", clienteId);

  const [clientesRes, campanhasKpiRes, campanhasAlertasRes, leadsRes, metricasRes, diariasRes] = await Promise.all([
    clientesQ, campanhasKpiQ, campanhasAlertasQ, leadsQ, metricasQ, diariasQ,
  ]);

  const clientes         = clientesRes.data        ?? [];
  const campanhas        = campanhasKpiRes.data     ?? [];
  const campanhasAlertas = campanhasAlertasRes.data ?? [];
  const leads            = leadsRes.data            ?? [];
  const metricas         = metricasRes.data         ?? [];
  const diarias          = diariasRes.data          ?? [];

  // ── KPIs ─────────────────────────────────────────────────────

  // Usa dados diários quando disponíveis (após migração 012), senão fallback para gasto_total
  const investimento_total = diarias.length > 0
    ? diarias.reduce((s, d) => s + (d.gasto ?? 0), 0)
    : campanhas.reduce((s, c) => s + (c.gasto_total ?? 0), 0);
  const leads_total        = leads.length;
  const cpl_medio          = leads_total > 0 ? investimento_total / leads_total : 0;

  // Vendas combinadas: automático (leads) + manual (lançamentos)
  const vendas_auto    = leads.filter((l) => l.status === "venda_fechada").length;
  const vendas_manual  = metricas.filter((m) => m.tipo === "venda").reduce((s, m) => s + (m.quantidade ?? 0), 0);
  const vendas_fechadas = vendas_auto + vendas_manual;

  // Receita combinada
  const receita_auto   = leads.reduce((s, l) => s + (l.valor_venda ?? 0), 0);
  const receita_manual = metricas.filter((m) => m.tipo === "venda").reduce((s, m) => s + Number(m.valor ?? 0), 0);
  const receita_total  = receita_auto + receita_manual;

  // ── Alertas ──────────────────────────────────────────────────

  const clienteMap: Record<string, string> = {};
  for (const c of clientes) clienteMap[c.id] = c.nome_empresa;

  const alerts: DashboardAlert[] = [];

  for (const camp of campanhasAlertas) {
    const nomeCliente = clienteMap[camp.cliente_id] ?? "?";

    if ((camp.frequencia ?? 0) > 2.5) {
      alerts.push({
        type:         "frequencia",
        severity:     "warning",
        title:        `Frequência alta — ${nomeCliente}`,
        message:      `Campanha "${camp.nome}" com frequência ${Number(camp.frequencia).toFixed(1)}x (recomendado: ≤ 2.5x)`,
        clienteNome:  nomeCliente,
        campanhaNome: camp.nome,
      });
    }

    if ((camp.ctr ?? 0) < 0.8 && (camp.gasto_total ?? 0) > 100) {
      alerts.push({
        type:         "ctr",
        severity:     "warning",
        title:        `CTR baixo — ${camp.nome}`,
        message:      `CTR de ${Number(camp.ctr).toFixed(2)}% abaixo do esperado em ${nomeCliente}`,
        clienteNome:  nomeCliente,
        campanhaNome: camp.nome,
      });
    }

    if (camp.orcamento_diario && (camp.gasto_total ?? 0) > 0) {
      const budgetMes    = Number(camp.orcamento_diario) * 30;
      const gastoPercent = Number(camp.gasto_total) / budgetMes;
      if (gastoPercent >= 0.9) {
        alerts.push({
          type:         "orcamento",
          severity:     "critical",
          title:        `Orçamento crítico — ${camp.nome}`,
          message:      `${Math.round(gastoPercent * 100)}% do orçamento mensal consumido (${nomeCliente})`,
          clienteNome:  nomeCliente,
          campanhaNome: camp.nome,
        });
      }
    }
  }

  // ── Gráfico ──────────────────────────────────────────────────

  const diffDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  const chart    = buildChart(leads, metricas, dateFrom, dateTo, diffDays <= 14);

  // ── Mini-KPIs por cliente ─────────────────────────────────────

  const clientesMini: ClienteMiniKPI[] = clientes.map((c) => {
    const clientDiarias   = diarias.filter((d) => d.cliente_id === c.id);
    const clientCampanhas = campanhas.filter((camp) => camp.cliente_id === c.id);
    const investimento    = clientDiarias.length > 0
      ? clientDiarias.reduce((s, d) => s + (d.gasto ?? 0), 0)
      : clientCampanhas.reduce((s, camp) => s + (camp.gasto_total ?? 0), 0);
    const leads_mes       = leads.filter((l) => l.cliente_id === c.id).length;
    // Vendas combinadas por cliente
    const vendas_leads_c  = leads.filter((l) => l.cliente_id === c.id && l.status === "venda_fechada").length;
    const vendas_manual_c = metricas.filter((m) => m.cliente_id === c.id && m.tipo === "venda").reduce((s, m) => s + (m.quantidade ?? 0), 0);
    const vendas          = vendas_leads_c + vendas_manual_c;
    const cpl = leads_mes > 0 && investimento > 0 ? investimento / leads_mes : 0;

    return { id: c.id, nome_empresa: c.nome_empresa, status: c.status, leads_mes, investimento, vendas, cpl };
  });

  return {
    kpis: { investimento_total, leads_total, cpl_medio, vendas_fechadas, receita_total },
    chart,
    alerts,
    clientes: clientesMini,
  };
}

// ================================================================
// buildChart — gera pontos diários (≤14 dias) ou semanais (>14 dias)
// ================================================================

type LeadRow    = { created_at: string; status: string };
type MetricaRow = { tipo: string; quantidade: number; valor: number; data_registro: string };

function buildChart(
  leads:    LeadRow[],
  metricas: MetricaRow[],
  dateFrom: Date,
  dateTo:   Date,
  daily:    boolean,
): WeeklyPoint[] {
  const chart: WeeklyPoint[] = [];
  const dayMs = 24 * 60 * 60 * 1000;

  if (daily) {
    for (let ts = dateFrom.getTime(); ts < dateTo.getTime(); ts += dayMs) {
      const dayStart  = new Date(ts);
      const dayEnd    = new Date(ts + dayMs);
      const key       = format(dayStart, "yyyy-MM-dd");
      const keyEnd    = format(dayEnd,   "yyyy-MM-dd");
      const label     = format(dayStart, "dd/MM", { locale: ptBR });

      const leadsCount = leads.filter((l) => {
        const d = new Date(l.created_at);
        return d >= dayStart && d < dayEnd;
      }).length;

      const vendasLeads  = leads.filter((l) => {
        if (l.status !== "venda_fechada") return false;
        const d = new Date(l.created_at);
        return d >= dayStart && d < dayEnd;
      }).length;
      const vendasManual = metricas
        .filter((m) => m.tipo === "venda" && m.data_registro >= key && m.data_registro < keyEnd)
        .reduce((s, m) => s + (m.quantidade ?? 0), 0);

      chart.push({ label, semana: key, leads: leadsCount, vendas: vendasLeads + vendasManual });
    }
  } else {
    const firstMonday = startOfWeek(dateFrom, { weekStartsOn: 1 });
    const weekMs      = 7 * dayMs;

    for (let ts = firstMonday.getTime(); ts < dateTo.getTime(); ts += weekMs) {
      const weekStart  = new Date(ts);
      const weekEnd    = new Date(ts + weekMs);
      const key        = format(weekStart, "yyyy-MM-dd");
      const weekEndKey = format(weekEnd,   "yyyy-MM-dd");
      const label      = format(weekStart, "dd/MM", { locale: ptBR });

      const leadsCount = leads.filter((l) => {
        const d = new Date(l.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;

      const vendasLeads  = leads.filter((l) => {
        if (l.status !== "venda_fechada") return false;
        const d = new Date(l.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      const vendasManual = metricas
        .filter((m) => m.tipo === "venda" && m.data_registro >= key && m.data_registro < weekEndKey)
        .reduce((s, m) => s + (m.quantidade ?? 0), 0);

      chart.push({ label, semana: key, leads: leadsCount, vendas: vendasLeads + vendasManual });
    }
  }

  return chart;
}
