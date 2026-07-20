import { describe, test, expect } from 'vitest';
import { filterItems, hasActiveFilters } from './filterItems';

describe('filterItems', () => {
  const items = [
    { id: '1', text: 'Milk', complete: false, tags: ['errand'], description: '', subItems: [] },
    { id: '2', text: 'Done task', complete: true, tags: [], description: '', subItems: [] },
  ];

  test('filters by status', () => {
    expect(filterItems(items, { itemFilter: 'active' })).toHaveLength(1);
    expect(filterItems(items, { itemFilter: 'completed' })).toHaveLength(1);
  });

  test('filters by tag', () => {
    expect(filterItems(items, { tagFilter: 'errand' })).toHaveLength(1);
  });

  test('filters by search', () => {
    expect(filterItems(items, { searchQuery: 'milk' })).toHaveLength(1);
  });

  test('hasActiveFilters', () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ searchQuery: 'x' })).toBe(true);
    expect(hasActiveFilters({ itemFilter: 'active' })).toBe(true);
  });
});
