"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users2, KeyRound, LogOut, Receipt } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/painel",            label: "Leads",      icon: Users2 },
  { href: "/painel/orcamentos", label: "Orçamentos", icon: Receipt },
];

interface ClienteShellProps {
  nomeEmpresa: string;
  userName: string | null;
  children: React.ReactNode;
}

export function ClienteShell({ nomeEmpresa, userName, children }: ClienteShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-bg-border bg-bg-surface/80 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-6 px-6">
          {/* Logo + empresa */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/30">
              <span className="font-display text-xs font-bold text-accent">T</span>
            </div>
            <div>
              <span className="font-display text-sm font-semibold text-text">
                {nomeEmpresa}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/painel"
                  ? pathname === "/painel"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-text-muted hover:bg-bg-surface2 hover:text-text"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Usuário + ações */}
          <div className="flex items-center gap-3">
            {userName && (
              <span className="hidden text-sm text-text-muted sm:block">
                {userName}
              </span>
            )}
            <Link
              href="/trocar-senha"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-bg-surface2 hover:text-text ${
                pathname === "/trocar-senha" ? "bg-accent/10 text-accent" : ""
              }`}
            >
              <KeyRound size={15} />
              <span className="hidden sm:block">Trocar senha</span>
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-danger/8 hover:text-danger"
              >
                <LogOut size={15} />
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
