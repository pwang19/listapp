// Hourly job (see supabase/cron.sql): sends each subscribed device its daily 8am
// summary of items due today and overdue. Deploy with:
//   supabase functions deploy send-reminders --no-verify-jwt
// Secrets: CRON_SECRET, VAPID_KEYS (JSON from exportVapidKeys), VAPID_CONTACT (mailto:).
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as webpush from 'jsr:@negrel/webpush@0.5.0';
import { buildReminder, reminderDateFor } from './reminder.js';

const TWELVE_HOURS = 12 * 60 * 60;

// Newer projects expose secret keys as JSON; older ones only the legacy service role key.
function serviceKey(): string {
  try {
    const key = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default;
    if (key) return key;
  } catch {
    // fall through to the legacy key
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}

Deno.serve(async (req) => {
  // --no-verify-jwt makes this URL public, so a shared secret gates it.
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return new Response('Forbidden', { status: 403 });
  }
  const force = new URL(req.url).searchParams.has('force');

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey(), {
    auth: { persistSession: false },
  });
  const vapidKeys = await webpush.importVapidKeys(JSON.parse(Deno.env.get('VAPID_KEYS')!), {
    extractable: false,
  });
  const server = await webpush.ApplicationServer.new({
    contactInformation: Deno.env.get('VAPID_CONTACT') ?? 'mailto:admin@example.com',
    vapidKeys,
  });

  const { data: subscriptions, error } = await supabase.from('push_subscriptions').select('*');
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const now = new Date();
  const docs = new Map<string, unknown>();
  const report = { sent: 0, nothingDue: 0, notDue: 0, removed: 0, failed: 0 };

  for (const sub of subscriptions ?? []) {
    let today: string | null;
    try {
      today = reminderDateFor(sub, now, force);
    } catch {
      report.failed++; // unknown time zone
      continue;
    }
    if (!today) {
      report.notDue++;
      continue;
    }

    if (!docs.has(sub.user_id)) {
      const { data } = await supabase
        .from('user_state')
        .select('doc')
        .eq('user_id', sub.user_id)
        .maybeSingle();
      docs.set(sub.user_id, data?.doc ?? null);
    }

    const message = buildReminder(docs.get(sub.user_id), today);
    if (message) {
      try {
        await server
          .subscribe({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } })
          .pushTextMessage(JSON.stringify(message), { ttl: TWELVE_HOURS, topic: 'daily-reminder' });
        report.sent++;
      } catch (err) {
        if (err instanceof webpush.PushMessageError && (err.isGone() || err.response.status === 404)) {
          // The browser unsubscribed or the app was removed.
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          report.removed++;
        } else {
          // Left unmarked, so the next hourly run in the morning window retries.
          console.error('push failed', sub.endpoint, String(err));
          report.failed++;
        }
        continue;
      }
    } else {
      report.nothingDue++;
    }

    if (!force) {
      await supabase.from('push_subscriptions').update({ last_sent_on: today }).eq('endpoint', sub.endpoint);
    }
  }

  return Response.json(report);
});
