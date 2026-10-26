import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// 65-byte uncompressed P-256 point, base64url (what the VAPID public key looks like).
const KEY = 'BOn1x9u5r0Qw0cjqU9H5cJqvT8Yt8b8eK1E6m1oZ0E7m0x2Jv2B3m0pZcQyYQ9VqvN8v8b8K1E6m1oZ0E7m0x2I';

function fakeSupabase({ error = null } = {}) {
  const calls = [];
  return {
    calls,
    from: (table) => ({
      upsert: async (row, opts) => (calls.push({ op: 'upsert', table, row, opts }), { error }),
      delete: () => ({ eq: async (col, val) => (calls.push({ op: 'delete', table, col, val }), { error }) }),
    }),
  };
}

function fakeBrowser({ permission = 'granted', existing = null } = {}) {
  const subscription = existing || {
    endpoint: 'https://web.push.apple.com/abc',
    toJSON: () => ({ endpoint: 'https://web.push.apple.com/abc', keys: { p256dh: 'P', auth: 'A' } }),
    unsubscribe: vi.fn(async () => true),
  };
  const pushManager = {
    getSubscription: vi.fn(async () => (existing ? subscription : pushManager.subscribed || null)),
    subscribe: vi.fn(async (opts) => {
      pushManager.subscribed = subscription;
      pushManager.lastOptions = opts;
      return subscription;
    }),
  };
  vi.stubGlobal('Notification', { requestPermission: vi.fn(async () => permission) });
  vi.stubGlobal('PushManager', function PushManager() {});
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: async () => ({ pushManager }) },
  });
  return { pushManager, subscription };
}

async function loadPush() {
  vi.resetModules();
  return import('./push');
}

describe('daily reminder subscription', () => {
  beforeEach(() => vi.stubEnv('VITE_VAPID_PUBLIC_KEY', KEY));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    delete navigator.serviceWorker;
  });

  test('subscribes with the VAPID key and saves endpoint, keys and time zone', async () => {
    const { pushManager } = fakeBrowser();
    const supabase = fakeSupabase();
    const push = await loadPush();
    await push.enableReminders(supabase);

    expect(pushManager.lastOptions.userVisibleOnly).toBe(true);
    const key = pushManager.lastOptions.applicationServerKey;
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(65);
    expect(key[0]).toBe(0x04);
    expect(supabase.calls).toEqual([
      {
        op: 'upsert',
        table: 'push_subscriptions',
        row: {
          endpoint: 'https://web.push.apple.com/abc',
          p256dh: 'P',
          auth: 'A',
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        opts: { onConflict: 'endpoint' },
      },
    ]);
    expect(await push.remindersEnabled()).toBe(true);
  });

  test('explains a denied permission and saves nothing', async () => {
    fakeBrowser({ permission: 'denied' });
    const supabase = fakeSupabase();
    const push = await loadPush();
    await expect(push.enableReminders(supabase)).rejects.toThrow(/blocked/);
    expect(supabase.calls).toEqual([]);
  });

  test('unsubscribes again if saving the subscription fails', async () => {
    const { subscription } = fakeBrowser();
    const push = await loadPush();
    await expect(push.enableReminders(fakeSupabase({ error: new Error('RLS') }))).rejects.toThrow('RLS');
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  test('turning off deletes the row and unsubscribes', async () => {
    const existing = {
      endpoint: 'https://web.push.apple.com/abc',
      toJSON: () => ({}),
      unsubscribe: vi.fn(async () => true),
    };
    fakeBrowser({ existing });
    const supabase = fakeSupabase();
    const push = await loadPush();
    await push.disableReminders(supabase);
    expect(supabase.calls).toEqual([
      { op: 'delete', table: 'push_subscriptions', col: 'endpoint', val: 'https://web.push.apple.com/abc' },
    ]);
    expect(existing.unsubscribe).toHaveBeenCalled();
  });

  test('without push support, says to use the installed app on iPad', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)', platform: 'iPad', maxTouchPoints: 5 });
    const push = await loadPush();
    expect(push.remindersUnavailableReason()).toMatch(/Home Screen/);
    expect(await push.remindersEnabled()).toBe(false);
  });

  test('without a VAPID key, reminders are reported as not set up', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '');
    const push = await loadPush();
    expect(push.remindersConfigured).toBe(false);
    expect(push.remindersUnavailableReason()).toMatch(/set up/);
  });
});
