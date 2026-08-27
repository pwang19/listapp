import { describe, it, expect } from 'vitest';
import { getMonthGrid, groupItemsByDueDate } from './calendar';

describe('calendar', () => {
  it('builds month grid with padding', () => {
    const cells = getMonthGrid(2026, 6);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter((c) => c.inMonth).length).toBe(31);
  });

  it('groups items by due date', () => {
    const map = groupItemsByDueDate([
      {
        id: 'l1',
        name: 'Work',
        icon: '📋',
        items: [
          { id: 'i1', text: 'Task', dueDate: '2026-07-28', complete: false },
          { id: 'i2', text: 'Done', dueDate: '2026-07-28', complete: true },
        ],
      },
    ]);
    expect(map.get('2026-07-28')).toHaveLength(1);
  });
});
