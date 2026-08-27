import { describe, it, expect } from 'vitest';
import { syncStreak, hasOverdueIncomplete } from './streaks';
import { todayDateString } from './snooze';

describe('streaks', () => {
  const today = todayDateString();
  const yesterday = (() => {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const lists = [
    {
      id: 'l1',
      items: [
        { complete: false, dueDate: today, snoozedUntil: '' },
      ],
    },
  ];

  it('detects overdue incomplete items', () => {
    expect(hasOverdueIncomplete(lists, today)).toBe(true);
    expect(hasOverdueIncomplete(lists, yesterday)).toBe(false);
  });

  it('increments streak when due items are complete', () => {
    const doneLists = [
      {
        id: 'l1',
        items: [{ complete: true, dueDate: today, snoozedUntil: '' }],
      },
    ];
    const patch = syncStreak(
      { streaksEnabled: true, streakCurrent: 2, streakLongest: 2, streakLastGoodDate: yesterday },
      doneLists
    );
    expect(patch?.streakCurrent).toBe(3);
    expect(patch?.streakLongest).toBe(3);
  });

  it('resets streak when overdue', () => {
    const patch = syncStreak(
      { streaksEnabled: true, streakCurrent: 5, streakLongest: 5, streakLastGoodDate: '2026-07-27' },
      lists
    );
    expect(patch?.streakCurrent).toBe(0);
  });
});
