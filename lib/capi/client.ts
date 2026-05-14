import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

const META_API_VERSION = "v19.0";

export type CAPIEventName =
  | "Lead"
  | "Contact"
  | "SubmitApplication"
  | "Purchase"
  | string;

export interface SendCAPIResult {
  success: boolean;
  eventId: string;
  error?:  string;
}

interface CAPICredentials {
  pixelId:   string;
  capiToken: string;
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// ================================================================
// sendCAPIEvent
//
// clienteId    — usado para buscar credenciais e logar o evento
// leadId       — associa o evento ao lead (null para eventos sem lead)
// eventName    — nome do evento Meta (Lead, Contact, Purchase…)
// eventData    — dados do usuário e valor de venda
// credentials  — se passado, pula a query de credenciais no Supabase
// ================================================================

export async function sendCAPIEvent(
  clienteId:   string,
  leadId:      string | null,
  eventName:   CAPIEventName,
  eventData:   {
    email?:    string;
    telefone?: string;
    nome?:     string;
    valor?:    number;
  },
  credentials?: CAPICredentials
): Promise<SendCAPIResult> {
  const supabase = await createAdminClient();

  let pixelId:   string;
  let capiToken: string;

  if (credentials) {
    pixelId   = credentials.pixelId;
    capiToken = credentials.capiToken;
  } else {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("meta_pixel_id, meta_capi_token")
      .eq("id", clienteId)
      .single();

    if (!cliente?.meta_pixel_id || !cliente?.meta_capi_token) {
      return { success: false, eventId: "", error: "sem_credenciais_capi" };
    }

    pixelId   = cliente.meta_pixel_id;
    capiToken = cliente.meta_capi_token;
  }

  const eventId   = crypto.randomUUID();
  const eventTime = Math.floor(Date.now() / 1000);

  const userData: Record<string, string> = {};
  if (eventData.email)    userData.em = sha256(eventData.email);
  if (eventData.telefone) userData.ph = sha256(eventData.telefone.replace(/\D/g, ""));
  if (eventData.nome)     userData.fn = sha256(eventData.nome);

  type EventPayload = {
    event_name:    string;
    event_time:    number;
    event_id:      string;
    action_source: string;
    user_data:     Record<string, string>;
    custom_data?:  Record<string, unknown>;
  };

  const event: EventPayload = {
    event_name:    eventName,
    event_time:    eventTime,
    event_id:      eventId,
    action_source: "system_generated",
    user_data:     userData,
  };

  if (eventName === "Purchase" && eventData.valor) {
    event.custom_data = { value: eventData.valor, currency: "BRL" };
  }

  const payload = { data: [event] };

  const url = `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events?access_token=${capiToken}`;

  let status: "sucesso" | "erro" = "erro";
  let response: Record<string, unknown> | null = null;
  let errorMessage: string | null = null;

  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    const responseBody = await res.json() as Record<string, unknown>;
    response = responseBody;

    if (res.ok) {
      status = "sucesso";
    } else {
      errorMessage = JSON.stringify(responseBody);
    }
  } catch (err) {
    errorMessage = String(err);
  }

  await supabase.from("capi_eventos").insert({
    cliente_id:    clienteId,
    lead_id:       leadId,
    event_name:    eventName,
    event_id:      eventId,
    pixel_id:      pixelId,
    status,
    payload,
    response,
    error_message: errorMessage,
  });

  return {
    success: status === "sucesso",
    eventId,
    error:   errorMessage ?? undefined,
  };
}
