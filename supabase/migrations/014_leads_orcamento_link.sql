-- ================================================================
-- 014_leads_orcamento_link.sql
-- Adiciona link público do orçamento ao lead (opcional)
-- ================================================================

alter table public.leads add column if not exists orcamento_link_url text;

comment on column public.leads.orcamento_link_url is 'Link público (página /orcamento/[slug]) ou URL externa do orçamento';
