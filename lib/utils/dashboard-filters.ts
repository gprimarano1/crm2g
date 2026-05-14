import type { DashboardFilters } from "@/lib/types/dashboard";

// ================================================================
// parseDashboardFilters — converte searchParams em DashboardFilters
// ================================================================

export function parseDashboardFilters(params: {
  cliente?:     string;
  periodo?:     string;
  data_inicio?: string;
  data_fim?:    string;
}): DashboardFilters {
  const { cliente, periodo = "7d", data_inicio, data_fim } = params;

  const now     = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs   = 24 * 60 * 60 * 1000;

  let dateFrom: Date;
  let dateTo = new Date(todayMs + dayMs);

  switch (periodo) {
    case "hoje":
      dateFrom = new Date(todayMs);
      break;
    case "14d":
      dateFrom = new Date(todayMs - 13 * dayMs);
      break;
    case "mes":
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "mes_passado":
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateTo   = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "custom":
      dateFrom = data_inicio ? new Date(data_inicio) : new Date(todayMs - 6 * dayMs);
      dateTo   = data_fim    ? new Date(new Date(data_fim).getTime() + dayMs) : new Date(todayMs + dayMs);
      break;
    default: // "7d"
      dateFrom = new Date(todayMs - 6 * dayMs);
  }

  return {
    clienteId: cliente && cliente !== "todos" ? cliente : undefined,
    dateFrom,
    dateTo,
  };
}

// ================================================================
// getPeriodoLabel — label legível para o período ativo
// ================================================================

export function getPeriodoLabel(
  periodo     = "7d",
  dataInicio?: string,
  dataFim?:    string,
): string {
  const fmtDate = (s: string) =>
    new Date(s + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  switch (periodo) {
    case "hoje":        return "hoje";
    case "7d":          return "últimos 7 dias";
    case "14d":         return "últimos 14 dias";
    case "mes":         return "este mês";
    case "mes_passado": return "mês passado";
    case "custom":
      if (dataInicio && dataFim) return `${fmtDate(dataInicio)} – ${fmtDate(dataFim)}`;
      return "período personalizado";
    default:            return "últimos 7 dias";
  }
}
