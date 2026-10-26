// Daily reminders: subscribes this device to web push and records the
// subscription in Supabase, where the send-reminders edge function reads it.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const TABLE = 'push_subscriptions';

export const remindersConfigured = Boolean(VAPID_PUBLIC_KEY);

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const isAppleMobile = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** The service worker registration, or null (e.g. the dev server doesn't register one). */
async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) || null;
}

/** Why reminders can't be turned on in this context, or '' if they can. */
export function remindersUnavailableReason() {
  if (!remindersConfigured) return 'Reminders aren’t set up for this build.';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return isAppleMobile()
      ? 'On iPad and iPhone, reminders only work in the installed app: open Lists from its Home Screen icon.'
      : 'This browser doesn’t support notifications.';
  }
  return '';
}

/** Whether this device currently has a reminder subscription. */
export async function remindersEnabled() {
  if (remindersUnavailableReason()) return false;
  const registration = await getRegistration();
  return Boolean(registration && (await registration.pushManager.getSubscription()));
}

/** Must be called from a tap/click: Safari only shows the permission prompt for a user gesture. */
export async function enableReminders(supabase) {
  const unavailable = remindersUnavailableReason();
  if (unavailable) throw new Error(unavailable);

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notifications are blocked for Lists. Allow them in System Settings → Notifications, then try again.');
  }

  const registration = await getRegistration();
  if (!registration) throw new Error('Reminders work in the installed app, not the development server.');

  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY),
    }));
  const { endpoint, keys } = subscription.toJSON();

  const { error } = await supabase.from(TABLE).upsert(
    {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    { onConflict: 'endpoint' }
  );
  if (error) {
    await subscription.unsubscribe();
    throw error;
  }
}

export async function disableReminders(supabase) {
  const registration = await getRegistration();
  const subscription = registration && (await registration.pushManager.getSubscription());
  if (!subscription) return;
  const { error } = await supabase.from(TABLE).delete().eq('endpoint', subscription.endpoint);
  if (error) throw error;
  await subscription.unsubscribe();
}
