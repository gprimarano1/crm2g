import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ClienteShell } from "@/components/cliente/ClienteShell";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Busca perfil + dados do cliente vinculado
  const { data: profile } = await supabase
    .from("perfis")
    .select("nome, role, cliente_id, first_login, clientes(nome_empresa)")
    .eq("id", user.id)
    .single();

  // Admin tentando acessar área de cliente → manda para dashboard
  if (!profile || profile.role !== "cliente") redirect("/dashboard");

  // Primeiro acesso: redireciona para trocar senha (pathname via middleware header)
  const pathname = headers().get("x-pathname") ?? "";
  if (profile.first_login && pathname !== "/trocar-senha") {
    redirect("/trocar-senha");
  }

  // Supabase retorna FK como array; pega o primeiro registro
  const clienteData = Array.isArray(profile.clientes)
    ? (profile.clientes[0] as { nome_empresa: string } | undefined)
    : (profile.clientes as { nome_empresa: string } | null | undefined);

  return (
    <ClienteShell
      nomeEmpresa={clienteData?.nome_empresa ?? "Painel do Cliente"}
      userName={profile.nome}
    >
      {children}
    </ClienteShell>
  );
}
