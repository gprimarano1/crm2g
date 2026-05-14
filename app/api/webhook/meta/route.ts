import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCAPIEvent } from "@/lib/capi/client";

// Cliente admin direto (sem cookies — webhook é server-to-server)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const META_API_VERSION = "v19.0";

// ================================================================
// Helper: salva log na tabela webhook_logs + console.log
// ================================================================

async function saveLog(
  tipo: "GET" | "POST",
  payload: Record<string, unknown>,
  status: string,
  erro?: string
): Promise<void> {
  const entry = {
    tipo,
    payload,
    status,
    erro: erro ?? null,
  };

  // Console sempre — fallback garantido
  console.log(`[Webhook Meta] ${tipo} | status=${status}${erro ? ` | erro=${erro}` : ""}`, JSON.stringify(payload));

  try {
    const supabase = getAdminClient();
    await supabase.from("webhook_logs").insert(entry);
  } catch (err) {
    // Não lança — log de log não pode derrubar o webhook
    console.error("[Webhook Meta] Falha ao salvar webhook_log:", err);
  }
}

// ================================================================
// GET — verificação do webhook pelo Meta (hub.challenge)
// ================================================================

export async function GET(request: NextRequest) {
  const ts = new Date().toISOString();
  const { searchParams } = new URL(request.url);

  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const logPayload = {
    ts,
    mode,
    challenge,
    token_recebido: token,
    token_esperado_presente: !!process.env.META_WEBHOOK_VERIFY_TOKEN,
    tokens_iguais: token === process.env.META_WEBHOOK_VERIFY_TOKEN,
  };

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    await saveLog("GET", logPayload, "verificado");
    console.log(`[Webhook Meta] GET verificação OK — challenge=${challenge}`);
    return new NextResponse(challenge, { status: 200 });
  }

  await saveLog("GET", logPayload, "falhou", "Token ou mode incorreto");
  console.warn(`[Webhook Meta] GET verificação FALHOU — mode=${mode} token_match=${logPayload.tokens_iguais}`);
  return NextResponse.json({ error: "Verificação falhou" }, { status: 403 });
}

// ================================================================
// POST — recebe eventos de Lead Ads em tempo real
// ================================================================

export async function POST(request: NextRequest) {
  const ts = new Date().toISOString();

  // Captura headers relevantes para diagnóstico
  const relevantHeaders = ["x-hub-signature-256", "content-type", "user-agent", "x-forwarded-for"];
  const headersLog: Record<string, string> = {};
  relevantHeaders.forEach((k) => {
    const v = request.headers.get(k);
    if (v) headersLog[k] = v;
  });

  console.log(`[Webhook Meta] POST recebido — ${ts}`, JSON.stringify(headersLog));

  // Lê body como texto (deve ser antes de parsear para HMAC)
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch (err) {
    await saveLog("POST", { ts, headers: headersLog, erro: String(err) }, "erro_leitura", "Falha ao ler body");
    return NextResponse.json({ status: "ok" }); // 200 sempre
  }

  console.log(`[Webhook Meta] POST body raw (${rawBody.length} chars):`, rawBody.slice(0, 2000));

  // Valida assinatura HMAC-SHA256
  const sig = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.META_APP_SECRET;

  if (appSecret && sig) {
    const expected = "sha256=" + crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");

    let sigOk = false;
    try {
      sigOk = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      sigOk = false;
    }

    if (!sigOk) {
      const errMsg = `HMAC inválido — recebido=${sig} esperado=${expected}`;
      console.error(`[Webhook Meta] ${errMsg}`);
      await saveLog("POST", { ts, headers: headersLog, raw_body: rawBody.slice(0, 500) }, "hmac_invalido", errMsg);
      return NextResponse.json({ status: "ok" }); // 200 para Meta não retentar
    }
  } else {
    console.warn(`[Webhook Meta] Sem validação HMAC — appSecret=${!!appSecret} sig=${!!sig}`);
  }

  // Parse JSON
  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch (err) {
    const errMsg = `JSON inválido: ${err}`;
    console.error(`[Webhook Meta] ${errMsg}`);
    await saveLog("POST", { ts, headers: headersLog, raw_body: rawBody.slice(0, 500) }, "json_invalido", errMsg);
    return NextResponse.json({ status: "ok" }); // 200 sempre
  }

  console.log(`[Webhook Meta] Payload parseado — object=${body.object} entries=${body.entry?.length ?? 0}`);

  await saveLog("POST", {
    ts,
    headers: headersLog,
    object: body.object,
    entry_count: body.entry?.length ?? 0,
    payload: body,
  }, "recebido");

  // Processa apenas eventos de página com leads
  if (body.object === "page") {
    const events = extractLeadEvents(body);
    console.log(`[Webhook Meta] Eventos de lead extraídos: ${events.length}`);

    if (events.length > 0) {
      const results = await Promise.allSettled(events.map(processLeadEvent));
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`[Webhook Meta] Erro no evento ${i}:`, r.reason);
        }
      });
    }
  } else {
    console.log(`[Webhook Meta] Objeto ignorado: ${body.object}`);
  }

  return NextResponse.json({ status: "ok" });
}

// ================================================================
// Tipos do webhook Meta
// ================================================================

interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}

interface WebhookEntry {
  id: string;
  time: number;
  changes: WebhookChange[];
}

interface WebhookChange {
  field: string;
  value: LeadgenValue;
}

interface LeadgenValue {
  page_id: string;
  form_id: string;
  leadgen_id: string;
  created_time: number;
  campaign_id?: string;
  campaign_name?: string;
  adgroup_id?: string;
  adgroup_name?: string;
  ad_id?: string;
  ad_name?: string;
}

interface MetaFieldData {
  name: string;
  values: string[];
}

// ================================================================
// Helpers
// ================================================================

function extractLeadEvents(body: WebhookBody): LeadgenValue[] {
  const events: LeadgenValue[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === "leadgen") {
        events.push(change.value);
      }
    }
  }
  return events;
}

function parseFieldData(fields: MetaFieldData[]): {
  nome: string;
  telefone: string | null;
  email: string | null;
} {
  const get = (names: string[]): string | null => {
    for (const name of names) {
      const f = fields.find((fd) => fd.name === name);
      if (f?.values?.[0]) return f.values[0].trim();
    }
    return null;
  };

  const firstName = get(["first_name"]) ?? "";
  const lastName  = get(["last_name"]) ?? "";
  const fullName  = get(["full_name", "name"]) ?? [firstName, lastName].filter(Boolean).join(" ");

  return {
    nome:     fullName || "Lead sem nome",
    telefone: get(["phone_number", "phone", "telefone", "whatsapp"]),
    email:    get(["email", "e-mail"]),
  };
}

async function fetchLeadData(
  leadgenId: string,
  accessToken: string
): Promise<MetaFieldData[]> {
  const url = `https://graph.facebook.com/${META_API_VERSION}/${leadgenId}?fields=field_data&access_token=${accessToken}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Meta API: ${res.status}`);
  const data = await res.json() as { field_data?: MetaFieldData[] };
  return data.field_data ?? [];
}

// ================================================================
// Processamento de um evento de lead
// ================================================================

async function processLeadEvent(event: LeadgenValue): Promise<void> {
  const supabase = getAdminClient();

  console.log(`[Webhook Meta] Processando lead leadgen_id=${event.leadgen_id} page_id=${event.page_id} campaign_id=${event.campaign_id}`);

  // 1. Encontra o cliente pelo page_id
  let clienteId: string | null = null;
  let accessToken: string | null = null;

  const { data: clienteByPage } = await supabase
    .from("clientes")
    .select("id, meta_access_token")
    .eq("meta_page_id", event.page_id)
    .maybeSingle();

  if (clienteByPage) {
    clienteId   = clienteByPage.id;
    accessToken = clienteByPage.meta_access_token;
    console.log(`[Webhook Meta] Cliente encontrado por page_id: ${clienteId}`);
  } else if (event.campaign_id) {
    const { data: campanha } = await supabase
      .from("campanhas")
      .select("cliente_id, clientes!inner(meta_access_token)")
      .eq("meta_campaign_id", event.campaign_id)
      .maybeSingle();

    if (campanha) {
      clienteId = campanha.cliente_id;
      const clientes = campanha.clientes as unknown;
      const c = (Array.isArray(clientes) ? clientes[0] : clientes) as
        | { meta_access_token: string | null }
        | null;
      accessToken = c?.meta_access_token ?? null;
      console.log(`[Webhook Meta] Cliente encontrado por campaign_id: ${clienteId}`);
    }
  }

  if (!clienteId) {
    const errMsg = `Nenhum cliente para page_id=${event.page_id} campaign_id=${event.campaign_id ?? "N/A"}`;
    console.warn(`[Webhook Meta] ${errMsg}`);
    await saveLog("POST", { event }, "sem_cliente", errMsg);
    return;
  }

  // 2. Busca dados do lead na API Meta
  let fieldData: MetaFieldData[] = [];
  if (accessToken) {
    try {
      fieldData = await fetchLeadData(event.leadgen_id, accessToken);
      console.log(`[Webhook Meta] Field data do lead:`, JSON.stringify(fieldData));
    } catch (err) {
      console.error(`[Webhook Meta] Erro ao buscar lead ${event.leadgen_id}:`, err);
      await saveLog("POST", { event, erro: String(err) }, "erro_fetch_lead", String(err));
    }
  } else {
    console.warn(`[Webhook Meta] Sem access token para cliente ${clienteId}`);
  }

  const { nome, telefone, email } = parseFieldData(fieldData);
  console.log(`[Webhook Meta] Lead parseado: nome=${nome} tel=${telefone} email=${email}`);

  // 3. Salva na tabela leads (ignora duplicata por meta_lead_id unique)
  const { data: insertedLead, error } = await supabase
    .from("leads")
    .insert({
      cliente_id:      clienteId,
      meta_lead_id:    event.leadgen_id,
      nome,
      telefone,
      email,
      campanha_origem: event.campaign_name ?? event.campaign_id ?? null,
      conjunto_origem: event.adgroup_name  ?? event.adgroup_id  ?? null,
      formulario_id:   event.form_id,
      status:          "novo",
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("unique")) {
      console.log(`[Webhook Meta] Lead duplicado ignorado: ${event.leadgen_id}`);
    } else {
      console.error(`[Webhook Meta] Erro ao salvar lead:`, error.message);
      await saveLog("POST", { event, nome, telefone, email }, "erro_insert", error.message);
    }
    return;
  }

  console.log(`[Webhook Meta] Lead salvo com sucesso: ${nome} id=${insertedLead?.id}`);
  await saveLog("POST", { event, lead_id: insertedLead?.id, nome }, "lead_criado");

  // 4. Dispara CAPI "Lead"
  if (insertedLead?.id) {
    sendCAPIEvent(clienteId, insertedLead.id, "Lead", {
      nome,
      telefone: telefone ?? undefined,
      email: email ?? undefined,
    }).catch((err) => console.error("[Webhook Meta] CAPI Lead error:", err));
  }
}
