import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { localDateString, getUpcomingItems } from './helpers';
import { todayDateString, dateFromToday } from './snooze';
import { getNextDueDate } from './recurring';
import { isStaleItem } from './staleItems';

// Node re-reads process.env.TZ on change, so each test can pin a zone.
const originalTZ = process.env.TZ;

function at(tz, localIso) {
  process.env.TZ = tz;
  vi.setSystemTime(new Date(localIso));
}

describe('calendar days use the device time zone', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTZ;
  });

  test('8pm in Seattle is still today (UTC is already tomorrow)', () => {
    at('America/Los_Angeles', '2026-10-20T20:00:00');
    expect(todayDateString()).toBe('2026-10-20');
    expect(dateFromToday(1)).toBe('2026-10-21');
    expect(localDateString()).toBe('2026-10-20');
  });

  test('early morning east of UTC is today (UTC is still yesterday)', () => {
    at('Asia/Tokyo', '2026-10-20T07:00:00');
    expect(todayDateString()).toBe('2026-10-20');
    expect(dateFromToday(7)).toBe('2026-10-27');
    expect(getNextDueDate({ dueDate: '2026-10-20', recurring: 'daily' })).toBe('2026-10-21');
  });

  test('an item due today is not overdue or snoozed-away in the evening', () => {
    at('America/Los_Angeles', '2026-10-20T21:30:00');
    const lists = [{ id: 'L', name: 'L', items: [
      { id: 'a', text: 'Due today', dueDate: '2026-10-20' },
      { id: 'b', text: 'Snoozed to tomorrow', dueDate: '2026-10-21', snoozedUntil: '2026-10-21' },
    ] }];
    const upcoming = getUpcomingItems(lists);
    expect(upcoming.map((r) => r.item.id)).toEqual(['a']);
    expect(upcoming[0].overdue).toBe(false);
  });

  test('stale threshold counts local days', () => {
    at('America/Los_Angeles', '2026-10-20T22:00:00');
    expect(isStaleItem({ lastTouchedAt: '2026-10-06T12:00:00.000Z' }, 14)).toBe(true);
    expect(isStaleItem({ lastTouchedAt: '2026-10-07T12:00:00.000Z' }, 14)).toBe(false);
  });
});
