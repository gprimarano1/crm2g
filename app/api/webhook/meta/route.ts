import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendCAPIEvent } from "@/lib/capi/client";

const META_API_VERSION = "v19.0";

// ================================================================
// GET — verificação do webhook pelo Meta (hub.challenge)
// ================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verificação falhou" }, { status: 403 });
}

// ================================================================
// POST — recebe eventos de Lead Ads em tempo real
// ================================================================

export async function POST(request: NextRequest) {
  // Lê o body como texto para validação HMAC (deve ser feito ANTES de parsear)
  const rawBody = await request.text();

  // Valida assinatura HMAC-SHA256
  const sig = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.META_APP_SECRET;

  if (appSecret && sig) {
    const expected = "sha256=" + crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 403 });
    }
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Responde 200 imediatamente — Meta exige resposta rápida
  // Processa os leads de forma assíncrona mas ainda dentro da request
  if (body.object === "page") {
    const events = extractLeadEvents(body);
    if (events.length > 0) {
      // Não bloqueia a resposta em caso de erro — Meta não deve retentar por falha nossa
      await Promise.allSettled(events.map(processLeadEvent));
    }
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
  const supabase = await createAdminClient();

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
  } else if (event.campaign_id) {
    // Fallback: tenta encontrar via campanha sincronizada
    const { data: campanha } = await supabase
      .from("campanhas")
      .select("cliente_id, clientes!inner(meta_access_token)")
      .eq("meta_campaign_id", event.campaign_id)
      .maybeSingle();

    if (campanha) {
      clienteId = campanha.cliente_id;
      // Supabase retorna FK join como array ou objeto dependendo da relação
      const clientes = campanha.clientes as unknown;
      const c = (Array.isArray(clientes) ? clientes[0] : clientes) as
        | { meta_access_token: string | null }
        | null;
      accessToken = c?.meta_access_token ?? null;
    }
  }

  if (!clienteId) {
    console.warn(`[Webhook Meta] Nenhum cliente encontrado para page_id=${event.page_id} campaign_id=${event.campaign_id}`);
    return;
  }

  // 2. Busca dados do lead na API Meta
  let fieldData: MetaFieldData[] = [];
  if (accessToken) {
    try {
      fieldData = await fetchLeadData(event.leadgen_id, accessToken);
    } catch (err) {
      console.error(`[Webhook Meta] Erro ao buscar lead ${event.leadgen_id}:`, err);
    }
  }

  const { nome, telefone, email } = parseFieldData(fieldData);

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

  if (error && !error.message.includes("unique")) {
    console.error(`[Webhook Meta] Erro ao salvar lead ${event.leadgen_id}:`, error.message);
    return;
  }

  console.log(`[Webhook Meta] Lead salvo: ${nome} (${event.leadgen_id})`);

  // 4. Dispara CAPI "Lead" para novo lead (non-blocking)
  if (insertedLead?.id) {
    sendCAPIEvent(clienteId, insertedLead.id, "Lead", { nome, telefone: telefone ?? undefined, email: email ?? undefined })
      .catch((err) => console.error("[Webhook Meta] CAPI Lead error:", err));
  }
}
