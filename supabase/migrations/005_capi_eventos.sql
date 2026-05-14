-- ================================================================
-- 005_capi_eventos.sql
-- Log de eventos enviados ao Meta Conversions API
-- ================================================================

create table if not exists public.capi_eventos (
  id             uuid        primary key default gen_random_uuid(),
  cliente_id     uuid        not null references public.clientes(id) on delete cascade,
  lead_id        uuid        references public.leads(id) on delete set null,
  event_name     text        not null,
  event_id       text        not null,
  pixel_id       text,
  status         text        not null default 'pendente'
                             check (status in ('sucesso', 'erro', 'pendente')),
  payload        jsonb,
  response       jsonb,
  error_message  text,
  created_at     timestamptz not null default now()
);

comment on table public.capi_eventos is
  'Log de eventos enviados ao Meta Conversions API por cliente';

create index if not exists idx_capi_eventos_cliente_id
  on public.capi_eventos(cliente_id);

create index if not exists idx_capi_eventos_lead_id
  on public.capi_eventos(lead_id)
  where lead_id is not null;

create index if not exists idx_capi_eventos_created_at
  on public.capi_eventos(created_at desc);

alter table public.capi_eventos enable row level security;

drop policy if exists "capi_eventos: admin full access" on public.capi_eventos;
create policy "capi_eventos: admin full access"
  on public.capi_eventos for all
  using (get_my_role() = 'admin');
