import { describe, test, expect } from 'vitest';
import { parseQuickAdd } from './parseQuickAdd';

describe('parseQuickAdd', () => {
  test('parses tags, date, and priority', () => {
    const result = parseQuickAdd('Buy milk #errand !2026-07-25 !p2');
    expect(result.text).toBe('Buy milk');
    expect(result.tags).toContain('errand');
    expect(result.dueDate).toBe('2026-07-25');
    expect(result.priority).toBe(2);
  });

  test('maps P1 to high and P3 to low', () => {
    expect(parseQuickAdd('Urgent !p1').priority).toBe(1);
    expect(parseQuickAdd('Later !p3').priority).toBe(3);
    expect(parseQuickAdd('Now !high').priority).toBe(1);
    expect(parseQuickAdd('Whenever !low').priority).toBe(3);
  });

  test('returns plain text when no markers', () => {
    expect(parseQuickAdd('Simple task').text).toBe('Simple task');
  });
});
