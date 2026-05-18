import { metaFetch } from "./client";

export interface DateRange {
  since: string; // yyyy-MM-dd
  until: string; // yyyy-MM-dd
}

// ================================================================
// Meta API Types
// ================================================================

export interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaInsightsRaw {
  spend?: string;
  impressions?: string;
  reach?: string;
  frequency?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: MetaAction[];
}

export interface MetaCampanhaRaw {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  insights?: { data: MetaInsightsRaw[] };
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
  bid_amount?: string;
}

export interface MetaAd {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  effective_status: string;
}

export interface AdSetMetaData {
  id: string;
  nome: string;
  status: "ativa" | "pausada" | "encerrada";
  orcamento_diario: number | null;
  gasto: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
}

export interface AnuncioMetaData {
  id: string;
  nome: string;
  status: "ativa" | "pausada" | "encerrada";
}

// Resultado normalizado da campanha com métricas já parseadas
export interface CampanhaMetaData {
  meta_campaign_id: string;
  nome: string;
  status: "ativa" | "pausada" | "encerrada";
  objetivo: string | null;
  orcamento_diario: number | null;
  gasto_total: number;
  impressoes: number;
  alcance: number;
  frequencia: number;
  cliques: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  mensagens: number;
  visitas_site: number;
  cpl_medio: number;
}

// ================================================================
// Helpers
// ================================================================

function mapStatus(metaStatus: string): "ativa" | "pausada" | "encerrada" {
  if (metaStatus === "ACTIVE") return "ativa";
  if (metaStatus === "PAUSED") return "pausada";
  return "encerrada";
}

function extractAction(actions: MetaAction[] | undefined, type: string): number {
  return Number(actions?.find((a) => a.action_type === type)?.value ?? 0);
}

function extractMensagens(actions: MetaAction[] | undefined): number {
  const tipos = [
    "onsite_conversion.messaging_conversation_started_7d",
    "onsite_conversion.messaging_first_reply",
    "onsite_conversion.total_messaging_connection",
  ];
  return (actions ?? [])
    .filter((a) => tipos.includes(a.action_type))
    .reduce((s, a) => s + Number(a.value), 0);
}

function normalizeCampanha(raw: MetaCampanhaRaw): CampanhaMetaData {
  const insights = raw.insights?.data?.[0];
  const gasto = Number(insights?.spend ?? 0);
  const leads = extractAction(insights?.actions, "lead");
  const cpl = leads > 0 && gasto > 0 ? gasto / leads : 0;

  return {
    meta_campaign_id: raw.id,
    nome: raw.name,
    status: mapStatus(raw.status),
    objetivo: raw.objective ?? null,
    orcamento_diario: raw.daily_budget ? Number(raw.daily_budget) / 100 : null,
    gasto_total: gasto,
    impressoes: Number(insights?.impressions ?? 0),
    alcance: Number(insights?.reach ?? 0),
    frequencia: Number(insights?.frequency ?? 0),
    cliques: Number(insights?.clicks ?? 0),
    ctr: Number(insights?.ctr ?? 0),
    cpc: Number(insights?.cpc ?? 0),
    cpm: Number(insights?.cpm ?? 0),
    leads,
    mensagens: extractMensagens(insights?.actions),
    visitas_site: extractAction(insights?.actions, "landing_page_view"),
    cpl_medio: cpl,
  };
}

// ================================================================
// getCampanhas — campanhas + insights em uma única chamada
// ================================================================

export async function getCampanhas(
  adAccountId: string,
  accessToken: string,
  dateRange: DateRange
): Promise<CampanhaMetaData[]> {
  const insightFields = [
    "spend",
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "actions",
  ].join(",");

  // Embed insights no request de campanhas com time_range específico
  const fields = [
    "id",
    "name",
    "status",
    "objective",
    "daily_budget",
    "lifetime_budget",
    `insights.fields(${insightFields})`,
  ].join(",");

  type Res = { data: MetaCampanhaRaw[]; paging?: unknown };

  const res = await metaFetch<Res>(
    `act_${adAccountId}/campaigns`,
    accessToken,
    {
      fields,
      limit: "100",
      time_range: JSON.stringify(dateRange),
    },
    { cache: "no-store" }
  );

  return (res.data ?? []).map(normalizeCampanha);
}

// ================================================================
// getCampanhaGastosDiarios — spend por dia de uma campanha (time_increment=1)
// ================================================================

export interface GastoDiario {
  date:       string; // yyyy-MM-dd
  spend:      number;
  leads:      number;
  impressoes: number;
  cliques:    number;
}

export async function getCampanhaGastosDiarios(
  campaignId: string,
  accessToken: string,
  dateRange: DateRange
): Promise<GastoDiario[]> {
  type InsightDia = {
    date_start: string;
    spend?: string;
    impressions?: string;
    clicks?: string;
    actions?: MetaAction[];
  };
  type Res = { data: InsightDia[] };

  const res = await metaFetch<Res>(
    `${campaignId}/insights`,
    accessToken,
    {
      fields:         "spend,impressions,clicks,actions",
      time_increment: "1",
      time_range:     JSON.stringify(dateRange),
      limit:          "90",
    },
    { cache: "no-store" }
  );

  return (res.data ?? []).map((d) => ({
    date:       d.date_start,
    spend:      Number(d.spend ?? 0),
    leads:      extractAction(d.actions, "lead"),
    impressoes: Number(d.impressions ?? 0),
    cliques:    Number(d.clicks ?? 0),
  }));
}

// ================================================================
// getAdSets — ad sets de uma campanha com insights embutidos
// ================================================================

export async function getAdSets(
  campaignId: string,
  accessToken: string,
  dateRange?: DateRange
): Promise<AdSetMetaData[]> {
  const insightFields = "spend,impressions,reach,clicks,ctr,cpc,cpm,actions";
  const fields = [
    "id",
    "name",
    "status",
    "daily_budget",
    `insights.fields(${insightFields})`,
  ].join(",");

  const params: Record<string, string> = { fields, limit: "50" };
  if (dateRange) {
    params.time_range = JSON.stringify(dateRange);
  }

  type AdSetRaw = {
    id: string;
    name: string;
    status: string;
    daily_budget?: string;
    insights?: { data: MetaInsightsRaw[] };
  };
  type Res = { data: AdSetRaw[] };

  const res = await metaFetch<Res>(`${campaignId}/adsets`, accessToken, params);

  return (res.data ?? []).map((raw) => {
    const ins = raw.insights?.data?.[0];
    const gasto = Number(ins?.spend ?? 0);
    const leads = extractAction(ins?.actions, "lead");
    return {
      id: raw.id,
      nome: raw.name,
      status: mapStatus(raw.status),
      orcamento_diario: raw.daily_budget ? Number(raw.daily_budget) / 100 : null,
      gasto,
      impressoes: Number(ins?.impressions ?? 0),
      alcance: Number(ins?.reach ?? 0),
      cliques: Number(ins?.clicks ?? 0),
      ctr: Number(ins?.ctr ?? 0),
      cpc: Number(ins?.cpc ?? 0),
      cpm: Number(ins?.cpm ?? 0),
      leads,
    };
  });
}

// ================================================================
// getAds — anúncios de um ad set
// ================================================================

export async function getAds(
  adSetId: string,
  accessToken: string
): Promise<AnuncioMetaData[]> {
  type Res = { data: MetaAd[] };

  const res = await metaFetch<Res>(`${adSetId}/ads`, accessToken, {
    fields: "id,name,status,effective_status",
    limit: "50",
  });

  return (res.data ?? []).map((ad) => ({
    id: ad.id,
    nome: ad.name,
    status: mapStatus(ad.status),
  }));
}

// ================================================================
// getMetricas — métricas agregadas da conta (nível account)
// ================================================================

export async function getMetricas(
  adAccountId: string,
  accessToken: string,
  dateRange: DateRange
): Promise<MetaInsightsRaw | null> {
  const fields = [
    "spend",
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "actions",
  ].join(",");

  type Res = { data: MetaInsightsRaw[] };

  const res = await metaFetch<Res>(
    `act_${adAccountId}/insights`,
    accessToken,
    {
      fields,
      time_range: JSON.stringify(dateRange),
      level: "account",
    },
    { cache: "no-store" }
  );

  return res.data?.[0] ?? null;
}

// ================================================================
// pausarCampanha / ativarCampanha
// ================================================================

export async function pausarCampanha(
  campaignId: string,
  accessToken: string
): Promise<void> {
  await metaFetch<{ success: boolean }>(
    campaignId,
    accessToken,
    {},
    { method: "POST", body: { status: "PAUSED" } }
  );
}

export async function ativarCampanha(
  campaignId: string,
  accessToken: string
): Promise<void> {
  await metaFetch<{ success: boolean }>(
    campaignId,
    accessToken,
    {},
    { method: "POST", body: { status: "ACTIVE" } }
  );
}

// ================================================================
// atualizarOrcamento — atualiza o daily_budget de um AdSet
// O valor deve ser passado em BRL (ex: 50.00 = R$50)
// A Meta API recebe em centavos (50.00 → 5000)
// ================================================================

// ================================================================
// pausarAdSet / ativarAdSet
// ================================================================

export async function pausarAdSet(
  adSetId: string,
  accessToken: string
): Promise<void> {
  await metaFetch<{ success: boolean }>(adSetId, accessToken, {}, {
    method: "POST",
    body: { status: "PAUSED" },
  });
}

export async function ativarAdSet(
  adSetId: string,
  accessToken: string
): Promise<void> {
  await metaFetch<{ success: boolean }>(adSetId, accessToken, {}, {
    method: "POST",
    body: { status: "ACTIVE" },
  });
}

// ================================================================
// pausarAnuncio / ativarAnuncio
// ================================================================

export async function pausarAnuncio(
  adId: string,
  accessToken: string
): Promise<void> {
  await metaFetch<{ success: boolean }>(adId, accessToken, {}, {
    method: "POST",
    body: { status: "PAUSED" },
  });
}

export async function ativarAnuncio(
  adId: string,
  accessToken: string
): Promise<void> {
  await metaFetch<{ success: boolean }>(adId, accessToken, {}, {
    method: "POST",
    body: { status: "ACTIVE" },
  });
}

// ================================================================
// atualizarOrcamento — atualiza o daily_budget de um AdSet
export async function atualizarOrcamento(
  adSetId: string,
  dailyBudgetBRL: number,
  accessToken: string
): Promise<void> {
  const centavos = Math.round(dailyBudgetBRL * 100);

  await metaFetch<{ success: boolean }>(
    adSetId,
    accessToken,
    {},
    { method: "POST", body: { daily_budget: String(centavos) } }
  );
}
