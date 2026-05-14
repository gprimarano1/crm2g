"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha email e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[loginAction] Supabase error:", error.status, error.code, error.message);
    const msg = error.message.toLowerCase();
    if (
      msg.includes("invalid login credentials") ||
      msg.includes("invalid credentials") ||
      msg.includes("email not found") ||
      msg.includes("wrong password")
    ) {
      return { error: "Email ou senha incorretos." };
    }
    if (msg.includes("email not confirmed")) {
      return { error: "Confirme seu email antes de entrar." };
    }
    if (msg.includes("rate limit") || msg.includes("too many requests")) {
      return { error: "Muitas tentativas. Aguarde alguns minutos." };
    }
    return { error: `Erro ao entrar: ${error.message}` };
  }

  // Verifica role para redirecionar corretamente
  const { data: profile } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "cliente") {
    redirect("/painel");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
