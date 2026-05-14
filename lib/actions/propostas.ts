"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ================================================================
// Types
// ================================================================

export type PropostaStatus = "pendente" | "visualizada" | "aceita" | "recusada";

export type PropostaServico = {
  id:       string;
  nome:     string;
  descricao: string;
  valor:    number;
  incluido: boolean;
};

export type PropostaKPI = {
  id:    string;
  texto: string;
};

export type PropostaDiferencial = {
  id:    string;
  texto: string;
};

export type Proposta = {
  id:                    string;
  slug:                  string;
  prospect_nome:         string;
  empresa:               string;
  segmento:              string | null;
  logo_url:              string | null;
  servicos:              PropostaServico[];
  kpis:                  PropostaKPI[];
  prazo_contrato:        string | null;
  mensagem_personalizada: string | null;
  diferenciais:          PropostaDiferencial[];
  status:                PropostaStatus;
  visualizada_em:        string | null;
  aceita_em:             string | null;
  recusada_em:           string | null;
  motivo_recusa:         string | null;
  created_at:            string;
};

export type PropostaComDuvidas = Proposta & {
  duvidas_total:    number;
  duvidas_pendentes: number;
};

export type PropostaDuvida = {
  id:            string;
  proposta_id:   string;
  texto:         string;
  resposta:      string | null;
  respondida_em: string | null;
  created_at:    string;
};

// ================================================================
// getPropostas
// ================================================================

export async function getPropostas(status?: string): Promise<PropostaComDuvidas[]> {
  const supabase = await createClient();

  let query = supabase
    .from("propostas")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "todos") {
    query = query.eq("status", status);
  }

  const { data: propostas } = await query;
  if (!propostas?.length) return [];

  const ids = propostas.map((p) => p.id);

  const { data: duvidas } = await supabase
    .from("proposta_duvidas")
    .select("proposta_id, respondida_em")
    .in("proposta_id", ids);

  const totaisMap:   Record<string, number> = {};
  const pendentesMap: Record<string, number> = {};
  for (const d of duvidas ?? []) {
    totaisMap[d.proposta_id]   = (totaisMap[d.proposta_id]   ?? 0) + 1;
    if (!d.respondida_em)
      pendentesMap[d.proposta_id] = (pendentesMap[d.proposta_id] ?? 0) + 1;
  }

  return propostas.map((p) => ({
    ...(p as Proposta),
    duvidas_total:    totaisMap[p.id]    ?? 0,
    duvidas_pendentes: pendentesMap[p.id] ?? 0,
  }));
}

// ================================================================
// getPropostaById
// ================================================================

export async function getPropostaById(id: string): Promise<Proposta | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("propostas")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Proposta | null) ?? null;
}

// ================================================================
// getPropostaBySlug — adminClient (público, sem auth)
// ================================================================

export async function getPropostaBySlug(slug: string): Promise<Proposta | null> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("propostas")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data as Proposta | null) ?? null;
}

// ================================================================
// getDuvidasDaProposta
// ================================================================

export async function getDuvidasDaProposta(propostaId: string): Promise<PropostaDuvida[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposta_duvidas")
    .select("*")
    .eq("proposta_id", propostaId)
    .order("created_at", { ascending: true });
  return (data ?? []) as PropostaDuvida[];
}

// ================================================================
// criarProposta
// ================================================================

export async function criarProposta(args: {
  prospectNome:         string;
  empresa:              string;
  segmento:             string;
  logoUrl:              string;
  servicos:             PropostaServico[];
  kpis:                 PropostaKPI[];
  prazoContrato:        string;
  mensagemPersonalizada: string;
  diferenciais:         PropostaDiferencial[];
}): Promise<{ success: boolean; slug?: string; id?: string; error?: string }> {
  const supabase = await createClient();
  const slug     = crypto.randomBytes(6).toString("base64url");

  const { data, error } = await supabase
    .from("propostas")
    .insert({
      slug,
      prospect_nome:          args.prospectNome,
      empresa:                args.empresa,
      segmento:               args.segmento   || null,
      logo_url:               args.logoUrl    || null,
      servicos:               args.servicos,
      kpis:                   args.kpis,
      prazo_contrato:         args.prazoContrato        || null,
      mensagem_personalizada: args.mensagemPersonalizada || null,
      diferenciais:           args.diferenciais,
      status:                 "pendente",
    })
    .select("id, slug")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Erro ao criar proposta" };

  revalidatePath("/propostas");
  return { success: true, slug: data.slug, id: data.id };
}

// ================================================================
// atualizarProposta
// ================================================================

export async function atualizarProposta(
  id: string,
  args: {
    prospectNome:         string;
    empresa:              string;
    segmento:             string;
    logoUrl:              string;
    servicos:             PropostaServico[];
    kpis:                 PropostaKPI[];
    prazoContrato:        string;
    mensagemPersonalizada: string;
    diferenciais:         PropostaDiferencial[];
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("propostas")
    .update({
      prospect_nome:          args.prospectNome,
      empresa:                args.empresa,
      segmento:               args.segmento   || null,
      logo_url:               args.logoUrl    || null,
      servicos:               args.servicos,
      kpis:                   args.kpis,
      prazo_contrato:         args.prazoContrato        || null,
      mensagem_personalizada: args.mensagemPersonalizada || null,
      diferenciais:           args.diferenciais,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/propostas");
  revalidatePath(`/propostas/${id}`);
  return { success: true };
}

// ================================================================
// uploadLogo
// ================================================================

export async function uploadLogo(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get("logo") as File | null;
  if (!file || !file.size) return { error: "Nenhum arquivo enviado" };

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Formato inválido. Use PNG, JPG, WEBP ou SVG." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "Arquivo muito grande. Máximo 2 MB." };
  }

  const supabase = await createAdminClient();

  // Ensure bucket exists
  await supabase.storage.createBucket("propostas-logos", { public: true }).catch(() => {});

  const ext      = file.name.split(".").pop() ?? "png";
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const bytes    = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("propostas-logos")
    .upload(filename, bytes, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("propostas-logos")
    .getPublicUrl(filename);

  return { url: publicUrl };
}

// ================================================================
// duplicarProposta
// ================================================================

export async function duplicarProposta(
  id: string
): Promise<{ success: boolean; id?: string; slug?: string; error?: string }> {
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("propostas")
    .select("*")
    .eq("id", id)
    .single();

  if (!original) return { success: false, error: "Proposta não encontrada" };

  const slug = crypto.randomBytes(6).toString("base64url");

  const { data, error } = await supabase
    .from("propostas")
    .insert({
      slug,
      prospect_nome:          original.prospect_nome,
      empresa:                `${original.empresa} (Cópia)`,
      segmento:               original.segmento,
      logo_url:               original.logo_url,
      servicos:               original.servicos,
      kpis:                   original.kpis,
      prazo_contrato:         original.prazo_contrato,
      mensagem_personalizada: original.mensagem_personalizada,
      diferenciais:           original.diferenciais,
      status:                 "pendente",
    })
    .select("id, slug")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Erro ao duplicar" };

  revalidatePath("/propostas");
  return { success: true, id: data.id, slug: data.slug };
}

// ================================================================
// responderDuvida
// ================================================================

export async function responderDuvida(
  duvidasId:  string,
  resposta:   string,
  propostaId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("proposta_duvidas")
    .update({ resposta, respondida_em: new Date().toISOString() })
    .eq("id", duvidasId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/propostas/${propostaId}`);
  return { success: true };
}

// ================================================================
// registrarVisualizacao — chamado pelo ViewTracker na página pública
// ================================================================

export async function registrarVisualizacao(slug: string): Promise<void> {
  const supabase = await createAdminClient();
  await supabase
    .from("propostas")
    .update({ visualizada_em: new Date().toISOString(), status: "visualizada" })
    .eq("slug", slug)
    .eq("status", "pendente");
}
