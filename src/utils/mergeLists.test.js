import { describe, test, expect } from 'vitest';
import { mergeLists } from './mergeLists';

describe('mergeLists', () => {
  test('merges by name and appends new lists', () => {
    const existing = [
      {
        id: 'l1',
        name: 'A',
        color: 'blue',
        icon: '📋',
        items: [{ id: 'i1', text: 'One', complete: false, description: '', dueDate: '', tags: [], subItems: [] }],
      },
    ];
    const result = mergeLists(existing, [
      { name: 'A', items: [{ text: 'Two' }] },
      { name: 'B', items: [{ text: 'Three' }] },
    ]);
    expect(result.ok).toBe(true);
    expect(result.lists).toHaveLength(2);
    expect(result.lists[0].items.map((i) => i.text)).toEqual(['One', 'Two']);
    expect(result.lists[1].name).toBe('B');
  });
});
