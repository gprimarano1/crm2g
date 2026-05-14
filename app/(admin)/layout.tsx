import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/dashboard/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Busca perfil do usuário
  const { data: profile } = await supabase
    .from("perfis")
    .select("nome, email, role")
    .eq("id", user.id)
    .single();

  // Cliente tentando acessar área admin → manda para o painel
  if (profile?.role === "cliente") redirect("/painel");

  // Stats para badges da sidebar
  const [{ count: newLeadsCount }, { count: clientesCount }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "novo"),
      supabase
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo"),
    ]);

  const profileData = {
    nome: profile?.nome ?? null,
    email: profile?.email ?? user.email ?? null,
  };

  return (
    <AdminShell
      profile={profileData}
      newLeadsCount={newLeadsCount ?? 0}
      clientesCount={clientesCount ?? 0}
    >
      {children}
    </AdminShell>
  );
}
