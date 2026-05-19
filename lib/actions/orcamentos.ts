"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ================================================================
// Types
// ================================================================

export type OrcamentoStatus =
  | "rascunho"
  | "enviado"
  | "visualizado"
  | "aceito"
  | "recusado";

export type OrcamentoProduto = {
  id:             string;
  imagem_url:     string | null;
  nome:           string;
  descricao:      string;
  valor:          number;
  em_promocao:    boolean;
  valor_de:       number | null;
  prazo_entrega:  string;
  quantidade:     number;
};

export type Orcamento = {
  id:               string;
  cliente_id:       string;
  slug:             string;
  numero:           string | null;
  cliente_nome:     string;
  cliente_email:    string | null;
  cliente_telefone: string | null;
  data_emissao:     string;
  data_validade:    string;
  produtos:         OrcamentoProduto[];
  formas_pagamento: string | null;
  observacoes:      string | null;
  total:            number;
  status:           OrcamentoStatus;
  visualizado_em:   string | null;
  aceito_em:        string | null;
  recusado_em:      string | null;
  visualizacoes:    number;
  created_at:       string;
  updated_at:       string;
};

export type OrcamentoComCliente = Orcamento & {
  cliente_empresa: string | null;
};

function calcularTotal(produtos: OrcamentoProduto[]): number {
  return produtos.reduce(
    (s, p) => s + Number(p.valor ?? 0) * Number(p.quantidade ?? 1),
    0,
  );
}

function gerarNumero(): string {
  const now    = new Date();
  const ymd    = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `ORC-${ymd}-${random}`;
}

// ================================================================
// Listagens
// ================================================================

export async function getOrcamentos(opts?: {
  clienteId?: string;
  status?:    string;
}): Promise<OrcamentoComCliente[]> {
  const supabase = await createClient();

  let q = supabase
    .from("orcamentos")
    .select("*, clientes(nome_empresa)")
    .order("created_at", { ascending: false });

  if (opts?.clienteId) q = q.eq("cliente_id", opts.clienteId);
  if (opts?.status && opts.status !== "todos") q = q.eq("status", opts.status);

  const { data } = await q;
  return (data ?? []).map((row) => {
    const { clientes, ...rest } = row as Orcamento & { clientes?: { nome_empresa: string } | { nome_empresa: string }[] };
    const empresa = Array.isArray(clientes)
      ? clientes[0]?.nome_empresa ?? null
      : clientes?.nome_empresa ?? null;
    return { ...(rest as Orcamento), cliente_empresa: empresa };
  });
}

export async function getOrcamentoById(id: string): Promise<Orcamento | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Orcamento | null) ?? null;
}

export async function getOrcamentoBySlug(slug: string): Promise<Orcamento | null> {
  // Página pública: usa admin client (RLS permite leitura apenas autenticada)
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Orcamento | null) ?? null;
}

// ================================================================
// Criar
// ================================================================

export type CriarOrcamentoInput = {
  cliente_id:       string;
  cliente_nome:     string;
  cliente_email?:   string;
  cliente_telefone?: string;
  data_emissao:     string;
  data_validade:    string;
  produtos:         OrcamentoProduto[];
  formas_pagamento?: string;
  observacoes?:     string;
  status?:          OrcamentoStatus;
};

export async function criarOrcamento(
  input: CriarOrcamentoInput,
): Promise<{ success: boolean; id?: string; slug?: string; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const slug   = crypto.randomBytes(6).toString("base64url");
  const numero = gerarNumero();
  const total  = calcularTotal(input.produtos);

  const { data, error } = await supabase
    .from("orcamentos")
    .insert({
      cliente_id:       input.cliente_id,
      slug,
      numero,
      cliente_nome:     input.cliente_nome.trim(),
      cliente_email:    input.cliente_email?.trim() || null,
      cliente_telefone: input.cliente_telefone?.trim() || null,
      data_emissao:     input.data_emissao,
      data_validade:    input.data_validade,
      produtos:         input.produtos,
      formas_pagamento: input.formas_pagamento?.trim() || null,
      observacoes:      input.observacoes?.trim() || null,
      total,
      status:           input.status ?? "rascunho",
      created_by:       user.id,
    })
    .select("id, slug")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/orcamentos");
  revalidatePath("/painel/orcamentos");

  return { success: true, id: data.id, slug: data.slug };
}

// ================================================================
// Atualizar
// ================================================================

export type AtualizarOrcamentoInput = Partial<CriarOrcamentoInput> & {
  status?: OrcamentoStatus;
};

export async function atualizarOrcamento(
  id: string,
  input: AtualizarOrcamentoInput,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const patch: Record<string, unknown> = {};
  if (input.cliente_nome     !== undefined) patch.cliente_nome     = input.cliente_nome.trim();
  if (input.cliente_email    !== undefined) patch.cliente_email    = input.cliente_email?.trim() || null;
  if (input.cliente_telefone !== undefined) patch.cliente_telefone = input.cliente_telefone?.trim() || null;
  if (input.data_emissao     !== undefined) patch.data_emissao     = input.data_emissao;
  if (input.data_validade    !== undefined) patch.data_validade    = input.data_validade;
  if (input.formas_pagamento !== undefined) patch.formas_pagamento = input.formas_pagamento?.trim() || null;
  if (input.observacoes      !== undefined) patch.observacoes      = input.observacoes?.trim() || null;
  if (input.status           !== undefined) patch.status           = input.status;
  if (input.produtos         !== undefined) {
    patch.produtos = input.produtos;
    patch.total    = calcularTotal(input.produtos);
  }

  const { error } = await supabase.from("orcamentos").update(patch).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/orcamentos");
  revalidatePath("/painel/orcamentos");
  revalidatePath(`/orcamentos/${id}`);
  revalidatePath(`/painel/orcamentos/${id}`);

  return { success: true };
}

// ================================================================
// Deletar
// ================================================================

export async function deletarOrcamento(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("orcamentos").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/orcamentos");
  revalidatePath("/painel/orcamentos");
  return { success: true };
}

// ================================================================
// Visualização pública (incrementa contador)
// ================================================================

export async function registrarVisualizacao(slug: string): Promise<void> {
  const supabase = await createAdminClient();

  const { data: orc } = await supabase
    .from("orcamentos")
    .select("id, status, visualizacoes")
    .eq("slug", slug)
    .maybeSingle();

  if (!orc) return;

  const patch: Record<string, unknown> = {
    visualizacoes: (orc.visualizacoes ?? 0) + 1,
  };
  if (orc.status === "enviado") {
    patch.status         = "visualizado";
    patch.visualizado_em = new Date().toISOString();
  }

  await supabase.from("orcamentos").update(patch).eq("id", orc.id);
}

// ================================================================
// Upload de imagem do produto
// ================================================================

export async function uploadProdutoImagem(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createAdminClient();
  const file = formData.get("imagem") as File | null;
  if (!file || file.size === 0) return { error: "Nenhuma imagem selecionada" };

  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

  await supabase.storage.createBucket("orcamentos-imagens", { public: true }).catch(() => {});

  const { data, error } = await supabase.storage
    .from("orcamentos-imagens")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from("orcamentos-imagens").getPublicUrl(data.path);
  return { url: urlData.publicUrl };
}
