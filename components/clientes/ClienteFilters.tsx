"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "pausado", label: "Pausados" },
  { value: "encerrado", label: "Encerrados" },
];

export function ClienteFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "todos";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val && val !== "todos") {
          params.set(key, val);
        } else {
          params.delete(key);
        }
      });
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Campo de busca */}
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
        />
        <input
          type="search"
          placeholder="Buscar cliente..."
          defaultValue={q}
          onChange={(e) => updateParams({ q: e.target.value || null })}
          className={cn(
            "h-9 w-56 rounded-xl border border-bg-border bg-bg-surface2 pl-9 pr-9 text-sm text-text placeholder:text-text-subtle outline-none transition-all",
            "focus:border-accent focus:ring-2 focus:ring-accent/15",
            isPending && "opacity-70"
          )}
        />
        {q && (
          <button
            onClick={() => updateParams({ q: null })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filtros de status */}
      <div className="flex items-center gap-1 rounded-xl border border-bg-border bg-bg-surface2 p-0.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => updateParams({ status: f.value })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              status === f.value
                ? "bg-accent text-white shadow-glow-sm"
                : "text-text-muted hover:text-text"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
