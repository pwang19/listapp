import { test, expect, beforeEach, vi } from 'vitest';
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
  vi.useFakeTimers();
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
  vi.useRealTimers();
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

function setupTwoLists(result) {
  act(() => {
    result.current.addList('A');
  });
  act(() => {
    result.current.addList('B');
  });
  const [a, b] = result.current.lists;
  act(() => {
    result.current.addItem(a.id, 'a1');
    result.current.addItem(a.id, 'a2');
    result.current.addItem(b.id, 'b1');
  });
  const lists = result.current.lists;
  const listA = lists.find((l) => l.id === a.id);
  const listB = lists.find((l) => l.id === b.id);
  const selection = [
    ...listA.items.map((i) => ({ listId: listA.id, itemId: i.id })),
    ...listB.items.map((i) => ({ listId: listB.id, itemId: i.id })),
  ];
  return { listA, listB, selection };
}

const findList = (result, id) => result.current.lists.find((l) => l.id === id);

test('bulk ops across lists record a single undo entry', () => {
  const { result } = renderHook(() => useLists());
  const { listA, listB, selection } = setupTwoLists(result);
  const undoDepth = result.current.undoStack.length;

  act(() => {
    result.current.bulkUpdateItems(selection, { complete: true });
  });
  expect(findList(result, listA.id).items.every((i) => i.complete)).toBe(true);
  expect(findList(result, listB.id).items.every((i) => i.complete)).toBe(true);
  expect(result.current.undoStack.length).toBe(undoDepth + 1);

  act(() => {
    result.current.applyUndo();
  });
  expect(findList(result, listA.id).items.some((i) => i.complete)).toBe(false);
  expect(findList(result, listB.id).items.some((i) => i.complete)).toBe(false);
});

test('bulkAddTags unions tags in one undoable step', () => {
  const { result } = renderHook(() => useLists());
  const { listA, listB, selection } = setupTwoLists(result);
  let tag;
  act(() => {
    tag = result.current.addCustomTag('urgent');
  });
  const undoDepth = result.current.undoStack.length;

  act(() => {
    result.current.bulkAddTags(selection, [tag.id]);
  });
  const all = [...findList(result, listA.id).items, ...findList(result, listB.id).items];
  expect(all.every((i) => i.tags.includes(tag.id))).toBe(true);
  expect(result.current.undoStack.length).toBe(undoDepth + 1);

  act(() => {
    result.current.applyUndo();
  });
  const restored = [...findList(result, listA.id).items, ...findList(result, listB.id).items];
  expect(restored.some((i) => i.tags.includes(tag.id))).toBe(false);
});

test('bulkMoveItems and bulkArchiveItems handle multi-list selections', () => {
  const { result } = renderHook(() => useLists());
  const { listA, listB, selection } = setupTwoLists(result);

  act(() => {
    result.current.bulkMoveItems(selection, listB.id);
  });
  expect(findList(result, listA.id).items).toHaveLength(0);
  expect(findList(result, listB.id).items.map((i) => i.text).sort()).toEqual(['a1', 'a2', 'b1']);

  act(() => {
    result.current.applyUndo();
  });
  expect(findList(result, listA.id).items).toHaveLength(2);

  act(() => {
    result.current.bulkArchiveItems(selection);
  });
  expect(findList(result, listA.id).items).toHaveLength(0);
  expect(findList(result, listB.id).items).toHaveLength(0);
  expect(result.current.archived).toHaveLength(3);

  act(() => {
    result.current.applyUndo();
  });
  expect(result.current.archived).toHaveLength(0);
  expect(findList(result, listB.id).items).toHaveLength(1);
});
