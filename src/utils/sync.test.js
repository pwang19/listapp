import { describe, test, expect, beforeEach } from 'vitest';
import { syncOnce, mergeDocs, hashDoc, normalizeSyncDoc } from './sync';
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
    expect(result).toEqual({ meta });
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
