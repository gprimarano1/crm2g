-- ================================================================
-- 010_first_login.sql
-- Campo first_login na tabela perfis para forçar troca de senha
-- no primeiro acesso de usuários cliente/atendente
-- ================================================================

alter table public.perfis
  add column if not exists first_login boolean not null default true;

-- Usuários já existentes não precisam trocar a senha
update public.perfis set first_login = false;

comment on column public.perfis.first_login is
  'true enquanto o usuário não definiu sua própria senha. Redirecionado para /trocar-senha ao logar.';
