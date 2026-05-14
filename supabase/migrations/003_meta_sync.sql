-- ================================================================
-- 003_meta_sync.sql
-- Constraint única para upsert de campanhas + coluna de sync + cron
-- ================================================================

-- 1. Constraint única em campanhas para suporte a upsert via meta_campaign_id
--    Necessária para: upsert(rows, { onConflict: "cliente_id,meta_campaign_id" })
alter table public.campanhas
  add constraint campanhas_cliente_meta_campaign_uq
  unique (cliente_id, meta_campaign_id);

-- 2. Coluna de última sincronização no cliente
alter table public.clientes
  add column if not exists meta_last_synced_at timestamptz;

comment on column public.clientes.meta_last_synced_at is
  'Timestamp da última sincronização bem-sucedida com a Meta Ads API';

-- ================================================================
-- 3. Cron job diário às 3h (requer extensões pg_cron + pg_net)
--    Disponível no Supabase Pro/Team — ignorado silenciosamente no Free
-- ================================================================

do $$
begin
  create extension if not exists pg_cron with schema extensions;
  create extension if not exists pg_net  with schema extensions;

  -- Remove job existente se já foi criado anteriormente
  perform cron.unschedule('sync-meta-ads-daily')
    where exists (select 1 from cron.job where jobname = 'sync-meta-ads-daily');

  -- Cria o cron job: chama POST /api/meta/sync com sync_all=true às 3h UTC
  perform cron.schedule(
    'sync-meta-ads-daily',
    '0 3 * * *',
    $cron$
      select net.http_post(
        url        := current_setting('app.base_url', true) || '/api/meta/sync',
        headers    := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || coalesce(current_setting('app.cron_secret', true), '')
        ),
        body       := '{"sync_all": true}'::jsonb,
        timeout_milliseconds := 30000
      ) as request_id
    $cron$
  );
exception when others then
  raise notice 'pg_cron/pg_net não disponível (plano Free) — cron job ignorado: %', sqlerrm;
end;
$$;
