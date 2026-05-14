import { createAdminClient } from "@/lib/supabase/server";
import { generateWithClaude } from "./client";
import { format } from "date-fns";

// ================================================================
// Types
// ================================================================

export interface InsightsDados {
  destaques:        string[];
  atencao:          string[];
  alertas:          string[];
  oportunidades:    string[];
  resumo_executivo: string;
  proximos_passos:  string[];
}

export interface InsightsResult {
  id:         string;
  dados:      InsightsDados;
  conteudo:   string;
  periodo:    string;
  created_at: string;
}

// ================================================================
// Helpers
// ================================================================

function getPeriodoDates(periodo: string): { inicio: Date; fim: Date } {
  const fim  = new Date();
  let inicio: Date;
  switch (periodo) {
    case "7d":   inicio = new Date(fim.getTime() - 7  * 24 * 60 * 60 * 1000); break;
    case "30d":  inicio = new Date(fim.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case "mes":  inicio = new Date(fim.getFullYear(), fim.getMonth(), 1);      break;
    default:     inicio = new Date(fim.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return { inicio, fim };
}

// ================================================================
// generateInsights
// ================================================================

export async function generateInsights(
  clienteId: string,
  periodo    = "30d"
): Promise<InsightsResult> {
  const supabase  = await createAdminClient();
  const { inicio, fim } = getPeriodoDates(periodo);
  const inicioStr = format(inicio, "yyyy-MM-dd");
  const fimStr    = format(fim,    "yyyy-MM-dd");

  // --- Busca dados em paralelo ---
  const [clienteRes, campanhasRes, leadsRes, metricasRes] = await Promise.all([
    supabase.from("clientes")
      .select("nome_empresa, segmento, responsavel")
      .eq("id", clienteId)
      .single(),

    supabase.from("campanhas")
      .select("nome, objetivo, status, orcamento_diario, gasto_total, leads, cpl_medio, ctr, frequencia, impressoes, cliques, alcance")
      .eq("cliente_id", clienteId),

    supabase.from("leads")
      .select("status, valor_venda, created_at")
      .eq("cliente_id", clienteId)
      .gte("created_at", inicio.toISOString()),

    supabase.from("metricas_manuais")
      .select("tipo, quantidade, valor, data_registro")
      .eq("cliente_id", clienteId)
      .gte("data_registro", inicioStr)
      .order("data_registro"),
  ]);

  const cliente   = clienteRes.data;
  const campanhas = campanhasRes.data ?? [];
  const leads     = leadsRes.data     ?? [];
  const metricas  = metricasRes.data  ?? [];

  // --- Funil de leads ---
  const funilCounts: Record<string, number> = {
    novo: 0, em_contato: 0, qualificado: 0,
    orcamento_enviado: 0, venda_fechada: 0, perdido: 0,
  };
  let receitaTotal = 0;
  for (const l of leads) {
    if (l.status in funilCounts) funilCounts[l.status]++;
    if (l.status === "venda_fechada") receitaTotal += l.valor_venda ?? 0;
  }

  // --- KPIs do período ---
  const totalInvestimento = campanhas.reduce((s, c) => s + (c.gasto_total ?? 0), 0);
  const totalLeads        = leads.length;
  const cplMedio          = totalLeads > 0 ? totalInvestimento / totalLeads : 0;
  const taxaConversao     = totalLeads > 0 ? (funilCounts.venda_fechada / totalLeads * 100) : 0;

  // --- Dados para o prompt ---
  const dadosPrompt = {
    cliente: {
      nome:       cliente?.nome_empresa ?? "—",
      segmento:   cliente?.segmento     ?? "—",
      responsavel: cliente?.responsavel ?? "—",
    },
    periodo:    { inicio: inicioStr, fim: fimStr, tipo: periodo },
    kpis: {
      investimento_total: totalInvestimento,
      leads_total:        totalLeads,
      cpl_medio:          cplMedio.toFixed(2),
      receita_total:      receitaTotal,
      taxa_conversao:     `${taxaConversao.toFixed(1)}%`,
    },
    funil_leads: funilCounts,
    campanhas: campanhas.map((c) => ({
      nome:            c.nome,
      status:          c.status,
      objetivo:        c.objetivo,
      orcamento_diario: c.orcamento_diario,
      gasto_total:     c.gasto_total,
      leads:           c.leads,
      cpl:             c.cpl_medio,
      ctr:             `${Number(c.ctr).toFixed(2)}%`,
      frequencia:      Number(c.frequencia).toFixed(1),
      impressoes:      c.impressoes,
      cliques:         c.cliques,
      alcance:         c.alcance,
    })),
    metricas_manuais: metricas.map((m) => ({
      data:       m.data_registro,
      tipo:       m.tipo,
      quantidade: m.quantidade,
      valor:      m.valor,
    })),
  };

  // --- Prompt ---
  const systemPrompt = `Você é um especialista sênior em marketing digital com foco em Meta Ads e otimização de funil de vendas.
Analise os dados fornecidos e retorne APENAS um JSON válido (sem texto antes ou depois) com a seguinte estrutura exata:

{
  "destaques": ["string com ponto positivo 1", "string com ponto positivo 2"],
  "atencao": ["string com ponto de atenção 1"],
  "alertas": ["string com alerta crítico 1"],
  "oportunidades": ["string com oportunidade de melhoria 1"],
  "resumo_executivo": "Parágrafo em primeira pessoa do plural (ex: 'Neste período, alcançamos...') para ser lido pelo cliente. Tom positivo e profissional. 3-4 frases.",
  "proximos_passos": ["Ação específica e mensurável 1", "Ação específica e mensurável 2"]
}

Regras:
- Cada array deve ter 2-4 itens relevantes (não invente dados ausentes)
- destaques: resultados bons, metas atingidas, crescimentos
- atencao: métricas que precisam de cuidado mas não são críticas
- alertas: problemas urgentes como frequência alta (>2.5), CTR baixo (<1%), CPL muito acima do esperado
- oportunidades: o que pode ser melhorado com ações específicas
- resumo_executivo: texto para o cliente final, sem jargões técnicos
- proximos_passos: ações concretas com prazo sugerido
- Se não houver dados suficientes para uma categoria, coloque 1 item genérico relevante
- Responda em português brasileiro
- NÃO adicione explicações fora do JSON`;

  const userPrompt = `Analise os dados de performance do cliente abaixo e gere os insights:\n\n${JSON.stringify(dadosPrompt, null, 2)}`;

  const rawResponse = await generateWithClaude(userPrompt, systemPrompt, 2048);

  // --- Extrai JSON da resposta ---
  let dados: InsightsDados;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonStr   = jsonMatch ? jsonMatch[0] : rawResponse;
    dados = JSON.parse(jsonStr) as InsightsDados;

    // Garante que todos os campos existem
    dados.destaques        ??= [];
    dados.atencao          ??= [];
    dados.alertas          ??= [];
    dados.oportunidades    ??= [];
    dados.resumo_executivo ??= "";
    dados.proximos_passos  ??= [];
  } catch {
    dados = {
      destaques:        ["Dados processados com sucesso"],
      atencao:          [],
      alertas:          [],
      oportunidades:    ["Agende uma reunião para análise detalhada"],
      resumo_executivo: rawResponse.slice(0, 500),
      proximos_passos:  ["Revisar métricas de campanha"],
    };
  }

  // --- Salva no banco ---
  const { data: saved, error } = await supabase
    .from("insights")
    .insert({
      cliente_id:     clienteId,
      periodo_inicio: inicioStr,
      periodo_fim:    fimStr,
      conteudo:       dados.resumo_executivo,
      dados,
      periodo,
      editado:        false,
    })
    .select("id, created_at")
    .single();

  if (error) throw new Error(`Erro ao salvar insight: ${error.message}`);

  return {
    id:         saved.id,
    dados,
    conteudo:   dados.resumo_executivo,
    periodo,
    created_at: saved.created_at,
  };
}
