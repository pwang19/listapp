-- Schedules the daily-reminder function to run every hour at :05.
-- Run once in the SQL Editor after deploying supabase/functions/send-reminders.
-- Replace PASTE_CRON_SECRET_HERE with the same CRON_SECRET you set on the function.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Keep the secret in Vault rather than in the job definition.
select vault.create_secret('PASTE_CRON_SECRET_HERE', 'send_reminders_cron_secret')
where not exists (select 1 from vault.secrets where name = 'send_reminders_cron_secret');

select cron.schedule(
  'send-reminders',
  '5 * * * *',
  $$
  select net.http_post(
    url := 'https://yhiwujxrqfqupjoyezti.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets
                        where name = 'send_reminders_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
