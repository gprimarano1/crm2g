-- ================================================================
-- 004_leads_history.sql
-- Status history para leads + campos adicionais
-- ================================================================

-- 1. Coluna meta_page_id em clientes (para matching de webhook)
alter table public.clientes
  add column if not exists meta_page_id text;

comment on column public.clientes.meta_page_id is
  'Facebook Page ID vinculada ao cliente, usado para matching no webhook de Lead Ads';

-- 2. Coluna valor_venda em leads (capturada em venda_fechada)
alter table public.leads
  add column if not exists valor_venda numeric(12,2);

comment on column public.leads.valor_venda is
  'Valor da venda quando status = venda_fechada (enviado ao CAPI como Purchase value)';

-- 3. Tabela de histórico de status
create table if not exists public.lead_status_history (
  id              uuid        primary key default gen_random_uuid(),
  lead_id         uuid        not null references public.leads(id) on delete cascade,
  status_anterior text,
  status_novo     text        not null,
  notas           text,
  created_at      timestamptz not null default now()
);

comment on table  public.lead_status_history is
  'Histórico de mudanças de status dos leads com timestamps';

-- Índices
create index if not exists idx_lead_history_lead_id
  on public.lead_status_history(lead_id);

create index if not exists idx_lead_history_created_at
  on public.lead_status_history(created_at desc);

-- RLS
alter table public.lead_status_history enable row level security;

create policy "lead_status_history: admin full access"
  on public.lead_status_history for all
  using (get_my_role() = 'admin');

create policy "lead_status_history: cliente lê próprios"
  on public.lead_status_history for select
  using (
    lead_id in (
      select id from public.leads where cliente_id = get_my_cliente_id()
    )
  );

-- 4. Índice para meta_page_id (lookup rápido no webhook)
create index if not exists idx_clientes_meta_page_id
  on public.clientes(meta_page_id)
  where meta_page_id is not null;
