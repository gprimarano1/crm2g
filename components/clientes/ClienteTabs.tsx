"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "visao-geral",   label: "Visão Geral" },
  { key: "campanhas",     label: "Campanhas" },
  { key: "leads",         label: "Leads" },
  { key: "metricas",      label: "Métricas" },
  { key: "insights",      label: "Insights IA" },
  { key: "capi",          label: "CAPI" },
  { key: "configuracoes", label: "Configurações" },
];

interface ClienteTabsProps {
  clienteId: string;
  activeTab: string;
}

export function ClienteTabs({ clienteId, activeTab }: ClienteTabsProps) {
  const searchParams = useSearchParams();

  function buildHref(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    return `/clientes/${clienteId}?${params.toString()}`;
  }

  return (
    <div className="border-b border-bg-border">
      <nav className="flex gap-0 px-6 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={buildHref(tab.key)}
              className={cn(
                "relative flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "text-accent"
                  : "text-text-muted hover:text-text"
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
