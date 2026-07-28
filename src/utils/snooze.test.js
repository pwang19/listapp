import { describe, it, expect } from 'vitest';
import { isSnoozed, buildSnoozePatch, dateFromToday } from './snooze';

describe('snooze', () => {
  it('detects active snooze', () => {
    const tomorrow = dateFromToday(1);
    expect(isSnoozed(tomorrow, dateFromToday(0))).toBe(true);
    expect(isSnoozed(dateFromToday(0), dateFromToday(0))).toBe(false);
  });

  it('builds snooze patch with due date', () => {
    const patch = buildSnoozePatch({ dueDate: '' }, 7);
    expect(patch.snoozedUntil).toBe(dateFromToday(7));
    expect(patch.dueDate).toBe(dateFromToday(7));
  });
});
