import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getSupabase,
  syncOnce,
  hashDoc,
  loadSyncMeta,
  saveSyncMeta,
  loadSyncBase,
  saveSyncBase,
  listHistory,
  fetchHistoryDoc,
} from '../utils/sync';
import { enableReminders, disableReminders } from '../utils/push';

const PUSH_DELAY_MS = 2000;

/**
 * Keeps `doc` (the synced subset of app state) in sync with Supabase.
 * status: disabled | signed-out | syncing | synced | offline | error
 */
export function useSync(doc, onRemoteDoc) {
  const supabase = getSupabase();
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [status, setStatus] = useState(supabase ? 'signed-out' : 'disabled');
  const [error, setError] = useState('');
  const docRef = useRef(doc);
  const onRemoteRef = useRef(onRemoteDoc);
  const runningRef = useRef(false);
  const queuedRef = useRef(false);
  const userId = session?.user?.id;

  docRef.current = doc;
  onRemoteRef.current = onRemoteDoc;

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const runSync = useCallback(async () => {
    if (!supabase || !userId) return;
    if (runningRef.current) {
      queuedRef.current = true;
      return;
    }
    runningRef.current = true;
    setStatus('syncing');
    try {
      const local = docRef.current;
      const result = await syncOnce({
        supabase,
        userId,
        local,
        meta: loadSyncMeta(),
        base: loadSyncBase(),
      });
      if (docRef.current === local) {
        if (result.apply) onRemoteRef.current(result.apply);
        if (result.synced) saveSyncBase(result.synced);
        saveSyncMeta(result.meta);
      } else {
        // Edited mid-sync: discard this result; the next round merges the edit with whatever was saved.
        queuedRef.current = true;
      }
      setError('');
      setStatus('synced');
    } catch (err) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      setStatus(offline ? 'offline' : 'error');
      setError(offline ? '' : err?.message || 'Sync failed.');
    } finally {
      runningRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        runSync();
      }
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (!supabase || !authReady) return;
    if (userId) runSync();
    else setStatus('signed-out');
  }, [supabase, authReady, userId, runSync]);

  // Push local edits shortly after they stop.
  useEffect(() => {
    if (!userId) return undefined;
    const meta = loadSyncMeta();
    if (meta.userId === userId && meta.hash === hashDoc(doc)) return undefined;
    const id = setTimeout(runSync, PUSH_DELAY_MS);
    return () => clearTimeout(id);
  }, [doc, userId, runSync]);

  // Pick up the other device's changes when this one comes back into use.
  useEffect(() => {
    if (!userId) return undefined;
    const onVisible = () => {
      if (document.visibilityState === 'visible') runSync();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', runSync);
    window.addEventListener('online', runSync);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', runSync);
      window.removeEventListener('online', runSync);
    };
  }, [userId, runSync]);

  const requestCode = useCallback(
    async (email) => {
      const { error: err } = await supabase.auth.signInWithOtp({ email });
      if (err) throw err;
    },
    [supabase]
  );

  const verifyCode = useCallback(
    async (email, token) => {
      const { error: err } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (err) throw err;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    // Otherwise this device would keep getting reminders for an account it left.
    try {
      await disableReminders(supabase);
    } catch {
      // signing out matters more than tidying the subscription
    }
    await supabase.auth.signOut();
  }, [supabase]);

  return {
    enabled: Boolean(supabase),
    status,
    error,
    email: session?.user?.email || '',
    syncNow: runSync,
    listHistory: () => listHistory(supabase),
    fetchHistoryDoc: (id) => fetchHistoryDoc(supabase, id),
    requestCode,
    verifyCode,
    signOut,
    enableReminders: () => enableReminders(supabase),
    disableReminders: () => disableReminders(supabase),
  };
}
