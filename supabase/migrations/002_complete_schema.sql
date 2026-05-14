-- ================================================================
-- CRM 2G — Schema Completo v2
-- Gerado em: 2026-05-13
-- Rodar no Supabase SQL Editor (substitui schema inicial)
-- ================================================================


-- ================================================================
-- 0. LIMPEZA — drop tabelas da v1 se existirem
-- ================================================================
drop table if exists public.perfis          cascade;
drop table if exists public.relatorios      cascade;
drop table if exists public.propostas       cascade;
drop table if exists public.campanhas       cascade;
drop table if exists public.leads           cascade;
drop table if exists public.clientes        cascade;

-- drop funções antigas se existirem
drop function if exists public.get_my_role();
drop function if exists public.get_my_cliente_id();
drop function if exists public.handle_updated_at();
drop function if exists public.handle_new_user();


-- ================================================================
-- 1. EXTENSÕES
-- ================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "pgcrypto";


-- ================================================================
-- 2. FUNÇÃO: updated_at automático
-- ================================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ================================================================
-- 3. HELPERS RLS (security definer → bypassam o próprio RLS)
-- ================================================================

-- Retorna o role do usuário autenticado
-- plpgsql: validação de tabelas adiada para execução (não compilação)
create or replace function public.get_my_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return (select role from public.perfis where id = auth.uid());
end;
$$;

-- Retorna o cliente_id vinculado ao usuário autenticado
create or replace function public.get_my_cliente_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return (select cliente_id from public.perfis where id = auth.uid());
end;
$$;


-- ================================================================
-- 4. TABELAS
-- (ordem respeitando dependências de FK)
-- ================================================================


-- ----------------------------------------------------------------
-- 4.1 clientes
-- ----------------------------------------------------------------
create table public.clientes (
  id                    uuid        primary key default gen_random_uuid(),
  nome_empresa          text        not null,
  responsavel           text        not null,
  telefone              text,
  email                 text,
  segmento              text,
  status                text        not null default 'ativo'
                                    check (status in ('ativo', 'pausado', 'encerrado')),
  data_inicio           date,
  -- Meta Ads
  meta_ad_account_id    text,
  meta_pixel_id         text,
  meta_capi_token       text,
  meta_access_token     text,
  -- Outros
  whatsapp_referencia   text,
  observacoes           text,
  -- Timestamps
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table  public.clientes                  is 'Clientes atendidos pela agência';
comment on column public.clientes.meta_capi_token  is 'Token do sistema para Conversions API';
comment on column public.clientes.meta_access_token is 'Access token de sistema Meta (Business Manager)';


-- ----------------------------------------------------------------
-- 4.2 profiles (vinculado a auth.users)
-- ----------------------------------------------------------------
create table public.perfis (
  id         uuid        primary key references auth.users(id) on delete cascade,
  role       text        not null default 'admin'
                         check (role in ('admin', 'cliente')),
  nome       text,
  email      text,
  cliente_id uuid        references public.clientes(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on column public.perfis.role       is 'admin = equipe interna; cliente = acesso ao painel do cliente';
comment on column public.perfis.cliente_id is 'Preenchido somente quando role = cliente';


-- ----------------------------------------------------------------
-- 4.3 campanhas
-- ----------------------------------------------------------------
create table public.campanhas (
  id               uuid        primary key default gen_random_uuid(),
  cliente_id       uuid        not null references public.clientes(id) on delete cascade,
  -- IDs Meta (nullable — pode ser cadastrada manualmente)
  meta_campaign_id text,
  meta_adset_id    text,
  -- Identificação
  nome             text        not null,
  objetivo         text,
  status           text        not null default 'ativa'
                               check (status in ('ativa', 'pausada', 'encerrada', 'rascunho')),
  -- Financeiro
  orcamento_diario numeric(12,2),
  gasto_total      numeric(12,2) not null default 0,
  -- Alcance
  impressoes       bigint      not null default 0,
  alcance          bigint      not null default 0,
  frequencia       numeric(8,4) not null default 0,
  -- Engajamento
  cliques          bigint      not null default 0,
  ctr              numeric(8,4) not null default 0,   -- ex: 1.2500 = 1,25%
  cpc              numeric(12,2) not null default 0,
  cpm              numeric(12,2) not null default 0,
  -- Resultados
  leads            integer     not null default 0,
  mensagens        integer     not null default 0,
  visitas_site     integer     not null default 0,
  visitas_perfil   integer     not null default 0,
  seguidores       integer     not null default 0,
  cpl_medio        numeric(12,2) not null default 0,
  -- Período de veiculação
  periodo_inicio   date,
  periodo_fim      date,
  -- Sync
  synced_at        timestamptz,
  created_at       timestamptz not null default now()
);

comment on table  public.campanhas           is 'Campanhas Meta Ads dos clientes (sync + manual)';
comment on column public.campanhas.ctr       is 'Click-through rate em percentual (ex: 1.25 = 1,25%)';
comment on column public.campanhas.synced_at is 'Última sincronização com a API do Meta';


-- ----------------------------------------------------------------
-- 4.4 leads
-- ----------------------------------------------------------------
create table public.leads (
  id               uuid        primary key default gen_random_uuid(),
  cliente_id       uuid        not null references public.clientes(id) on delete cascade,
  -- Identificador Meta (único por plataforma)
  meta_lead_id     text        unique,
  -- Dados do lead
  nome             text        not null,
  telefone         text,
  email            text,
  -- Origem
  campanha_origem  text,
  conjunto_origem  text,
  formulario_id    text,
  -- Funil
  status           text        not null default 'novo'
                               check (status in (
                                 'novo',
                                 'em_contato',
                                 'qualificado',
                                 'orcamento_enviado',
                                 'venda_fechada',
                                 'perdido'
                               )),
  capi_enviado     boolean     not null default false,
  notas            text,
  -- Timestamps de funil
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  contacted_at     timestamptz,
  qualified_at     timestamptz,
  sold_at          timestamptz
);

comment on table  public.leads              is 'Leads captados via Meta Lead Ads ou inseridos manualmente';
comment on column public.leads.capi_enviado is 'Indica se o evento de conversão foi enviado à CAPI do Meta';


-- ----------------------------------------------------------------
-- 4.5 metricas_manuais
-- ----------------------------------------------------------------
create table public.metricas_manuais (
  id                    uuid        primary key default gen_random_uuid(),
  cliente_id            uuid        not null references public.clientes(id) on delete cascade,
  semana_inicio         date        not null,
  semana_fim            date        not null,
  orcamentos_quantidade integer     not null default 0,
  orcamentos_valor      numeric(12,2) not null default 0,
  vendas_quantidade     integer     not null default 0,
  vendas_valor          numeric(12,2) not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Uma entrada por semana por cliente
  unique (cliente_id, semana_inicio)
);

comment on table public.metricas_manuais is 'Métricas de orçamentos e vendas inseridas manualmente pela equipe';


-- ----------------------------------------------------------------
-- 4.6 capi_eventos
-- ----------------------------------------------------------------
create table public.capi_eventos (
  id         uuid        primary key default gen_random_uuid(),
  cliente_id uuid        not null references public.clientes(id) on delete cascade,
  lead_id    uuid        references public.leads(id) on delete set null,
  event_name text        not null,
  event_time bigint      not null,  -- unix timestamp (segundos)
  event_id   text        unique not null,
  payload    jsonb       not null default '{}',
  status     text        not null default 'enviado'
                         check (status in ('enviado', 'erro')),
  response   jsonb       not null default '{}',
  created_at timestamptz not null default now()
);

comment on table  public.capi_eventos            is 'Log de eventos enviados à Conversions API do Meta';
comment on column public.capi_eventos.event_id   is 'ID único do evento (deduplicação no Meta)';
comment on column public.capi_eventos.event_time is 'Timestamp Unix do momento do evento';


-- ----------------------------------------------------------------
-- 4.7 insights
-- ----------------------------------------------------------------
create table public.insights (
  id             uuid        primary key default gen_random_uuid(),
  cliente_id     uuid        not null references public.clientes(id) on delete cascade,
  periodo_inicio date        not null,
  periodo_fim    date        not null,
  conteudo       text        not null,   -- análise gerada pelo Claude
  editado        boolean     not null default false,
  created_at     timestamptz not null default now()
);

comment on table  public.insights        is 'Análises de IA geradas pelo Claude para cada cliente/período';
comment on column public.insights.editado is 'True se o insight foi editado manualmente após geração';


-- ----------------------------------------------------------------
-- 4.8 relatorios
-- ----------------------------------------------------------------
create table public.relatorios (
  id             uuid        primary key default gen_random_uuid(),
  cliente_id     uuid        not null references public.clientes(id) on delete cascade,
  slug           text        unique not null,
  periodo_inicio date        not null,
  periodo_fim    date        not null,
  titulo         text        not null,
  dados          jsonb       not null default '{}',  -- snapshot de métricas
  insights_id    uuid        references public.insights(id) on delete set null,
  expira_em      timestamptz,
  visualizacoes  integer     not null default 0,
  created_at     timestamptz not null default now()
);

comment on table  public.relatorios           is 'Relatórios de performance compartilháveis com clientes';
comment on column public.relatorios.slug      is 'Token URL-safe para acesso público ao relatório';
comment on column public.relatorios.dados     is 'Snapshot das métricas no momento da geração';
comment on column public.relatorios.expira_em is 'Se preenchido, link expira nesta data';


-- ----------------------------------------------------------------
-- 4.9 propostas
-- ----------------------------------------------------------------
create table public.propostas (
  id                uuid        primary key default gen_random_uuid(),
  cliente_prospecto varchar(255) not null,   -- nome livre, não FK
  empresa           text,
  segmento          text,
  slug              text        unique not null,
  status            text        not null default 'rascunho'
                                check (status in (
                                  'rascunho',
                                  'enviada',
                                  'visualizada',
                                  'aceita',
                                  'recusada'
                                )),
  -- Conteúdo
  servicos          jsonb       not null default '[]',
  kpis              jsonb       not null default '[]',
  valor_total       numeric(12,2),
  prazo_contrato    text,
  observacoes       text,
  logo_url          text,
  -- Rastreamento
  visualizada_em    timestamptz,
  aceita_em         timestamptz,
  recusada_em       timestamptz,
  motivo_recusa     text,
  -- Timestamps
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table  public.propostas                  is 'Propostas comerciais enviadas a prospectos';
comment on column public.propostas.cliente_prospecto is 'Nome do prospecto (campo livre, sem FK)';
comment on column public.propostas.servicos          is 'Array de objetos: [{nome, descricao, valor}]';
comment on column public.propostas.kpis              is 'Array de KPIs prometidos: [{metrica, meta}]';
comment on column public.propostas.slug              is 'Token URL-safe para acesso público à proposta';


-- ----------------------------------------------------------------
-- 4.10 proposta_duvidas
-- ----------------------------------------------------------------
create table public.proposta_duvidas (
  id               uuid        primary key default gen_random_uuid(),
  proposta_id      uuid        not null references public.propostas(id) on delete cascade,
  texto            text        not null,
  respondida       boolean     not null default false,
  resposta_interna text,        -- visível apenas ao admin no CRM
  created_at       timestamptz not null default now()
);

comment on table  public.proposta_duvidas                  is 'Dúvidas enviadas pelo prospecto na página da proposta';
comment on column public.proposta_duvidas.resposta_interna is 'Resposta da equipe — visível só no CRM, não na proposta pública';


-- ================================================================
-- 5. TRIGGERS: updated_at
-- ================================================================
create trigger trg_clientes_updated_at
  before update on public.clientes
  for each row execute function public.handle_updated_at();

create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

create trigger trg_metricas_manuais_updated_at
  before update on public.metricas_manuais
  for each row execute function public.handle_updated_at();

create trigger trg_propostas_updated_at
  before update on public.propostas
  for each row execute function public.handle_updated_at();


-- ================================================================
-- 6. TRIGGER: auto-criar profile ao cadastrar usuário
-- ================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, email, nome)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'nome',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ================================================================
-- 7. ÍNDICES
-- ================================================================

-- clientes
create index idx_clientes_status     on public.clientes(status);
create index idx_clientes_created_at on public.clientes(created_at desc);
create index idx_clientes_nome_trgm  on public.clientes using gin (nome_empresa gin_trgm_ops);

-- profiles
create index idx_perfis_role       on public.perfis(role);
create index idx_perfis_cliente_id on public.perfis(cliente_id);

-- campanhas
create index idx_campanhas_cliente_id   on public.campanhas(cliente_id);
create index idx_campanhas_status       on public.campanhas(status);
create index idx_campanhas_meta_camp_id on public.campanhas(meta_campaign_id);
create index idx_campanhas_created_at   on public.campanhas(created_at desc);
create index idx_campanhas_periodo      on public.campanhas(periodo_inicio desc, periodo_fim desc);

-- leads
create index idx_leads_cliente_id   on public.leads(cliente_id);
create index idx_leads_status       on public.leads(status);
create index idx_leads_created_at   on public.leads(created_at desc);
create index idx_leads_campanha     on public.leads(campanha_origem);
create index idx_leads_nome_trgm    on public.leads using gin (nome gin_trgm_ops);

-- metricas_manuais
create index idx_metricas_cliente_id  on public.metricas_manuais(cliente_id);
create index idx_metricas_semana      on public.metricas_manuais(semana_inicio desc);

-- capi_eventos
create index idx_capi_cliente_id  on public.capi_eventos(cliente_id);
create index idx_capi_lead_id     on public.capi_eventos(lead_id);
create index idx_capi_event_name  on public.capi_eventos(event_name);
create index idx_capi_status      on public.capi_eventos(status);
create index idx_capi_created_at  on public.capi_eventos(created_at desc);

-- insights
create index idx_insights_cliente_id on public.insights(cliente_id);
create index idx_insights_periodo    on public.insights(periodo_inicio desc);

-- relatorios
create index idx_relatorios_cliente_id on public.relatorios(cliente_id);
create index idx_relatorios_slug       on public.relatorios(slug);
create index idx_relatorios_created_at on public.relatorios(created_at desc);

-- propostas
create index idx_propostas_slug       on public.propostas(slug);
create index idx_propostas_status     on public.propostas(status);
create index idx_propostas_created_at on public.propostas(created_at desc);
create index idx_propostas_prospecto  on public.propostas using gin (cliente_prospecto gin_trgm_ops);

-- proposta_duvidas
create index idx_duvidas_proposta_id on public.proposta_duvidas(proposta_id);
create index idx_duvidas_respondida  on public.proposta_duvidas(respondida);


-- ================================================================
-- 8. ROW LEVEL SECURITY
-- ================================================================
alter table public.clientes         enable row level security;
alter table public.perfis         enable row level security;
alter table public.campanhas        enable row level security;
alter table public.leads            enable row level security;
alter table public.metricas_manuais enable row level security;
alter table public.capi_eventos     enable row level security;
alter table public.insights         enable row level security;
alter table public.relatorios       enable row level security;
alter table public.propostas        enable row level security;
alter table public.proposta_duvidas enable row level security;


-- ----------------------------------------------------------------
-- 8.1 profiles
-- ----------------------------------------------------------------
-- Usuário lê e atualiza apenas o próprio perfil
create policy "perfis: leitura própria"
  on public.perfis for select
  using (id = auth.uid());

create policy "perfis: update próprio"
  on public.perfis for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admin lê todos os profiles
create policy "perfis: admin lê todos"
  on public.perfis for select
  using (public.get_my_role() = 'admin');

-- Admin gerencia todos os profiles
create policy "perfis: admin gerencia"
  on public.perfis for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');


-- ----------------------------------------------------------------
-- 8.2 clientes
-- ----------------------------------------------------------------
create policy "clientes: admin full access"
  on public.clientes for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Cliente vê apenas o próprio registro
create policy "clientes: cliente lê próprio"
  on public.clientes for select
  using (id = public.get_my_cliente_id());


-- ----------------------------------------------------------------
-- 8.3 campanhas
-- ----------------------------------------------------------------
create policy "campanhas: admin full access"
  on public.campanhas for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create policy "campanhas: cliente lê próprias"
  on public.campanhas for select
  using (cliente_id = public.get_my_cliente_id());


-- ----------------------------------------------------------------
-- 8.4 leads
-- ----------------------------------------------------------------
create policy "leads: admin full access"
  on public.leads for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create policy "leads: cliente lê próprios"
  on public.leads for select
  using (cliente_id = public.get_my_cliente_id());


-- ----------------------------------------------------------------
-- 8.5 metricas_manuais
-- ----------------------------------------------------------------
create policy "metricas: admin full access"
  on public.metricas_manuais for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create policy "metricas: cliente lê próprias"
  on public.metricas_manuais for select
  using (cliente_id = public.get_my_cliente_id());


-- ----------------------------------------------------------------
-- 8.6 capi_eventos (apenas admin)
-- ----------------------------------------------------------------
create policy "capi_eventos: admin full access"
  on public.capi_eventos for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Service role (API routes) insere eventos sem passar pelo RLS do usuário
-- Usar supabaseAdmin (SERVICE_ROLE_KEY) nas API routes de CAPI


-- ----------------------------------------------------------------
-- 8.7 insights
-- ----------------------------------------------------------------
create policy "insights: admin full access"
  on public.insights for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create policy "insights: cliente lê próprios"
  on public.insights for select
  using (cliente_id = public.get_my_cliente_id());


-- ----------------------------------------------------------------
-- 8.8 relatorios
-- ----------------------------------------------------------------
create policy "relatorios: admin full access"
  on public.relatorios for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create policy "relatorios: cliente lê próprios"
  on public.relatorios for select
  using (cliente_id = public.get_my_cliente_id());

-- Qualquer pessoa com o link pode ver (slug = token de acesso)
-- Bloqueia automaticamente se expirado
create policy "relatorios: público via slug (não expirado)"
  on public.relatorios for select
  using (
    (expira_em is null or expira_em > now())
  );


-- ----------------------------------------------------------------
-- 8.9 propostas
-- ----------------------------------------------------------------
create policy "propostas: admin full access"
  on public.propostas for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Público pode visualizar propostas não em rascunho (slug = token)
create policy "propostas: público lê enviadas/aceitas"
  on public.propostas for select
  using (status in ('enviada', 'visualizada', 'aceita'));

-- Público pode atualizar status via API route (aceitar/recusar)
-- Usando service role nas API routes — sem policy de update anon aqui


-- ----------------------------------------------------------------
-- 8.10 proposta_duvidas
-- ----------------------------------------------------------------
create policy "duvidas: admin full access"
  on public.proposta_duvidas for all
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Público pode ler dúvidas de propostas públicas
create policy "duvidas: público lê"
  on public.proposta_duvidas for select
  using (
    exists (
      select 1 from public.propostas p
      where p.id = proposta_id
        and p.status in ('enviada', 'visualizada', 'aceita')
    )
  );

-- Público pode enviar dúvidas em propostas públicas (via anon key)
create policy "duvidas: público insere"
  on public.proposta_duvidas for insert
  with check (
    exists (
      select 1 from public.propostas p
      where p.id = proposta_id
        and p.status in ('enviada', 'visualizada', 'aceita')
    )
  );


-- ================================================================
-- 9. REALTIME
-- ================================================================
-- Leads: notificação em tempo real para o admin quando chega novo lead
alter publication supabase_realtime add table public.leads;

-- Dúvidas de proposta: notificação ao admin quando prospecto envia pergunta
alter publication supabase_realtime add table public.proposta_duvidas;


-- ================================================================
-- 10. DADOS INICIAIS (seed mínimo)
-- ================================================================

-- Nenhum seed automático — o primeiro usuário criado via Supabase Auth
-- terá o profile criado pelo trigger handle_new_user com role 'admin'.
-- Para promover um usuário a admin, execute:
--
--   update public.perfis set role = 'admin' where email = 'seu@email.com';
--
-- Para vincular um cliente a um usuário:
--
--   update public.perfis
--   set role = 'cliente', cliente_id = '<uuid-do-cliente>'
--   where email = 'cliente@email.com';


-- ================================================================
-- FIM DA MIGRATION
-- ================================================================
