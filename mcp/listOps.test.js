import { describe, test, expect } from 'vitest';
import { normalizeSyncDoc } from '../src/utils/sync';
import * as ops from './listOps';

const base = () =>
  normalizeSyncDoc({
    lists: [
      { id: 'F', name: 'Work', isFolder: true, items: [] },
      { id: 'L1', name: 'Groceries', parentId: 'F', items: [{ id: 'a', text: 'Eggs' }, { id: 'b', text: 'Milk', blockedBy: [] }] },
      { id: 'L2', name: 'Errands', items: [{ id: 'c', text: 'Post office', blockedBy: ['a'] }] },
    ],
  });

describe('agent list ops', () => {
  test('create_list adds a list with items the way the app does', () => {
    const { doc, result } = ops.createList(base(), {
      name: ' Launch ',
      icon: '🎯',
      items: [{ text: 'Pick niche', priority: 1, tags: ['Work', 'nope'] }, { text: 'Open shop', dueDate: '2026-12-01' }],
    });
    expect(doc.lists).toHaveLength(4);
    expect(result).toMatchObject({ name: 'Launch', icon: '🎯', open: 2, done: 0 });
    expect(result.items).toMatchObject([
      { text: 'Pick niche', priority: 1, tags: ['work'] },
      { text: 'Open shop', dueDate: '2026-12-01' },
    ]);
    const saved = doc.lists[3].items[0];
    expect(saved.history.map((h) => h.type)).toEqual(['created']);
    expect(saved.createdAt).toBeTruthy();
  });

  test('lists are found by id or by name ignoring case; folders are skipped', () => {
    expect(ops.listLists(base()).map((l) => l.name)).toEqual(['Groceries', 'Errands']);
    expect(ops.listLists(base())[0]).toMatchObject({ folder: 'Work', open: 2 });
    expect(ops.getList(base(), 'groceries').id).toBe('L1');
    expect(ops.getList(base(), 'L2').name).toBe('Errands');
    expect(() => ops.getList(base(), 'Work')).toThrow(/No list "Work"/);

    const twice = ops.createList(base(), { name: 'Errands' }).doc;
    expect(() => ops.addItems(twice, { list: 'errands', items: [{ text: 'x' }] })).toThrow(/Several lists/);
  });

  test('add_items appends and returns the new items', () => {
    const { doc, result } = ops.addItems(base(), { list: 'Groceries', items: [{ text: 'Bread' }] });
    expect(doc.lists[1].items.map((i) => i.text)).toEqual(['Eggs', 'Milk', 'Bread']);
    expect(result.added).toEqual([{ id: doc.lists[1].items[2].id, text: 'Bread', complete: false }]);
  });

  test('update_item edits fields and completes like the app', () => {
    const { doc, result } = ops.updateItem(base(), {
      list: 'L1', itemId: 'a', text: 'Free-range eggs', dueDate: '2026-11-30', complete: true,
    });
    expect(result).toMatchObject({ text: 'Free-range eggs', dueDate: '2026-11-30', complete: true });
    const item = doc.lists[1].items[0];
    expect(item.completedAt).toBeTruthy();
    expect(item.history.map((h) => h.type)).toEqual(['renamed', 'due_date', 'completed']);

    const reopened = ops.updateItem(doc, { list: 'L1', itemId: 'a', complete: false }).doc.lists[1].items[0];
    expect(reopened).toMatchObject({ complete: false, completedAt: '' });
    expect(() => ops.updateItem(base(), { list: 'L1', itemId: 'zz', complete: true })).toThrow(/No item zz/);
  });

  test('delete_item clears blocker references; update_list and delete_list', () => {
    const afterDelete = ops.deleteItem(base(), { list: 'L1', itemId: 'a' }).doc;
    expect(afterDelete.lists[2].items[0].blockedBy).toEqual([]);

    const renamed = ops.updateList(base(), { list: 'Errands', name: 'Town', color: 'teal' });
    expect(renamed.result).toMatchObject({ name: 'Town', color: 'teal' });

    const { doc, result } = ops.deleteList(base(), { list: 'Errands' });
    expect(result).toEqual({ deleted: 'Errands', items: 1 });
    expect(doc.lists.map((l) => l.id)).toEqual(['F', 'L1']);
  });
});
