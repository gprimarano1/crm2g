-- ================================================================
-- 007_relatorios_status.sql
-- Coluna de status nos relatórios
-- ================================================================

alter table public.relatorios
  add column if not exists status text not null default 'gerado'
    check (status in ('gerado', 'enviado', 'visualizado'));

comment on column public.relatorios.status is
  'gerado = criado; enviado = link compartilhado; visualizado = cliente abriu';
