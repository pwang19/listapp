import { createClient } from '@supabase/supabase-js';
import { normalizeLists, normalizeArchived, normalizeCustomTag } from './normalizeLists';
import { DEFAULT_SETTINGS } from './storage';

export const SYNC_META_KEY = 'listapp.syncMeta';
export const SYNC_BASE_KEY = 'listapp.syncBase';
const TABLE = 'user_state';
const HISTORY_TABLE = 'user_state_history';
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
 * Settings that follow the user across devices. Everything else in settings
 * (theme, density, view, collapsed state, notifications…) stays per device.
 */
export const SYNCED_SETTINGS_KEYS = [
  'savedFilters',
  'inboxListId',
  'staleThresholdDays',
  'pomodoroMinutes',
  'lastReviewAt',
  'streaksEnabled',
  'streakCurrent',
  'streakLongest',
  'streakLastGoodDate',
];

/** Picks the synced settings, keeping only values whose type matches the default. */
export function pickSyncedSettings(settings) {
  const out = {};
  if (!settings || typeof settings !== 'object') return out;
  SYNCED_SETTINGS_KEYS.forEach((key) => {
    const value = settings[key];
    const fallback = DEFAULT_SETTINGS[key];
    const ok = Array.isArray(fallback) ? Array.isArray(value) : typeof value === typeof fallback;
    if (value !== undefined && ok) out[key] = value;
  });
  return out;
}

/**
 * The synced subset of app state.
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
    settings: pickSyncedSettings(doc.settings),
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

const same = (a, b) => stableStringify(a) === stableStringify(b);
const isRecord = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);

/**
 * Three-way choice for one value; `undefined` means absent (deleted or never created).
 * Unchanged side takes the other side's change; when both changed, local wins.
 * An edit beats a delete, so work is never silently dropped.
 */
function pick3(base, local, remote) {
  if (local === undefined && remote === undefined) return undefined;
  if (remote === undefined) return base !== undefined && same(local, base) ? undefined : local;
  if (local === undefined) return base !== undefined && same(remote, base) ? undefined : remote;
  if (base === undefined || same(remote, base)) return local;
  if (same(local, base)) return remote;
  return local;
}

/** Like pick3, but when both sides edited the same record, merge it field by field. */
function mergeRecord(base, local, remote) {
  const chosen = pick3(base, local, remote);
  const bothEdited =
    isRecord(base) && isRecord(local) && isRecord(remote) &&
    !same(local, base) && !same(remote, base);
  if (!bothEdited) return chosen;
  const out = {};
  new Set([...Object.keys(remote), ...Object.keys(local)]).forEach((key) => {
    const value = pick3(base[key], local[key], remote[key]);
    if (value !== undefined) out[key] = value;
  });
  return out;
}

const idsOf = (arr) => arr.map((x) => x.id);

/**
 * Merge two versions of an id-keyed array against their common base.
 * Order follows whichever side reordered (local if both did); new entries are appended.
 */
function mergeById(base = [], local, remote) {
  const b = new Map(base.map((x) => [x.id, x]));
  const l = new Map(local.map((x) => [x.id, x]));
  const r = new Map(remote.map((x) => [x.id, x]));
  const merged = new Map();
  [...r.keys(), ...l.keys(), ...b.keys()].forEach((id) => {
    if (merged.has(id)) return;
    const value = mergeRecord(b.get(id), l.get(id), r.get(id));
    if (value !== undefined) merged.set(id, value);
  });
  const preferred = same(idsOf(local), idsOf(base)) ? idsOf(remote) : idsOf(local);
  const order = [...new Set([...preferred, ...r.keys(), ...l.keys()])];
  return order.filter((id) => merged.has(id)).map((id) => merged.get(id));
}

const LIST_KEY = '__listId';

/** Lists become flat records so a move, a reorder, and a rename merge independently. */
function splitLists(lists = []) {
  return {
    lists: lists.map(({ items, ...list }) => ({ ...list, itemIds: idsOf(items) })),
    items: lists.flatMap((list) => list.items.map((item) => ({ ...item, [LIST_KEY]: list.id }))),
  };
}

function joinLists(lists, items, fallbackLists) {
  const byList = new Map(lists.map((list) => [list.id, []]));
  items.forEach((item) => {
    const listId = item[LIST_KEY];
    if (!byList.has(listId)) {
      // The list was deleted on one device while the other added to it: keep the list.
      const revived = fallbackLists.find((list) => list.id === listId);
      if (!revived) return;
      lists.push(revived);
      byList.set(listId, []);
    }
    byList.get(listId).push(item);
  });
  return lists.map(({ itemIds, ...list }) => {
    const position = new Map((itemIds || []).map((id, i) => [id, i]));
    const items = byList.get(list.id)
      .map((item, i) => ({ item, rank: position.get(item.id) ?? position.size + i }))
      .sort((a, b) => a.rank - b.rank)
      .map(({ item: { [LIST_KEY]: _listId, ...item } }) => item);
    return { ...list, items };
  });
}

/**
 * Combine unsynced local edits with a newer remote doc, using `base` (the
 * last doc both sides agreed on) to tell deletions from additions. Without a
 * base (first sync on this device) everything counts as new: a union, local winning.
 */
export function mergeDocs(local, remote, base = null) {
  const b = splitLists(base?.lists);
  const l = splitLists(local.lists);
  const r = splitLists(remote.lists);
  const lists = mergeById(base ? b.lists : undefined, l.lists, r.lists);
  const items = mergeById(base ? b.items : undefined, l.items, r.items);
  return {
    lists: joinLists(lists, items, [...l.lists, ...r.lists, ...b.lists]),
    archived: mergeById(base?.archived, local.archived, remote.archived),
    customTags: mergeById(base?.customTags, local.customTags, remote.customTags),
    userTemplates: mergeById(base?.userTemplates, local.userTemplates, remote.userTemplates),
    itemTemplates: mergeById(base?.itemTemplates, local.itemTemplates, remote.itemTemplates),
    settings: mergeRecord(base ? base.settings : undefined, local.settings, remote.settings) || {},
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

/** The last doc this device and the server agreed on; the common ancestor for merges. */
export function loadSyncBase() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_BASE_KEY));
  } catch {
    return null;
  }
}

export function saveSyncBase(doc) {
  try {
    localStorage.setItem(SYNC_BASE_KEY, JSON.stringify(doc));
  } catch {
    // without a base the next conflict falls back to a union merge
  }
}

/** Earlier saved copies (see supabase/schema.sql), newest first. Row-level security scopes them to the user. */
export async function listHistory(supabase) {
  const { data, error } = await supabase
    .from(HISTORY_TABLE)
    .select('id, version, list_count, item_count, saved_at')
    .order('id', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

export async function fetchHistoryDoc(supabase, id) {
  const { data, error } = await supabase.from(HISTORY_TABLE).select('doc').eq('id', id).single();
  if (error) throw error;
  return normalizeSyncDoc(data.doc);
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
    .update({ doc, version: baseVersion + 1 })
    .eq('user_id', userId)
    .eq('version', baseVersion)
    .select('version');
  if (error) throw error;
  return data.length ? data[0].version : null;
}

/**
 * One sync round. `local` must be a normalized doc; `base` is the last synced
 * doc (see loadSyncBase). Returns the new meta, `synced` (the doc both sides now
 * agree on, to store as the next base) and, when the user should see something
 * new, `apply`.
 */
export async function syncOnce({ supabase, userId, local, meta, base = null }) {
  const localHash = hashDoc(local);
  const known = meta.userId === userId;
  const mergeBase = known ? base : null;
  // Data never synced to this account counts as unsaved, so signing in never discards it.
  const dirty = !known || localHash !== meta.hash;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const remote = await fetchRemote(supabase, userId);

    if (remote && known && remote.version === meta.version && !dirty) {
      // Unchanged local equals the last synced doc; returning it seeds a missing base.
      return { meta, synced: local };
    }

    if (remote && (!known || remote.version !== meta.version)) {
      if (!dirty || isEmptyDoc(local)) {
        return {
          apply: remote.doc,
          synced: remote.doc,
          meta: { userId, version: remote.version, hash: hashDoc(remote.doc) },
        };
      }
      const merged = mergeDocs(local, remote.doc, mergeBase);
      const version = await pushRemote(supabase, userId, merged, remote.version);
      if (version != null) {
        return { apply: merged, synced: merged, meta: { userId, version, hash: hashDoc(merged) } };
      }
      continue;
    }

    const version = await pushRemote(supabase, userId, local, remote ? remote.version : null);
    if (version != null) return { synced: local, meta: { userId, version, hash: localHash } };
  }
  throw new Error('Sync kept conflicting with another device. Try again.');
}
