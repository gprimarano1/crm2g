"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type TrocarSenhaState = { error: string } | null;

export async function trocarSenhaAction(
  _prevState: TrocarSenhaState,
  formData: FormData,
): Promise<TrocarSenhaState> {
  const novaSenha = (formData.get("novaSenha") as string | null) ?? "";
  const confirmar = (formData.get("confirmar") as string | null) ?? "";

  if (novaSenha.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres." };
  }
  if (novaSenha !== confirmar) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createClient();

  // Atualiza a senha do usuário autenticado
  const { data, error: authError } = await supabase.auth.updateUser({
    password: novaSenha,
  });

  if (authError || !data.user) {
    return { error: authError?.message ?? "Erro ao atualizar senha. Tente novamente." };
  }

  // Marca first_login = false
  await supabase
    .from("perfis")
    .update({ first_login: false })
    .eq("id", data.user.id);

  redirect("/painel");
}
