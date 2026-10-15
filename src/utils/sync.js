import { createClient } from '@supabase/supabase-js';
import { normalizeLists, normalizeArchived, normalizeCustomTag } from './normalizeLists';

export const SYNC_META_KEY = 'listapp.syncMeta';
const TABLE = 'user_state';
const MAX_ATTEMPTS = 3;

let client;

/** Supabase client, or null when sync isn't configured for this build. */
export function getSupabase() {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

const objects = (value) =>
  Array.isArray(value) ? value.filter((v) => v && typeof v === 'object') : [];

/**
 * The synced subset of app state. Settings stay per-device.
 * Remote data crosses a trust boundary, so it is normalized before use.
 */
export function normalizeSyncDoc(doc = {}) {
  const customTags = objects(doc.customTags).map(normalizeCustomTag);
  const lists = normalizeLists(objects(doc.lists), customTags);
  return {
    lists: lists.ok ? lists.lists : [],
    archived: normalizeArchived(objects(doc.archived), customTags),
    customTags,
    userTemplates: objects(doc.userTemplates),
    itemTemplates: objects(doc.itemTemplates),
  };
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    // jsonb reorders keys, so sort them to compare docs by content.
    return `{${Object.keys(value)
      .sort()
      .filter((k) => value[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function hashDoc(doc) {
  const text = stableStringify(doc);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return `${text.length}:${h.toString(36)}`;
}

function isEmptyDoc(doc) {
  return doc.lists.length === 0 && doc.archived.length === 0;
}

/** Union by id; on a clash the local copy wins. Remote order first, local-only entries appended. */
function unionById(remote, local, combine = (_r, l) => l) {
  const localById = new Map(local.map((x) => [x.id, x]));
  const remoteIds = new Set(remote.map((x) => x.id));
  return [
    ...remote.map((r) => (localById.has(r.id) ? combine(r, localById.get(r.id)) : r)),
    ...local.filter((l) => !remoteIds.has(l.id)),
  ];
}

/**
 * Combine unsynced local edits with a newer remote doc. Nothing is dropped;
 * the trade-off is that an item deleted on the other device can reappear.
 */
export function mergeDocs(local, remote) {
  return {
    lists: unionById(remote.lists, local.lists, (r, l) => ({
      ...r,
      ...l,
      items: unionById(r.items, l.items),
    })),
    archived: unionById(remote.archived, local.archived),
    customTags: unionById(remote.customTags, local.customTags),
    userTemplates: unionById(remote.userTemplates, local.userTemplates),
    itemTemplates: unionById(remote.itemTemplates, local.itemTemplates),
  };
}

export function loadSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveSyncMeta(meta) {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {
    // meta is rebuilt on the next sync
  }
}

async function fetchRemote(supabase, userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('doc, version')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? { doc: normalizeSyncDoc(data.doc), version: data.version } : null;
}

/** Compare-and-set write. Returns the new version, or null if another device saved first. */
async function pushRemote(supabase, userId, doc, baseVersion) {
  if (baseVersion == null) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ user_id: userId, doc, version: 1 })
      .select('version');
    if (error?.code === '23505') return null;
    if (error) throw error;
    return data[0].version;
  }
  const { data, error } = await supabase
    .from(TABLE)
    .update({ doc, version: baseVersion + 1, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('version', baseVersion)
    .select('version');
  if (error) throw error;
  return data.length ? data[0].version : null;
}

/**
 * One sync round. `local` must be a normalized doc. Returns the new meta and,
 * when the remote copy changed what the user should see, the doc to apply.
 */
export async function syncOnce({ supabase, userId, local, meta }) {
  const localHash = hashDoc(local);
  const known = meta.userId === userId;
  // Data never synced to this account counts as unsaved, so signing in never discards it.
  const dirty = !known || localHash !== meta.hash;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const remote = await fetchRemote(supabase, userId);

    if (remote && known && remote.version === meta.version && !dirty) {
      return { meta };
    }

    if (remote && (!known || remote.version !== meta.version)) {
      if (!dirty || isEmptyDoc(local)) {
        return {
          apply: remote.doc,
          meta: { userId, version: remote.version, hash: hashDoc(remote.doc) },
        };
      }
      const merged = mergeDocs(local, remote.doc);
      const version = await pushRemote(supabase, userId, merged, remote.version);
      if (version != null) {
        return { apply: merged, meta: { userId, version, hash: hashDoc(merged) } };
      }
      continue;
    }

    const version = await pushRemote(supabase, userId, local, remote ? remote.version : null);
    if (version != null) return { meta: { userId, version, hash: localHash } };
  }
  throw new Error('Sync kept conflicting with another device. Try again.');
}
