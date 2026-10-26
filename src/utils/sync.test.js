import { describe, test, expect, beforeEach } from 'vitest';
import { syncOnce, mergeDocs, hashDoc, normalizeSyncDoc, pickSyncedSettings } from './sync';
import { fakeSupabase } from '../test/fakeSupabase';

const doc = (lists) => normalizeSyncDoc({ lists });
const list = (id, items) => ({ id, name: id, items: items.map((t) => ({ id: t, text: t })) });
const itemIds = (d) => d.lists.flatMap((l) => l.items.map((i) => i.id)).sort();

describe('syncOnce', () => {
  let local;
  beforeEach(() => {
    local = doc([list('L1', ['a'])]);
  });

  test('first device uploads its data', async () => {
    const { db, client } = fakeSupabase();
    const result = await syncOnce({ supabase: client, userId: 'u', local, meta: {} });
    expect(db.row.version).toBe(1);
    expect(result.apply).toBeUndefined();
    expect(result.meta).toEqual({ userId: 'u', version: 1, hash: hashDoc(local) });
  });

  test('nothing to do when both sides are unchanged', async () => {
    const { db, client } = fakeSupabase({ doc: local, version: 3 });
    const meta = { userId: 'u', version: 3, hash: hashDoc(local) };
    const result = await syncOnce({ supabase: client, userId: 'u', local, meta });
    expect(result).toEqual({ meta, synced: local });
    expect(db.writes).toBe(0);
  });

  test('newer remote replaces an unchanged local copy', async () => {
    const remote = doc([list('L1', ['a', 'b'])]);
    const { client } = fakeSupabase({ doc: remote, version: 4 });
    const meta = { userId: 'u', version: 3, hash: hashDoc(local) };
    const result = await syncOnce({ supabase: client, userId: 'u', local, meta });
    expect(itemIds(result.apply)).toEqual(['a', 'b']);
    expect(result.meta.version).toBe(4);
    expect(result.meta.hash).toBe(hashDoc(result.apply));
  });

  test('local edits push with a version bump', async () => {
    const { db, client } = fakeSupabase({ doc: local, version: 3 });
    const meta = { userId: 'u', version: 3, hash: hashDoc(local) };
    const edited = doc([list('L1', ['a', 'c'])]);
    const result = await syncOnce({ supabase: client, userId: 'u', local: edited, meta });
    expect(db.row.version).toBe(4);
    expect(itemIds(db.row.doc)).toEqual(['a', 'c']);
    expect(result.meta.hash).toBe(hashDoc(edited));
  });

  test('edits made offline on both devices are merged, nothing lost', async () => {
    const remote = doc([list('L1', ['a', 'fromOther']), list('L2', ['x'])]);
    const { db, client } = fakeSupabase({ doc: remote, version: 5 });
    const meta = { userId: 'u', version: 4, hash: hashDoc(local) };
    const edited = doc([list('L1', ['a', 'fromHere'])]);
    const result = await syncOnce({ supabase: client, userId: 'u', local: edited, meta });
    expect(itemIds(result.apply)).toEqual(['a', 'fromHere', 'fromOther', 'x']);
    expect(db.row.version).toBe(6);
    expect(itemIds(db.row.doc)).toEqual(['a', 'fromHere', 'fromOther', 'x']);
  });

  test('a save from the other device mid-push triggers a merge and retry', async () => {
    const { db, client } = fakeSupabase({ doc: local, version: 1 });
    const meta = { userId: 'u', version: 1, hash: hashDoc(local) };
    db.beforeWrite = () => {
      db.row = { doc: doc([list('L1', ['a', 'racer'])]), version: 2 };
    };
    const edited = doc([list('L1', ['a', 'mine'])]);
    const result = await syncOnce({ supabase: client, userId: 'u', local: edited, meta });
    expect(db.row.version).toBe(3);
    expect(itemIds(result.apply)).toEqual(['a', 'mine', 'racer']);
  });

  test('signing in on a device with existing data merges instead of discarding it', async () => {
    const remote = doc([list('L2', ['x'])]);
    const { db, client } = fakeSupabase({ doc: remote, version: 2 });
    const result = await syncOnce({ supabase: client, userId: 'u', local, meta: {} });
    expect(itemIds(result.apply)).toEqual(['a', 'x']);
    expect(db.row.version).toBe(3);
  });

  test('an empty new device just downloads', async () => {
    const remote = doc([list('L2', ['x'])]);
    const { db, client } = fakeSupabase({ doc: remote, version: 2 });
    const result = await syncOnce({ supabase: client, userId: 'u', local: doc([]), meta: {} });
    expect(itemIds(result.apply)).toEqual(['x']);
    expect(db.writes).toBe(0);
  });
});

test('mergeDocs keeps ids and custom tags, preferring local edits', () => {
  const tag = { id: 'work', label: 'Work' };
  const remote = normalizeSyncDoc({
    customTags: [tag],
    lists: [{ id: 'L1', name: 'Old name', items: [{ id: 'a', text: 'old', tags: ['work'] }] }],
  });
  const local = normalizeSyncDoc({
    customTags: [tag],
    lists: [{ id: 'L1', name: 'New name', items: [{ id: 'a', text: 'new', tags: ['work'] }] }],
  });
  const merged = mergeDocs(local, remote);
  expect(merged.lists[0].name).toBe('New name');
  expect(merged.lists[0].items[0]).toMatchObject({ id: 'a', text: 'new', tags: ['work'] });
});

test('hashDoc ignores key order, as jsonb reorders keys', () => {
  expect(hashDoc({ a: 1, b: [{ c: 2, d: 3 }] })).toBe(hashDoc({ b: [{ d: 3, c: 2 }], a: 1 }));
  expect(hashDoc({ a: 1 })).not.toBe(hashDoc({ a: 2 }));
});

describe('three-way mergeDocs (with the last synced copy as base)', () => {
  const D = (lists, extra = {}) => normalizeSyncDoc({ lists, ...extra });
  const L = (id, items, extra = {}) => ({ id, name: id, ...extra, items: items.map((it) => (typeof it === 'string' ? { id: it, text: it } : it)) });
  const layout = (d) => Object.fromEntries(d.lists.map((l) => [l.id, l.items.map((i) => i.id)]));

  test('an item deleted here stays deleted while the other device edits something else', () => {
    const base = D([L('L1', ['a', 'b'])]);
    const local = D([L('L1', ['a'])]);
    const remote = D([L('L1', ['a', 'b', 'c'])]);
    expect(layout(mergeDocs(local, remote, base))).toEqual({ L1: ['a', 'c'] });
  });

  test('an item deleted on the other device stays deleted', () => {
    const base = D([L('L1', ['a', 'b'])]);
    const local = D([L('L1', ['a', 'b', 'c'])]);
    const remote = D([L('L1', ['b'])]);
    expect(layout(mergeDocs(local, remote, base))).toEqual({ L1: ['b', 'c'] });
  });

  test('a moved item ends up only in its new list', () => {
    const base = D([L('L1', ['a', 'b']), L('L2', [])]);
    const local = D([L('L1', ['b']), L('L2', ['a'])]);
    const remote = D([L('L1', ['a', 'b', 'x']), L('L2', [])]);
    expect(layout(mergeDocs(local, remote, base))).toEqual({ L1: ['b', 'x'], L2: ['a'] });
  });

  test('an archived item leaves its list and lands in the archive once', () => {
    const base = D([L('L1', ['a', 'b'])]);
    const local = D([L('L1', ['b'])], { archived: [{ id: 'a', text: 'a', fromListId: 'L1' }] });
    const remote = D([L('L1', ['a', 'b', 'c'])]);
    const merged = mergeDocs(local, remote, base);
    expect(layout(merged)).toEqual({ L1: ['b', 'c'] });
    expect(merged.archived.map((e) => e.id)).toEqual(['a']);
  });

  test('a reorder on one device survives an addition on the other', () => {
    const base = D([L('L1', ['a', 'b', 'c'])]);
    const local = D([L('L1', ['c', 'a', 'b'])]);
    const remote = D([L('L1', ['a', 'b', 'c', 'd'])]);
    expect(layout(mergeDocs(local, remote, base))).toEqual({ L1: ['c', 'a', 'b', 'd'] });
  });

  test('different fields edited on each device are both kept; same field, local wins', () => {
    const item = { id: 'a', text: 'Buy milk', description: '', complete: false };
    const base = D([L('L1', [item])]);
    const local = D([L('L1', [{ ...item, complete: true, text: 'Buy oat milk' }])]);
    const remote = D([L('L1', [{ ...item, description: 'the big one', text: 'Buy 2 milk' }])]);
    const merged = mergeDocs(local, remote, base).lists[0].items[0];
    expect(merged).toMatchObject({ complete: true, description: 'the big one', text: 'Buy oat milk' });
  });

  test('a rename on one device and a new item on the other are both kept', () => {
    const base = D([L('L1', ['a'])]);
    const local = D([L('L1', ['a'], { name: 'Groceries' })]);
    const remote = D([L('L1', ['a', 'b'])]);
    const merged = mergeDocs(local, remote, base);
    expect(merged.lists[0].name).toBe('Groceries');
    expect(layout(merged)).toEqual({ L1: ['a', 'b'] });
  });

  test('an item edited on one device survives being deleted on the other', () => {
    const base = D([L('L1', [{ id: 'a', text: 'old' }])]);
    const local = D([L('L1', [])]);
    const remote = D([L('L1', [{ id: 'a', text: 'edited' }])]);
    expect(mergeDocs(local, remote, base).lists[0].items[0].text).toBe('edited');
  });

  test('a list deleted here comes back holding only items added on the other device', () => {
    const base = D([L('L1', ['a']), L('L2', ['x'])]);
    const local = D([L('L2', ['x'])]);
    const remote = D([L('L1', ['a', 'new']), L('L2', ['x'])]);
    // 'a' was deleted along with the list here; 'new' was never seen here, so it is kept.
    expect(layout(mergeDocs(local, remote, base))).toEqual({ L2: ['x'], L1: ['new'] });
  });

  test('a list deleted here with no new items stays deleted', () => {
    const base = D([L('L1', ['a']), L('L2', ['x'])]);
    const local = D([L('L2', ['x'])]);
    const remote = D([L('L1', ['a']), L('L2', ['x', 'y'])]);
    expect(layout(mergeDocs(local, remote, base))).toEqual({ L2: ['x', 'y'] });
  });

  test('synced settings merge key by key', () => {
    const s = (settings) => D([], { settings });
    const base = s({ staleThresholdDays: 14, pomodoroMinutes: 25 });
    const local = s({ staleThresholdDays: 7, pomodoroMinutes: 25 });
    const remote = s({ staleThresholdDays: 14, pomodoroMinutes: 50 });
    expect(mergeDocs(local, remote, base).settings).toEqual({ staleThresholdDays: 7, pomodoroMinutes: 50 });
  });

  test('without a base it behaves like a union where local wins', () => {
    const local = D([L('L1', [{ id: 'a', text: 'mine' }])]);
    const remote = D([L('L1', [{ id: 'a', text: 'theirs' }, 'b'])]);
    const merged = mergeDocs(local, remote, null);
    expect(layout(merged)).toEqual({ L1: ['a', 'b'] });
    expect(merged.lists[0].items[0].text).toBe('mine');
  });

  test('merged output is a normal doc (no internal fields leak out)', () => {
    const base = D([L('L1', ['a'])]);
    const merged = mergeDocs(D([L('L1', ['a', 'b'])]), D([L('L1', ['a', 'c'])]), base);
    expect(normalizeSyncDoc(merged)).toEqual(merged);
  });
});

test('syncOnce merges against the stored base, so a delete made offline sticks', async () => {
  const base = normalizeSyncDoc({ lists: [list('L1', ['a', 'b'])] });
  const remote = normalizeSyncDoc({ lists: [list('L1', ['a', 'b', 'fromOther'])] });
  const { db, client } = fakeSupabase({ doc: remote, version: 2 });
  const local = normalizeSyncDoc({ lists: [list('L1', ['a'])] });
  const meta = { userId: 'u', version: 1, hash: hashDoc(base) };
  const result = await syncOnce({ supabase: client, userId: 'u', local, meta, base });
  expect(itemIds(result.apply)).toEqual(['a', 'fromOther']);
  expect(itemIds(db.row.doc)).toEqual(['a', 'fromOther']);
  expect(result.synced).toBe(result.apply);
});

test('pickSyncedSettings keeps only synced keys with the right types', () => {
  expect(
    pickSyncedSettings({
      darkMode: 'dark',
      staleThresholdDays: 7,
      pomodoroMinutes: '25',
      savedFilters: [{ id: 'f' }],
      inboxListId: null,
    })
  ).toEqual({ staleThresholdDays: 7, savedFilters: [{ id: 'f' }] });
});
