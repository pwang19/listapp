import { describe, it, expect } from 'vitest';
import { computeListStats } from './listStats';

describe('computeListStats', () => {
  it('computes completion rate and overdue count', () => {
    const stats = computeListStats({
      items: [
        { complete: true, createdAt: '2026-01-01T00:00:00.000Z', completedAt: '2026-01-03T00:00:00.000Z' },
        { complete: false, dueDate: '2020-01-01' },
        { complete: false, dueDate: '', tags: ['work'] },
      ],
    });
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.overdue).toBe(1);
    expect(stats.completionRate).toBe(33);
    expect(stats.tagged).toBe(1);
  });
});
