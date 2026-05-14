// Tipos compartilhados do dashboard — sem "use server" ou "use client"
// Seguro para importar em componentes cliente E servidor.

export type DashboardKPIs = {
  investimento_total: number;
  leads_total:        number;
  cpl_medio:          number;
  vendas_fechadas:    number;
  receita_total:      number;
};

export type WeeklyPoint = {
  label:  string;
  semana: string;
  leads:  number;
  vendas: number;
};

export type AlertSeverity = "warning" | "critical";
export type AlertType     = "frequencia" | "ctr" | "orcamento";

export type DashboardAlert = {
  type:          AlertType;
  severity:      AlertSeverity;
  title:         string;
  message:       string;
  clienteNome:   string;
  campanhaNome?: string;
};

export type ClienteMiniKPI = {
  id:           string;
  nome_empresa: string;
  status:       string;
  leads_mes:    number;
  investimento: number;
  vendas:       number;
  cpl:          number;
};

export type DashboardData = {
  kpis:     DashboardKPIs;
  chart:    WeeklyPoint[];
  alerts:   DashboardAlert[];
  clientes: ClienteMiniKPI[];
};

export interface DashboardFilters {
  clienteId?: string;
  dateFrom:   Date;
  dateTo:     Date;
}
