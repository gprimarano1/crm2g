-- ================================================================
-- 011_metricas_v2.sql
-- Redesign completo da tabela metricas_manuais:
-- de agregado semanal → lançamentos individuais por data
-- ================================================================

-- Drop da tabela antiga (cascade remove triggers, indexes, policies)
drop table if exists public.metricas_manuais cascade;

-- ----------------------------------------------------------------
-- Nova tabela: um registro por lançamento (orcamento ou venda)
-- ----------------------------------------------------------------
create table public.metricas_manuais (
  id            uuid          primary key default gen_random_uuid(),
  cliente_id    uuid          not null references public.clientes(id) on delete cascade,
  tipo          text          not null check (tipo in ('orcamento', 'venda')),
  quantidade    integer       not null default 1 check (quantidade > 0),
  valor         numeric(12,2) not null default 0 check (valor >= 0),
  data_registro date          not null default current_date,
  observacao    text,
  created_at    timestamptz   not null default now()
);

comment on table  public.metricas_manuais is
  'Lançamentos individuais de orçamentos e vendas inseridos manualmente pela equipe';
comment on column public.metricas_manuais.tipo is
  '''orcamento'' = orçamento enviado ao cliente; ''venda'' = venda concluída';
comment on column public.metricas_manuais.quantidade is
  'Número de unidades do lançamento (mínimo 1)';
comment on column public.metricas_manuais.valor is
  'Valor monetário total do lançamento em R$';
comment on column public.metricas_manuais.data_registro is
  'Data de referência do lançamento (padrão: hoje)';

-- ----------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------
create index idx_metricas_cliente       on public.metricas_manuais(cliente_id);
create index idx_metricas_data_desc     on public.metricas_manuais(data_registro desc);
create index idx_metricas_cli_tipo_data on public.metricas_manuais(cliente_id, tipo, data_registro desc);

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------
alter table public.metricas_manuais enable row level security;

create policy "metricas: admin full access"
  on public.metricas_manuais for all
  using (exists (
    select 1 from public.perfis
    where perfis.id = auth.uid() and perfis.role = 'admin'
  ));

create policy "metricas: cliente lê próprias"
  on public.metricas_manuais for select
  using (exists (
    select 1 from public.perfis
    where perfis.id = auth.uid()
      and perfis.cliente_id = metricas_manuais.cliente_id
  ));
