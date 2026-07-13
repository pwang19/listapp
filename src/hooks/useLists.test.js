import { renderHook, act } from '@testing-library/react';
import { useLists } from './useLists';
import { STORAGE_KEY, ARCHIVE_KEY } from '../utils/storage';

beforeEach(() => {
  localStorage.clear();
});

test('adds list and item with stable ids and persists', () => {
  const { result } = renderHook(() => useLists());

  act(() => {
    result.current.addList('Work');
  });

  expect(result.current.lists).toHaveLength(1);
  expect(result.current.lists[0].id).toBeTruthy();

  const listId = result.current.lists[0].id;
  act(() => {
    result.current.addItem(listId, 'Ship feature');
  });

  expect(result.current.lists[0].items[0].text).toBe('Ship feature');
  expect(result.current.lists[0].items[0].id).toBeTruthy();

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  expect(stored[0].name).toBe('Work');
});

test('importLists validates and replaces', () => {
  const { result } = renderHook(() => useLists());

  act(() => {
    result.current.addList('Old');
  });

  let importResult;
  act(() => {
    importResult = result.current.importLists([{ name: 'New', items: [] }]);
  });

  expect(importResult.ok).toBe(true);
  expect(result.current.lists).toHaveLength(1);
  expect(result.current.lists[0].name).toBe('New');

  act(() => {
    importResult = result.current.importLists({ nope: true });
  });
  expect(importResult.ok).toBe(false);
});

test('archive item and undo restores it', () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useLists());

  act(() => {
    result.current.addList('L');
  });
  const listId = result.current.lists[0].id;
  act(() => {
    result.current.addItem(listId, 'Keep me');
  });
  const itemId = result.current.lists[0].items[0].id;

  act(() => {
    result.current.deleteItem(listId, itemId);
  });

  expect(result.current.lists[0].items).toHaveLength(0);
  expect(result.current.archived).toHaveLength(1);
  expect(result.current.toast?.message).toMatch(/archived/i);

  act(() => {
    result.current.applyUndo();
  });

  expect(result.current.lists[0].items[0].text).toBe('Keep me');
  expect(result.current.archived).toHaveLength(0);
  jest.useRealTimers();
});

test('merge import combines by name', () => {
  const { result } = renderHook(() => useLists());

  act(() => {
    result.current.addList('Shared');
  });
  const listId = result.current.lists[0].id;
  act(() => {
    result.current.addItem(listId, 'Existing');
  });

  act(() => {
    result.current.importLists(
      [{ name: 'Shared', items: [{ text: 'Incoming' }] }],
      'merge'
    );
  });

  expect(result.current.lists).toHaveLength(1);
  expect(result.current.lists[0].items.map((i) => i.text).sort()).toEqual([
    'Existing',
    'Incoming',
  ]);
});

test('template adds seeded list', () => {
  const { result } = renderHook(() => useLists());
  act(() => {
    result.current.addTemplate('groceries');
  });
  expect(result.current.lists[0].name).toBe('Grocery');
  expect(result.current.lists[0].items.length).toBeGreaterThan(0);
  expect(JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]')).toEqual([]);
});
