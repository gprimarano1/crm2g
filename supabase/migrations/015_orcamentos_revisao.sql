-- ================================================================
-- 015_orcamentos_revisao.sql
-- Rastreia revisões/clones de orçamentos
-- ================================================================

alter table public.orcamentos
  add column if not exists revisao_de     uuid references public.orcamentos(id) on delete set null,
  add column if not exists revisao_numero int  not null default 0;

create index if not exists idx_orcamentos_revisao_de on public.orcamentos(revisao_de);

comment on column public.orcamentos.revisao_de     is 'ID do orçamento raiz (original) — null quando é o próprio original';
comment on column public.orcamentos.revisao_numero is 'Sequência da revisão dentro do mesmo raiz: 0 = original, 1 = R1, 2 = R2, …';
