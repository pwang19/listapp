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

  test('returns plain text when no markers', () => {
    expect(parseQuickAdd('Simple task').text).toBe('Simple task');
  });
});
