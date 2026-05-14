import { createClient } from "@/lib/supabase/server";
import { Settings, User, Shield } from "lucide-react";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("perfis")
        .select("nome, email, role")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <Settings size={16} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text">Configurações</h1>
          <p className="text-sm text-text-muted">Perfil e preferências da conta</p>
        </div>
      </div>

      {/* Perfil */}
      <section className="rounded-2xl border border-bg-border bg-bg-surface p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <User size={15} className="text-text-muted" />
          Perfil
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Nome</span>
            <span className="text-sm text-text">{profile?.nome ?? "—"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wide">E-mail</span>
            <span className="text-sm text-text">{profile?.email ?? user?.email ?? "—"}</span>
          </div>
        </div>
      </section>

      {/* Permissão */}
      <section className="rounded-2xl border border-bg-border bg-bg-surface p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <Shield size={15} className="text-text-muted" />
          Permissão
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              profile?.role === "admin"
                ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                : "bg-bg-surface2 text-text-muted ring-1 ring-bg-border"
            }`}
          >
            {profile?.role === "admin" ? "Administrador" : profile?.role ?? "—"}
          </span>
        </div>
      </section>
    </div>
  );
}
