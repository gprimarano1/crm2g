"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { format, startOfWeek, subWeeks, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

// ================================================================
// Types
// ================================================================

export type ClienteStatus = "ativo" | "pausado" | "encerrado";

export type Cliente = {
  id: string;
  nome_empresa: string;
  responsavel: string;
  telefone: string | null;
  email: string | null;
  segmento: string | null;
  status: ClienteStatus;
  data_inicio: string | null;
  meta_page_id: string | null;
  meta_ad_account_id: string | null;
  meta_pixel_id: string | null;
  meta_capi_token: string | null;
  meta_access_token: string | null;
  whatsapp_referencia: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type ClienteComMetricas = Cliente & {
  leads_semana: number;
  investimento_total: number;
  cpl_medio: number;
  vendas_semana: number;
  receita_semana: number;
};

export type ClienteFormData = {
  nome_empresa: string;
  responsavel: string;
  telefone?: string;
  email?: string;
  segmento?: string;
  status?: ClienteStatus;
  data_inicio?: string;
  meta_page_id?: string;
  meta_ad_account_id?: string;
  meta_pixel_id?: string;
  meta_capi_token?: string;
  meta_access_token?: string;
  whatsapp_referencia?: string;
  observacoes?: string;
};

export type MetricasFormData = {
  semana_inicio: string;
  semana_fim: string;
  orcamentos_quantidade: number;
  orcamentos_valor: number;
  vendas_quantidade: number;
  vendas_valor: number;
};

export type WeekChartData = {
  label: string;
  semana: string;
  leads: number;
  vendas: number;
  receita: number;
};

export type VisaoGeralData = {
  leads_semana: number;
  investimento: number;
  cpl: number;
  vendas: number;
  receita: number;
  orcamentos: number;
  chart: WeekChartData[];
};

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ================================================================
// Helpers de data
// ================================================================

function getWeekStart(date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // segunda-feira
}

function getWeekEnd(date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

// ================================================================
// createCliente
// ================================================================

export async function createCliente(
  data: ClienteFormData
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      nome_empresa: data.nome_empresa,
      responsavel: data.responsavel,
      telefone: data.telefone || null,
      email: data.email || null,
      segmento: data.segmento || null,
      status: data.status ?? "ativo",
      data_inicio: data.data_inicio || null,
      meta_page_id: data.meta_page_id || null,
      meta_ad_account_id: data.meta_ad_account_id || null,
      meta_pixel_id: data.meta_pixel_id || null,
      meta_capi_token: data.meta_capi_token || null,
      meta_access_token: data.meta_access_token || null,
      whatsapp_referencia: data.whatsapp_referencia || null,
      observacoes: data.observacoes || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  redirect(`/clientes/${cliente.id}`);
}

// ================================================================
// updateCliente
// ================================================================

export async function updateCliente(
  id: string,
  data: Partial<ClienteFormData>
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update({
      ...data,
      telefone: data.telefone || null,
      email: data.email || null,
      segmento: data.segmento || null,
      data_inicio: data.data_inicio || null,
      meta_page_id: data.meta_page_id || null,
      meta_ad_account_id: data.meta_ad_account_id || null,
      meta_pixel_id: data.meta_pixel_id || null,
      meta_capi_token: data.meta_capi_token || null,
      meta_access_token: data.meta_access_token || null,
      whatsapp_referencia: data.whatsapp_referencia || null,
      observacoes: data.observacoes || null,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
  return { success: true, data: undefined };
}

// ================================================================
// deleteCliente
// ================================================================

export async function deleteCliente(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/clientes");
  redirect("/clientes");
}

// ================================================================
// getClienteById
// ================================================================

export async function getClienteById(id: string): Promise<Cliente | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Cliente;
}

// ================================================================
// getClientesComMetricas (lista + semana atual)
// ================================================================

export async function getClientesComMetricas(opts?: {
  q?: string;
  status?: string;
}): Promise<ClienteComMetricas[]> {
  const supabase = await createClient();

  let query = supabase.from("clientes").select("*").order("nome_empresa");

  if (opts?.status && opts.status !== "todos") {
    query = query.eq("status", opts.status);
  }
  if (opts?.q) {
    query = query.ilike("nome_empresa", `%${opts.q}%`);
  }

  const { data: clientes } = await query;
  if (!clientes || clientes.length === 0) return [];

  const weekStart = getWeekStart();
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  // Busca leads e métricas da semana em lote (evita N+1)
  const clienteIds = clientes.map((c) => c.id);

  const [leadsRes, metricasRes, campanhasRes] = await Promise.all([
    supabase
      .from("leads")
      .select("cliente_id")
      .in("cliente_id", clienteIds)
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("metricas_manuais")
      .select("cliente_id, tipo, quantidade, valor")
      .in("cliente_id", clienteIds)
      .gte("data_registro", weekStartStr),
    supabase
      .from("campanhas")
      .select("cliente_id, gasto_total, cpl_medio")
      .in("cliente_id", clienteIds)
      .eq("status", "ativa"),
  ]);

  const leads = leadsRes.data ?? [];
  const metricas = metricasRes.data ?? [];
  const campanhas = campanhasRes.data ?? [];

  // Agrupa leads por cliente_id
  const leadsMap: Record<string, number> = {};
  leads.forEach((l) => {
    leadsMap[l.cliente_id] = (leadsMap[l.cliente_id] ?? 0) + 1;
  });

  const campanhasMap: Record<string, { gasto: number; cpl: number }> = {};
  campanhas.forEach((c) => {
    const prev = campanhasMap[c.cliente_id] ?? { gasto: 0, cpl: 0 };
    campanhasMap[c.cliente_id] = {
      gasto: prev.gasto + (c.gasto_total ?? 0),
      cpl: c.cpl_medio ?? 0,
    };
  });

  return clientes.map((c) => {
    const leadsCount = leadsMap[c.id] ?? 0;
    const camp = campanhasMap[c.id];
    const investimento = camp?.gasto ?? 0;
    const cpl = leadsCount > 0 && investimento > 0 ? investimento / leadsCount : 0;

    const clienteVendas = metricas.filter((m) => m.cliente_id === c.id && m.tipo === "venda");
    const vendas_semana   = clienteVendas.reduce((s, m) => s + (m.quantidade ?? 0), 0);
    const receita_semana  = clienteVendas.reduce((s, m) => s + Number(m.valor ?? 0), 0);

    return {
      ...(c as Cliente),
      leads_semana: leadsCount,
      investimento_total: investimento,
      cpl_medio: cpl,
      vendas_semana,
      receita_semana,
    };
  });
}

// ================================================================
// getClienteVisaoGeral (KPIs + gráfico das últimas 8 semanas)
// ================================================================

export async function getClienteVisaoGeral(
  clienteId: string
): Promise<VisaoGeralData> {
  const supabase = await createClient();

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  // KPIs semana atual
  const [leadsRes, metricasRes, campanhasRes] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", clienteId)
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", weekEnd.toISOString()),
    supabase
      .from("metricas_manuais")
      .select("tipo, quantidade, valor")
      .eq("cliente_id", clienteId)
      .gte("data_registro", weekStartStr)
      .lte("data_registro", weekEndStr),
    supabase
      .from("campanhas")
      .select("gasto_total")
      .eq("cliente_id", clienteId)
      .eq("status", "ativa"),
  ]);

  const leadsCount   = leadsRes.count ?? 0;
  const metricasList = metricasRes.data ?? [];
  const investimento = (campanhasRes.data ?? []).reduce(
    (sum, c) => sum + (c.gasto_total ?? 0),
    0
  );

  // Histórico das últimas 8 semanas para o gráfico
  const oldestWeekStart = subWeeks(weekStart, 7);
  const oldestStr = format(oldestWeekStart, "yyyy-MM-dd");

  const [histLeads, histMetricas] = await Promise.all([
    supabase
      .from("leads")
      .select("created_at")
      .eq("cliente_id", clienteId)
      .gte("created_at", oldestWeekStart.toISOString()),
    supabase
      .from("metricas_manuais")
      .select("data_registro, tipo, quantidade, valor")
      .eq("cliente_id", clienteId)
      .gte("data_registro", oldestStr)
      .order("data_registro"),
  ]);

  // Constrói semanas (segunda a segunda, das últimas 8)
  const weeks: Array<{ start: Date; label: string; key: string }> = [];
  for (let i = 7; i >= 0; i--) {
    const monday = subWeeks(weekStart, i);
    weeks.push({
      start: monday,
      label: format(monday, "dd/MM", { locale: ptBR }),
      key: format(monday, "yyyy-MM-dd"),
    });
  }

  // Agrupa leads por semana
  const leadsByWeek: Record<string, number> = {};
  (histLeads.data ?? []).forEach((l) => {
    const monday = getWeekStart(new Date(l.created_at));
    const key = format(monday, "yyyy-MM-dd");
    leadsByWeek[key] = (leadsByWeek[key] ?? 0) + 1;
  });

  // Indexa métricas manuais de venda por semana (segunda-feira)
  const metricasByWeek: Record<string, { vendas: number; receita: number }> = {};
  (histMetricas.data ?? []).forEach((m) => {
    if (m.tipo !== "venda") return;
    const monday = getWeekStart(new Date(m.data_registro + "T12:00:00"));
    const key = format(monday, "yyyy-MM-dd");
    const prev = metricasByWeek[key] ?? { vendas: 0, receita: 0 };
    metricasByWeek[key] = {
      vendas: prev.vendas + (m.quantidade ?? 0),
      receita: prev.receita + Number(m.valor ?? 0),
    };
  });

  const chart: WeekChartData[] = weeks.map(({ label, key }) => ({
    label,
    semana: key,
    leads: leadsByWeek[key] ?? 0,
    vendas: metricasByWeek[key]?.vendas ?? 0,
    receita: metricasByWeek[key]?.receita ?? 0,
  }));

  return {
    leads_semana: leadsCount,
    investimento,
    cpl: leadsCount > 0 && investimento > 0 ? investimento / leadsCount : 0,
    vendas:     metricasList.filter((m) => m.tipo === "venda").reduce((s, m) => s + (m.quantidade ?? 0), 0),
    receita:    metricasList.filter((m) => m.tipo === "venda").reduce((s, m) => s + Number(m.valor ?? 0), 0),
    orcamentos: metricasList.filter((m) => m.tipo === "orcamento").reduce((s, m) => s + (m.quantidade ?? 0), 0),
    chart,
  };
}

// ================================================================
// upsertMetricasManuais
// ================================================================

export async function upsertMetricasManuais(
  clienteId: string,
  data: MetricasFormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("metricas_manuais").upsert(
    {
      cliente_id: clienteId,
      semana_inicio: data.semana_inicio,
      semana_fim: data.semana_fim,
      orcamentos_quantidade: data.orcamentos_quantidade,
      orcamentos_valor: data.orcamentos_valor,
      vendas_quantidade: data.vendas_quantidade,
      vendas_valor: data.vendas_valor,
    },
    { onConflict: "cliente_id,semana_inicio" }
  );

  if (error) return { success: false, error: error.message };

  revalidatePath(`/clientes/${clienteId}`);
  return { success: true, data: undefined };
}

// ================================================================
// criarAcessoCliente
// ================================================================

export async function criarAcessoCliente(
  clienteId: string,
  email: string,
  nome: string
): Promise<ActionResult<{ email: string; senha: string }>> {
  const supabaseAdmin = await createAdminClient();

  // Gera senha temporária forte
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const special = "!@#$";
  const senha =
    Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") +
    special[Math.floor(Math.random() * special.length)] +
    Math.floor(Math.random() * 90 + 10);

  const { data: authData, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });

  if (createError || !authData.user) {
    const msg = createError?.message ?? "Erro desconhecido";
    if (msg.includes("already been registered")) {
      return { success: false, error: `Email ${email} já está cadastrado no sistema.` };
    }
    return { success: false, error: msg };
  }

  // Atualiza/cria perfil com role cliente + vincula cliente_id
  const { error: profileError } = await supabaseAdmin
    .from("perfis")
    .upsert({
      id: authData.user.id,
      email,
      nome,
      role: "cliente",
      cliente_id: clienteId,
    });

  if (profileError) {
    // Rollback: deleta o usuário criado
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: profileError.message };
  }

  revalidatePath(`/clientes/${clienteId}`);
  return { success: true, data: { email, senha } };
}

// ================================================================
// resetarSenhaAcesso
// ================================================================

export async function resetarSenhaAcesso(
  perfilId: string,
  clienteId: string
): Promise<ActionResult<{ email: string; senha: string }>> {
  const supabaseAdmin = await createAdminClient();

  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const special = "!@#$";
  const senha =
    Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") +
    special[Math.floor(Math.random() * special.length)] +
    Math.floor(Math.random() * 90 + 10);

  const { error } = await supabaseAdmin.auth.admin.updateUserById(perfilId, {
    password: senha,
  });

  if (error) return { success: false, error: error.message };

  // Força first_login = true para obrigar troca de senha
  await supabaseAdmin
    .from("perfis")
    .update({ first_login: true })
    .eq("id", perfilId);

  const { data: perfil } = await supabaseAdmin
    .from("perfis")
    .select("email")
    .eq("id", perfilId)
    .single();

  revalidatePath(`/clientes/${clienteId}`);
  return { success: true, data: { email: perfil?.email ?? "", senha } };
}

// ================================================================
// excluirAcessoCliente
// ================================================================

export async function excluirAcessoCliente(
  perfilId: string,
  clienteId: string
): Promise<ActionResult<undefined>> {
  const supabaseAdmin = await createAdminClient();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(perfilId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/clientes/${clienteId}`);
  return { success: true, data: undefined };
}

// ================================================================
// editarNomeAcesso
// ================================================================

export async function editarNomeAcesso(
  perfilId: string,
  clienteId: string,
  nome: string
): Promise<ActionResult<undefined>> {
  const supabaseAdmin = await createAdminClient();

  const { error } = await supabaseAdmin
    .from("perfis")
    .update({ nome })
    .eq("id", perfilId);

  if (error) return { success: false, error: error.message };

  await supabaseAdmin.auth.admin.updateUserById(perfilId, {
    user_metadata: { nome },
  });

  revalidatePath(`/clientes/${clienteId}`);
  return { success: true, data: undefined };
}
