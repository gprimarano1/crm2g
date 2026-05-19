import type { DashboardFilters } from "@/lib/types/dashboard";

// ================================================================
// parseDashboardFilters — converte searchParams em DashboardFilters
// ================================================================

// Brasil: UTC-3 fixo (sem DST desde 2019)
const BR_OFFSET_HOURS = 3;
const BR_OFFSET_MS    = BR_OFFSET_HOURS * 60 * 60 * 1000;
const dayMs           = 24 * 60 * 60 * 1000;

// Cria um Date representando meia-noite Brasil (03:00 UTC) do dia (y, m, d) Brasil
function brMidnight(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d, BR_OFFSET_HOURS, 0, 0));
}

// Parseia "YYYY-MM-DD" como meia-noite Brasil daquele dia
function parseBrDateString(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return brMidnight(y, (m ?? 1) - 1, d ?? 1);
}

export function parseDashboardFilters(params: {
  cliente?:     string;
  periodo?:     string;
  data_inicio?: string;
  data_fim?:    string;
}): DashboardFilters {
  const { cliente, periodo = "7d", data_inicio, data_fim } = params;

  // Componentes de data no fuso de Brasil (independente do TZ do servidor)
  const nowBr = new Date(Date.now() - BR_OFFSET_MS);
  const yr    = nowBr.getUTCFullYear();
  const mo    = nowBr.getUTCMonth();
  const da    = nowBr.getUTCDate();

  const todayBr = brMidnight(yr, mo, da);

  let dateFrom: Date;
  let dateTo   = new Date(todayBr.getTime() + dayMs);

  switch (periodo) {
    case "hoje":
      dateFrom = todayBr;
      break;
    case "14d":
      dateFrom = new Date(todayBr.getTime() - 13 * dayMs);
      break;
    case "mes":
      dateFrom = brMidnight(yr, mo, 1);
      break;
    case "mes_passado":
      dateFrom = brMidnight(yr, mo - 1, 1);
      dateTo   = brMidnight(yr, mo, 1);
      break;
    case "custom": {
      dateFrom = data_inicio ? parseBrDateString(data_inicio) : new Date(todayBr.getTime() - 6 * dayMs);
      const fimBr = data_fim ? parseBrDateString(data_fim) : todayBr;
      dateTo = new Date(fimBr.getTime() + dayMs);
      break;
    }
    default: // "7d"
      dateFrom = new Date(todayBr.getTime() - 6 * dayMs);
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
