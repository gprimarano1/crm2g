-- ================================================================
-- 009_leads_atendimento.sql
-- Kanban de atendimento: novos campos nos leads + fix capi_eventos
-- ================================================================

-- 1. Fix capi_eventos: adiciona colunas ausentes da migration 005
alter table public.capi_eventos add column if not exists pixel_id       text;
alter table public.capi_eventos add column if not exists error_message  text;

-- Corrige status legado 'enviado' → 'sucesso'
update public.capi_eventos set status = 'sucesso' where status = 'enviado';

-- Substitui constraint de status
do $$
begin
  alter table public.capi_eventos drop constraint if exists capi_eventos_status_check;
exception when undefined_object then null;
end;
$$;

alter table public.capi_eventos
  add constraint capi_eventos_status_check
  check (status in ('sucesso', 'erro', 'pendente'));

-- 2. Novos campos no fluxo de atendimento
alter table public.leads add column if not exists atendente_nome        text;
alter table public.leads add column if not exists atendente_assigned_at timestamptz;
alter table public.leads add column if not exists desqualificado_motivo text;
alter table public.leads add column if not exists orcamento_valor       numeric(12,2);
alter table public.leads add column if not exists orcamento_arquivo_url text;
alter table public.leads add column if not exists venda_pedido_url      text;

comment on column public.leads.atendente_nome        is 'Nome do atendente que assumiu este lead';
comment on column public.leads.atendente_assigned_at is 'Quando o atendente assumiu o lead';
comment on column public.leads.desqualificado_motivo is 'Motivo de desqualificação do lead';
comment on column public.leads.orcamento_valor       is 'Valor do orçamento enviado (R$)';
comment on column public.leads.orcamento_arquivo_url is 'URL do arquivo de orçamento (Supabase Storage)';
comment on column public.leads.venda_pedido_url      is 'URL do pedido de venda (Supabase Storage)';

-- 3. Índice composto para kanban
create index if not exists idx_leads_cliente_status_kanban
  on public.leads(cliente_id, status, created_at desc);

-- ================================================================
-- STORAGE BUCKET: leads-arquivos
-- Criado automaticamente pela server action uploadLeadArquivo.
-- Ou manualmente: Dashboard → Storage → New bucket → leads-arquivos → Public
-- ================================================================
