// No directive — safe to import from both client and server components

export type MetricaTipo = "orcamento" | "venda";

export type MetricaManual = {
  id: string;
  cliente_id: string;
  tipo: MetricaTipo;
  quantidade: number;
  valor: number;
  data_registro: string;
  observacao: string | null;
  created_at: string;
};

export type MetricasAutomaticas = {
  orcamentos: { quantidade: number; valor: number };
  vendas: { quantidade: number; valor: number };
};

export type Totalizador = {
  quantidade: number;
  valor: number;
};

export type MetricasCombinadas = {
  automatico: MetricasAutomaticas;
  manual: { orcamentos: Totalizador; vendas: Totalizador };
  total: { orcamentos: Totalizador; vendas: Totalizador };
};
