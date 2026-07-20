import { describe, test, expect } from 'vitest';
import { normalizeLists, migrateLegacyPriority } from './normalizeLists';

describe('normalizeLists', () => {
  test('returns error for non-array', () => {
    const result = normalizeLists(null);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/array/i);
  });

  test('fills missing fields and ids', () => {
    const result = normalizeLists([
      {
        name: 'Todo',
        items: [{ text: 'One', subItems: [{ text: 'a' }], tags: ['work'], dueDate: '2026-07-20' }],
      },
    ]);
    expect(result.ok).toBe(true);
    const list = result.lists[0];
    expect(list.id).toBeTruthy();
    expect(list.color).toBe('slate');
    expect(list.icon).toBe('📋');
    expect(list.items[0].complete).toBe(false);
    expect(list.items[0].description).toBe('');
    expect(list.items[0].dueDate).toBe('2026-07-20');
    expect(list.items[0].tags).toEqual(['work']);
    expect(list.items[0].subItems[0].id).toBeTruthy();
    expect(list.items[0].subItems[0].complete).toBe(false);
  });

  test('preserves existing ids', () => {
    const result = normalizeLists([
      {
        id: 'list-1',
        name: 'Keep',
        color: 'blue',
        icon: '📚',
        items: [{ id: 'item-1', text: 'x', subItems: [{ id: 'sub-1', text: 'y' }] }],
      },
    ]);
    expect(result.lists[0].id).toBe('list-1');
    expect(result.lists[0].color).toBe('blue');
    expect(result.lists[0].icon).toBe('📚');
    expect(result.lists[0].items[0].id).toBe('item-1');
    expect(result.lists[0].items[0].subItems[0].id).toBe('sub-1');
  });

  test('migrates legacy priority values', () => {
    expect(migrateLegacyPriority(1)).toBe(3);
    expect(migrateLegacyPriority(2)).toBe(2);
    expect(migrateLegacyPriority(3)).toBe(1);
    expect(migrateLegacyPriority(0)).toBe(0);

    const result = normalizeLists(
      [{ name: 'Todo', items: [{ text: 'Old high', priority: 3 }] }],
      [],
      { migrateLegacyPriorities: true }
    );
    expect(result.lists[0].items[0].priority).toBe(1);
  });
});
