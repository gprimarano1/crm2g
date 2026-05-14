-- ================================================================
-- 008_propostas — módulo de propostas comerciais (schema v2)
-- Recria as tabelas com schema atualizado (substitui o schema da 002)
-- ================================================================

drop table if exists public.proposta_duvidas cascade;
drop table if exists public.propostas        cascade;

create table public.propostas (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text unique not null,
  prospect_nome          text not null,
  empresa                text not null,
  segmento               text,
  logo_url               text,
  servicos               jsonb not null default '[]',
  kpis                   jsonb not null default '[]',
  prazo_contrato         text,
  mensagem_personalizada text,
  diferenciais           jsonb not null default '[]',
  status                 text not null default 'pendente'
                         check (status in ('pendente', 'visualizada', 'aceita', 'recusada')),
  visualizada_em         timestamptz,
  aceita_em              timestamptz,
  recusada_em            timestamptz,
  motivo_recusa          text,
  created_at             timestamptz default now()
);

create table public.proposta_duvidas (
  id            uuid primary key default gen_random_uuid(),
  proposta_id   uuid references public.propostas(id) on delete cascade not null,
  texto         text not null,
  resposta      text,
  respondida_em timestamptz,
  created_at    timestamptz default now()
);

-- RLS
alter table public.propostas       enable row level security;
alter table public.proposta_duvidas enable row level security;

-- Admins: full access
create policy "admin_all_propostas" on public.propostas
  for all using (auth.role() = 'authenticated');

-- Public: read (for public proposal page via adminClient bypass)
create policy "public_read_propostas" on public.propostas
  for select using (true);

-- Admins: full access to dúvidas
create policy "admin_all_duvidas" on public.proposta_duvidas
  for all using (auth.role() = 'authenticated');

-- Public: insert (submit questions from public page)
create policy "public_insert_duvidas" on public.proposta_duvidas
  for insert with check (true);

-- Indexes
create index idx_propostas_slug   on public.propostas(slug);
create index idx_propostas_status on public.propostas(status, created_at desc);
create index idx_duvidas_proposta on public.proposta_duvidas(proposta_id, created_at desc);
create index idx_duvidas_pendentes on public.proposta_duvidas(proposta_id) where respondida_em is null;

-- Note: create storage bucket "propostas-logos" in Supabase Dashboard
-- with public read access to serve uploaded logos.
