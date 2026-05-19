-- ================================================================
-- 013_orcamentos — orçamentos comerciais Full House
-- ================================================================

drop table if exists public.orcamentos cascade;

create table public.orcamentos (
  id                uuid primary key default gen_random_uuid(),
  cliente_id        uuid references public.clientes(id) on delete cascade not null,
  slug              text unique not null,
  numero            text,
  cliente_nome      text not null,
  cliente_email     text,
  cliente_telefone  text,
  data_emissao      date not null default current_date,
  data_validade     date not null,
  produtos          jsonb not null default '[]',
  formas_pagamento  text,
  observacoes       text,
  total             numeric(12,2) not null default 0,
  status            text not null default 'rascunho'
                    check (status in ('rascunho', 'enviado', 'visualizado', 'aceito', 'recusado')),
  visualizado_em    timestamptz,
  aceito_em         timestamptz,
  recusado_em       timestamptz,
  visualizacoes     int not null default 0,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists idx_orcamentos_cliente   on public.orcamentos(cliente_id, created_at desc);
create index if not exists idx_orcamentos_slug      on public.orcamentos(slug);
create index if not exists idx_orcamentos_status    on public.orcamentos(status, created_at desc);
create index if not exists idx_orcamentos_validade  on public.orcamentos(data_validade);

-- trigger de updated_at (reusa função existente)
drop trigger if exists trg_orcamentos_updated_at on public.orcamentos;
create trigger trg_orcamentos_updated_at
  before update on public.orcamentos
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.orcamentos enable row level security;

drop policy if exists "orcamentos: admin full access" on public.orcamentos;
create policy "orcamentos: admin full access"
  on public.orcamentos for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

drop policy if exists "orcamentos: cliente full sobre proprios" on public.orcamentos;
create policy "orcamentos: cliente full sobre proprios"
  on public.orcamentos for all
  using (cliente_id = public.get_my_cliente_id())
  with check (cliente_id = public.get_my_cliente_id());

-- Note: bucket "orcamentos-imagens" deve ser criado no Dashboard do Supabase
-- (público para read; uploads autenticados).
