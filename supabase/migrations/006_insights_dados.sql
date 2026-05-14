-- ================================================================
-- 006_insights_dados.sql
-- Campos estruturados para insights gerados pela IA
-- ================================================================

alter table public.insights
  add column if not exists dados   jsonb,
  add column if not exists periodo text;

comment on column public.insights.dados   is 'JSON estruturado gerado pelo Claude (destaques, atencao, alertas, oportunidades, resumo_executivo, proximos_passos)';
comment on column public.insights.periodo is 'Período analisado: 7d | 30d | mes | todos';

create index if not exists idx_insights_cliente_created
  on public.insights(cliente_id, created_at desc);
