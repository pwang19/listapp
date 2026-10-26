import { describe, test, expect } from 'vitest';
import {
  buildReminder,
  reminderDateFor,
  localDateAndHour,
} from '../../supabase/functions/send-reminders/reminder.js';

const doc = (items) => ({ lists: [{ id: 'L', items }] });
const TODAY = '2026-10-20';

describe('buildReminder', () => {
  test('summarises items due today and overdue, due-today first', () => {
    const r = buildReminder(
      doc([
        { text: 'Old thing', dueDate: '2026-10-18' },
        { text: 'Buy milk', dueDate: TODAY },
        { text: 'Call mom', dueDate: TODAY },
      ]),
      TODAY
    );
    expect(r).toEqual({ title: '2 due today · 1 overdue', body: 'Buy milk, Call mom, Old thing' });
  });

  test('skips completed, undated, future, and snoozed items', () => {
    expect(
      buildReminder(
        doc([
          { text: 'Done', dueDate: TODAY, complete: true },
          { text: 'No date' },
          { text: 'Tomorrow', dueDate: '2026-10-21' },
          { text: 'Snoozed', dueDate: '2026-10-19', snoozedUntil: '2026-10-22' },
        ]),
        TODAY
      )
    ).toBeNull();
  });

  test('a snooze that ends today counts again', () => {
    const r = buildReminder(doc([{ text: 'Back', dueDate: '2026-10-19', snoozedUntil: TODAY }]), TODAY);
    expect(r.title).toBe('1 overdue');
  });

  test('long lists are shortened', () => {
    const items = ['a', 'b', 'c', 'd', 'e'].map((text) => ({ text, dueDate: TODAY }));
    expect(buildReminder(doc(items), TODAY).body).toBe('a, b, c, and 2 more');
  });

  test('tolerates missing or malformed docs', () => {
    expect(buildReminder(null, TODAY)).toBeNull();
    expect(buildReminder({ lists: [{ id: 'L' }, null] }, TODAY)).toBeNull();
  });
});

describe('reminderDateFor', () => {
  const sub = { time_zone: 'America/Los_Angeles', last_sent_on: null };
  // 15:30 UTC is 08:30 in Seattle (PDT).
  const morning = new Date('2026-10-20T15:30:00Z');

  test('due once the local morning window opens', () => {
    expect(reminderDateFor(sub, morning)).toBe('2026-10-20');
    expect(reminderDateFor(sub, new Date('2026-10-20T14:30:00Z'))).toBeNull(); // 07:30
  });

  test('catches up until noon, not into the evening', () => {
    expect(reminderDateFor(sub, new Date('2026-10-20T18:59:00Z'))).toBe('2026-10-20'); // 11:59
    expect(reminderDateFor(sub, new Date('2026-10-21T04:00:00Z'))).toBeNull(); // 21:00
  });

  test('only once per local day', () => {
    expect(reminderDateFor({ ...sub, last_sent_on: '2026-10-20' }, morning)).toBeNull();
    expect(reminderDateFor({ ...sub, last_sent_on: '2026-10-19' }, morning)).toBe('2026-10-20');
  });

  test('uses each subscription’s own zone', () => {
    // Same instant: 08:30 in Seattle, 00:30 next day in Tokyo.
    expect(localDateAndHour(morning, 'Asia/Tokyo')).toEqual({ date: '2026-10-21', hour: 0 });
    expect(reminderDateFor({ time_zone: 'Asia/Tokyo' }, morning)).toBeNull();
  });

  test('force sends now regardless', () => {
    expect(reminderDateFor({ ...sub, last_sent_on: '2026-10-20' }, new Date('2026-10-21T04:00:00Z'), true)).toBe('2026-10-20');
  });

  test('an invalid zone throws so the caller can skip it', () => {
    expect(() => reminderDateFor({ time_zone: 'Not/AZone' }, morning)).toThrow();
  });
});
