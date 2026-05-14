"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Megaphone,
  Users2,
  FileText,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/ui/Logo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeType?: "count" | "dot";
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/clientes",    label: "Clientes",    icon: Building2 },
  { href: "/campanhas",   label: "Campanhas",   icon: Megaphone },
  { href: "/leads",       label: "Leads",       icon: Users2 },
  { href: "/propostas",   label: "Propostas",   icon: FileText },
  { href: "/relatorios",  label: "Relatórios",  icon: BarChart2 },
];

interface SidebarProps {
  profile: {
    nome: string | null;
    email: string | null;
  };
  newLeadsCount: number;
  clientesCount: number;
}

export function Sidebar({ profile, newLeadsCount, clientesCount }: SidebarProps) {
  const pathname = usePathname();

  const items = NAV_ITEMS.map((item) => {
    if (item.href === "/leads" && newLeadsCount > 0)
      return { ...item, badge: newLeadsCount, badgeType: "count" as const };
    if (item.href === "/clientes" && clientesCount > 0)
      return { ...item, badge: clientesCount, badgeType: "count" as const };
    return item;
  });

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const initials = (profile.nome ?? profile.email ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <motion.aside
      initial={{ x: -220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-screen w-[220px] shrink-0 flex-col border-r border-bg-border bg-bg-surface"
    >
      {/* Logo */}
      <div className="px-5 py-5">
        <Logo size="md" />
      </div>

      {/* Nav principal */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:bg-bg-surface2 hover:text-text"
              }`}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-colors ${
                  active
                    ? "text-accent"
                    : "text-text-subtle group-hover:text-text-muted"
                }`}
              />
              <span className="flex-1 truncate">{item.label}</span>

              {/* Badge de count */}
              {item.badge !== undefined && item.badgeType === "count" && (
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                    item.href === "/leads"
                      ? "bg-accent/15 text-accent"
                      : "bg-bg-surface2 text-text-muted"
                  }`}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-bg-border px-3 py-3">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition-all hover:bg-bg-surface2 hover:text-text"
        >
          <Settings size={18} className="shrink-0 text-text-subtle" />
          Configurações
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition-all hover:bg-danger/8 hover:text-danger"
          >
            <LogOut size={18} className="shrink-0" />
            Sair
          </button>
        </form>

        {/* Perfil do usuário */}
        <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-bg-surface2 px-3 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-[11px] font-bold text-accent">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-text">
              {profile.nome ?? "Administrador"}
            </p>
            <p className="truncate text-[11px] text-text-subtle">
              {profile.email ?? ""}
            </p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
