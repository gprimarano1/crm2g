-- ================================================================
-- 012_campanhas_diarias.sql
-- Tabela de gastos diários por campanha para filtro por período
-- ================================================================

create table if not exists public.campanhas_diarias (
  id          uuid         primary key default gen_random_uuid(),
  campanha_id uuid         not null references public.campanhas(id) on delete cascade,
  cliente_id  uuid         not null references public.clientes(id)  on delete cascade,
  data        date         not null,
  gasto       numeric(12,2) not null default 0,
  impressoes  bigint       not null default 0,
  alcance     bigint       not null default 0,
  cliques     bigint       not null default 0,
  leads       integer      not null default 0,
  unique (campanha_id, data)
);

create index if not exists campanhas_diarias_cliente_data_idx
  on public.campanhas_diarias (cliente_id, data);

-- RLS: mesma política das campanhas (admin lê tudo, cliente lê o seu)
alter table public.campanhas_diarias enable row level security;

create policy "admin_all_campanhas_diarias" on public.campanhas_diarias
  for all using (
    exists (
      select 1 from public.perfis
      where perfis.id = auth.uid() and perfis.role = 'admin'
    )
  );

create policy "cliente_own_campanhas_diarias" on public.campanhas_diarias
  for select using (
    exists (
      select 1 from public.perfis
      where perfis.id = auth.uid()
        and perfis.cliente_id = campanhas_diarias.cliente_id
    )
  );
