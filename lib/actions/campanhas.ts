"use server";

import { revalidatePath } from "next/cache";
import { format, subDays } from "date-fns";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  getCampanhas,
  getCampanhaGastosDiarios,
  getAdSets,
  getAds,
  pausarCampanha,
  ativarCampanha,
  pausarAdSet,
  ativarAdSet,
  pausarAnuncio,
  ativarAnuncio,
  atualizarOrcamento,
  type CampanhaMetaData,
  type AdSetMetaData,
  type AnuncioMetaData,
  type DateRange,
  type GastoDiario,
} from "@/lib/meta/campanhas";

export type { GastoDiario };

export type { AdSetMetaData, AnuncioMetaData };

// ================================================================
// Types
// ================================================================

export type CampanhaStatus = "ativa" | "pausada" | "encerrada" | "rascunho";

export type Campanha = {
  id: string;
  cliente_id: string;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  nome: string;
  objetivo: string | null;
  status: CampanhaStatus;
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
  visitas_perfil: number;
  seguidores: number;
  cpl_medio: number;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  synced_at: string | null;
  created_at: string;
};

export type SyncResult =
  | { success: true; campaigns: number; clienteId: string }
  | { success: false; error: string; clienteId: string };

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ================================================================
// syncClienteCampanhas — sincroniza campanhas do Meta → Supabase
// Pode ser chamada por server actions, API routes ou cron jobs
// ================================================================

export async function syncClienteCampanhas(
  clienteId: string,
  customDateRange?: DateRange
): Promise<SyncResult> {
  const supabase = await createAdminClient();

  // Busca credenciais do cliente
  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("meta_ad_account_id, meta_access_token, nome_empresa")
    .eq("id", clienteId)
    .single();

  if (clienteError || !cliente) {
    return { success: false, error: "Cliente não encontrado", clienteId };
  }

  if (!cliente.meta_ad_account_id || !cliente.meta_access_token) {
    return {
      success: false,
      error: `${cliente.nome_empresa} não tem credenciais Meta configuradas`,
      clienteId,
    };
  }

  const dateRange: DateRange = customDateRange ?? {
    since: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    until: format(subDays(new Date(), 1), "yyyy-MM-dd"),
  };

  let campanhasData: CampanhaMetaData[];
  try {
    campanhasData = await getCampanhas(
      cliente.meta_ad_account_id,
      cliente.meta_access_token,
      dateRange
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao chamar Meta API";
    return { success: false, error: msg, clienteId };
  }

  if (campanhasData.length === 0) {
    return { success: true, campaigns: 0, clienteId };
  }

  const now = new Date().toISOString();

  // Upsert em lote por meta_campaign_id (constraint única adicionada em 003_meta_sync.sql)
  const rows = campanhasData.map((c) => ({
    cliente_id: clienteId,
    meta_campaign_id: c.meta_campaign_id,
    nome: c.nome,
    objetivo: c.objetivo,
    status: c.status,
    orcamento_diario: c.orcamento_diario,
    gasto_total: c.gasto_total,
    impressoes: c.impressoes,
    alcance: c.alcance,
    frequencia: c.frequencia,
    cliques: c.cliques,
    ctr: c.ctr,
    cpc: c.cpc,
    cpm: c.cpm,
    leads: c.leads,
    mensagens: c.mensagens,
    visitas_site: c.visitas_site,
    cpl_medio: c.cpl_medio,
    periodo_inicio: dateRange.since,
    periodo_fim: dateRange.until,
    synced_at: now,
  }));

  const { error: upsertError, data: upsertedRows } = await supabase
    .from("campanhas")
    .upsert(rows, { onConflict: "cliente_id,meta_campaign_id" })
    .select("id, meta_campaign_id");

  if (upsertError) {
    return { success: false, error: upsertError.message, clienteId };
  }

  // Sincroniza dados diários (time_increment=1) para cada campanha
  // Ignora erros — tabela pode não existir ainda (migração pendente)
  try {
    const campanhaIdMap: Record<string, string> = {};
    for (const row of upsertedRows ?? []) {
      if (row.meta_campaign_id) campanhaIdMap[row.meta_campaign_id] = row.id;
    }

    const diariasPromises = campanhasData.map(async (c) => {
      const campanhaId = campanhaIdMap[c.meta_campaign_id];
      if (!campanhaId) return;
      const dias = await getCampanhaGastosDiarios(
        c.meta_campaign_id,
        cliente.meta_access_token,
        dateRange
      );
      if (!dias.length) return;
      const diariaRows = dias.map((d) => ({
        campanha_id: campanhaId,
        cliente_id:  clienteId,
        data:        d.date,
        gasto:       d.spend,
        impressoes:  d.impressoes,
        alcance:     0,
        cliques:     d.cliques,
        leads:       d.leads,
      }));
      await supabase
        .from("campanhas_diarias")
        .upsert(diariaRows, { onConflict: "campanha_id,data" });
    });

    await Promise.allSettled(diariasPromises);
  } catch {
    // Tabela campanhas_diarias não existe ainda — ignorar silenciosamente
  }

  // Atualiza timestamp de última sincronização no cliente
  await supabase
    .from("clientes")
    .update({ meta_last_synced_at: now } as Record<string, unknown>)
    .eq("id", clienteId);

  return { success: true, campaigns: campanhasData.length, clienteId };
}

// ================================================================
// syncCampanhasAction — server action chamada pela UI
// ================================================================

export async function syncCampanhasAction(
  clienteId: string,
  dateRange?: DateRange
): Promise<ActionResult<{ campaigns: number }>> {
  const result = await syncClienteCampanhas(clienteId, dateRange);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/campanhas");
  revalidatePath(`/clientes/${clienteId}`);
  return { success: true, data: { campaigns: result.campaigns } };
}

// ================================================================
// getCampanhasCliente — busca campanhas salvas no Supabase
// ================================================================

export async function getCampanhasCliente(
  clienteId: string,
  opts?: { status?: string }
): Promise<Campanha[]> {
  const supabase = await createClient();

  let query = supabase
    .from("campanhas")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("gasto_total", { ascending: false });

  if (opts?.status && opts.status !== "todos") {
    query = query.eq("status", opts.status);
  }

  const { data } = await query;
  return (data ?? []) as Campanha[];
}

// ================================================================
// toggleCampanhaStatus — pausa ou ativa via Meta API + atualiza DB
// ================================================================

export async function toggleCampanhaStatusAction(
  campanhaId: string,
  metaCampaignId: string,
  clienteId: string,
  novoStatus: "ativa" | "pausada"
): Promise<ActionResult> {
  const supabase = await createClient();

  // Busca access token do cliente
  const { data: cliente } = await supabase
    .from("clientes")
    .select("meta_access_token")
    .eq("id", clienteId)
    .single();

  if (!cliente?.meta_access_token) {
    return { success: false, error: "Token de acesso Meta não configurado" };
  }

  try {
    if (novoStatus === "pausada") {
      await pausarCampanha(metaCampaignId, cliente.meta_access_token);
    } else {
      await ativarCampanha(metaCampaignId, cliente.meta_access_token);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao chamar Meta API";
    return { success: false, error: msg };
  }

  // Atualiza no Supabase
  const { error } = await supabase
    .from("campanhas")
    .update({ status: novoStatus })
    .eq("id", campanhaId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/campanhas");
  return { success: true, data: undefined };
}

// ================================================================
// atualizarOrcamentoAction — atualiza orçamento via Meta API + DB
// ================================================================

export async function atualizarOrcamentoAction(
  campanhaId: string,
  metaAdSetId: string,
  clienteId: string,
  novoOrcamentoBRL: number
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("meta_access_token")
    .eq("id", clienteId)
    .single();

  if (!cliente?.meta_access_token) {
    return { success: false, error: "Token de acesso Meta não configurado" };
  }

  try {
    await atualizarOrcamento(
      metaAdSetId,
      novoOrcamentoBRL,
      cliente.meta_access_token
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao chamar Meta API";
    return { success: false, error: msg };
  }

  const { error } = await supabase
    .from("campanhas")
    .update({ orcamento_diario: novoOrcamentoBRL })
    .eq("id", campanhaId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/campanhas");
  return { success: true, data: undefined };
}

// ================================================================
// Helpers compartilhados
// ================================================================

async function getClienteToken(clienteId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select("meta_access_token")
    .eq("id", clienteId)
    .single();
  return data?.meta_access_token ?? null;
}

// ================================================================
// getAdSetsAction — busca ad sets de uma campanha via Meta API
// ================================================================

export async function getAdSetsAction(
  metaCampaignId: string,
  clienteId: string
): Promise<ActionResult<AdSetMetaData[]>> {
  const token = await getClienteToken(clienteId);
  if (!token) return { success: false, error: "Token Meta não configurado" };

  const dateRange: DateRange = {
    since: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    until: format(new Date(), "yyyy-MM-dd"),
  };

  try {
    const adSets = await getAdSets(metaCampaignId, token, dateRange);
    return { success: true, data: adSets };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao buscar ad sets";
    return { success: false, error: msg };
  }
}

// ================================================================
// getAnunciosAction — busca anúncios de um ad set via Meta API
// ================================================================

export async function getAnunciosAction(
  metaAdSetId: string,
  clienteId: string
): Promise<ActionResult<AnuncioMetaData[]>> {
  const token = await getClienteToken(clienteId);
  if (!token) return { success: false, error: "Token Meta não configurado" };

  try {
    const ads = await getAds(metaAdSetId, token);
    return { success: true, data: ads };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao buscar anúncios";
    return { success: false, error: msg };
  }
}

// ================================================================
// toggleAdSetStatusAction — pausa ou ativa um ad set via Meta API
// ================================================================

export async function toggleAdSetStatusAction(
  metaAdSetId: string,
  clienteId: string,
  novoStatus: "ativa" | "pausada"
): Promise<ActionResult> {
  const token = await getClienteToken(clienteId);
  if (!token) return { success: false, error: "Token Meta não configurado" };

  try {
    if (novoStatus === "pausada") {
      await pausarAdSet(metaAdSetId, token);
    } else {
      await ativarAdSet(metaAdSetId, token);
    }
    return { success: true, data: undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao chamar Meta API";
    return { success: false, error: msg };
  }
}

// ================================================================
// toggleAnuncioStatusAction — pausa ou ativa um anúncio via Meta API
// ================================================================

export async function toggleAnuncioStatusAction(
  metaAdId: string,
  clienteId: string,
  novoStatus: "ativa" | "pausada"
): Promise<ActionResult> {
  const token = await getClienteToken(clienteId);
  if (!token) return { success: false, error: "Token Meta não configurado" };

  try {
    if (novoStatus === "pausada") {
      await pausarAnuncio(metaAdId, token);
    } else {
      await ativarAnuncio(metaAdId, token);
    }
    return { success: true, data: undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao chamar Meta API";
    return { success: false, error: msg };
  }
}

// ================================================================
// getGastosDiariosAction — spend diário de uma campanha (time_increment=1)
// ================================================================

export async function getGastosDiariosAction(
  metaCampaignId: string,
  clienteId: string,
  dateRange?: DateRange
): Promise<ActionResult<GastoDiario[]>> {
  const token = await getClienteToken(clienteId);
  if (!token) return { success: false, error: "Token Meta não configurado" };

  const range: DateRange = dateRange ?? {
    since: format(subDays(new Date(), 13), "yyyy-MM-dd"),
    until: format(subDays(new Date(), 1),  "yyyy-MM-dd"),
  };

  try {
    const dias = await getCampanhaGastosDiarios(metaCampaignId, token, range);
    return { success: true, data: dias };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao buscar dados diários";
    return { success: false, error: msg };
  }
}
