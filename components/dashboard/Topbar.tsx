"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/clientes":      "Clientes",
  "/campanhas":     "Campanhas",
  "/leads":         "Leads",
  "/propostas":     "Propostas",
  "/relatorios":    "Relatórios",
  "/configuracoes": "Configurações",
};

function getPageTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return title;
    }
  }
  return "CRM 2G";
}

interface TopbarProps {
  profile: {
    nome: string | null;
    email: string | null;
  };
  newLeadsCount?: number;
}

export function Topbar({ profile, newLeadsCount = 0 }: TopbarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-bg-border bg-bg-surface px-6">
      {/* Título da página */}
      <h2 className="font-display text-base font-semibold text-text">
        {title}
      </h2>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notificações */}
      <div className="relative">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition-colors hover:bg-bg-surface2 hover:text-text">
          <Bell size={17} />
        </button>
        {newLeadsCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
            {newLeadsCount > 9 ? "9+" : newLeadsCount}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-bg-border" />

      {/* Usuário */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-[11px] font-bold text-accent">
          {(profile.nome ?? profile.email ?? "?")
            .split(" ")
            .slice(0, 2)
            .map((p) => p[0])
            .join("")
            .toUpperCase()}
        </div>
        <span className="hidden text-sm font-medium text-text sm:block">
          {profile.nome ?? "Admin"}
        </span>
      </div>
    </header>
  );
}
