import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import App from './App';
import { STORAGE_KEY, SETTINGS_KEY } from './utils/storage';
import { normalizeLists } from './utils/normalizeLists';
import * as syncModule from './utils/sync';
import { normalizeSyncDoc } from './utils/sync';
import { fakeSupabase } from './test/fakeSupabase';

beforeEach(() => {
  localStorage.clear();
});

test('renders Lists heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Lists' })).toBeInTheDocument();
});

test('shows empty state and creates a list', () => {
  render(<App />);
  expect(screen.getByText(/No lists yet/i)).toBeInTheDocument();

  const input = screen.getByLabelText(/Add a new list/i);
  fireEvent.change(input, { target: { value: 'Groceries' } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

  expect(screen.getByText('Groceries')).toBeInTheDocument();
  expect(screen.queryByText(/No lists yet/i)).not.toBeInTheDocument();
});

test('adds an item to a list', () => {
  render(<App />);
  const listInput = screen.getByLabelText(/Add a new list/i);
  fireEvent.change(listInput, { target: { value: 'Errands' } });
  fireEvent.keyDown(listInput, { key: 'Enter', code: 'Enter' });

  const itemInput = screen.getByLabelText(/Add item to Errands/i);
  fireEvent.change(itemInput, { target: { value: 'Buy milk' } });
  fireEvent.keyDown(itemInput, { key: 'Enter', code: 'Enter' });

  expect(screen.getByRole('button', { name: /Open details for Buy milk/i })).toBeInTheDocument();
});

test('persists lists to localStorage', () => {
  render(<App />);
  const listInput = screen.getByLabelText(/Add a new list/i);
  fireEvent.change(listInput, { target: { value: 'Saved' } });
  fireEvent.keyDown(listInput, { key: 'Enter', code: 'Enter' });

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  expect(Array.isArray(stored)).toBe(true);
  expect(stored[0].name).toBe('Saved');
  expect(stored[0].id).toBeTruthy();
});

test('normalizeLists rejects non-arrays and assigns ids', () => {
  expect(normalizeLists({ not: 'array' }).ok).toBe(false);

  const result = normalizeLists([{ name: 'A', items: [{ text: 'x' }] }]);
  expect(result.ok).toBe(true);
  expect(result.lists[0].id).toBeTruthy();
  expect(result.lists[0].items[0].id).toBeTruthy();
  expect(result.lists[0].color).toBe('slate');
});

test('import modal shows error for invalid JSON', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /More actions/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /Import\/Export/i }));

  const dialog = screen.getByRole('dialog');
  const textarea = within(dialog).getByLabelText(/JSON Data/i);
  fireEvent.change(textarea, { target: { value: '{bad' } });
  fireEvent.click(within(dialog).getByRole('button', { name: /Replace import/i }));

  expect(within(dialog).getByRole('alert')).toHaveTextContent(/Invalid JSON/i);
});

test('search filter finds lists by name', () => {
  render(<App />);
  const listInput = screen.getByLabelText(/Add a new list/i);
  fireEvent.change(listInput, { target: { value: 'Alpha' } });
  fireEvent.keyDown(listInput, { key: 'Enter', code: 'Enter' });
  fireEvent.change(listInput, { target: { value: 'Beta' } });
  fireEvent.keyDown(listInput, { key: 'Enter', code: 'Enter' });

  const search = screen.getByLabelText(/Search lists and items/i);
  fireEvent.change(search, { target: { value: 'Beta' } });

  expect(screen.getByText('Beta')).toBeInTheDocument();
  expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
});

test('clicking an item opens the details modal', () => {
  render(<App />);
  const listInput = screen.getByLabelText(/Add a new list/i);
  fireEvent.change(listInput, { target: { value: 'Errands' } });
  fireEvent.keyDown(listInput, { key: 'Enter', code: 'Enter' });

  const itemInput = screen.getByLabelText(/Add item to Errands/i);
  fireEvent.change(itemInput, { target: { value: 'Buy milk' } });
  fireEvent.keyDown(itemInput, { key: 'Enter', code: 'Enter' });

  fireEvent.click(screen.getByRole('button', { name: /Open details for Buy milk/i }));

  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('Buy milk')).toBeInTheDocument();
  expect(within(dialog).getByLabelText(/Notes/i)).toBeInTheDocument();
});

describe('sync', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('loads lists from the account and pushes local edits back', async () => {
    const remote = normalizeSyncDoc({
      lists: [{ id: 'L1', name: 'Synced list', items: [{ id: 'a', text: 'From iPad' }] }],
      settings: { staleThresholdDays: 7, savedFilters: [{ id: 'f1', name: 'Errands' }] },
    });
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ darkMode: 'dark' }));
    const { db, client } = fakeSupabase({ doc: remote, version: 1 }, { id: 'u1', email: 'me@example.com' });
    vi.spyOn(syncModule, 'getSupabase').mockReturnValue(client);

    render(<App />);
    expect(await screen.findByText('From iPad')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync: Synced' })).toBeInTheDocument();
    // Synced settings arrive; device-only ones are untouched.
    await waitFor(() => expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)).staleThresholdDays).toBe(7));
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)).darkMode).toBe('dark');

    const itemInput = screen.getByLabelText(/Add item to Synced list/i);
    fireEvent.change(itemInput, { target: { value: 'From Mac' } });
    fireEvent.keyDown(itemInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(db.row.version).toBe(2), { timeout: 4000 });
    expect(db.row.doc.lists[0].items.map((i) => i.text)).toEqual(['From iPad', 'From Mac']);
    expect(db.row.doc.settings).toMatchObject({ staleThresholdDays: 7, savedFilters: [{ id: 'f1' }] });
    expect(db.row.doc.settings.darkMode).toBeUndefined();

    // Pushing must not echo into another push.
    await new Promise((r) => setTimeout(r, 2500));
    expect(db.row.version).toBe(2);
  }, 10000);

  test('restores an earlier version from the Sync dialog, and the restore can be undone', async () => {
    const current = normalizeSyncDoc({
      lists: [{ id: 'L1', name: 'Groceries', items: [{ id: 'b', text: 'Oops, everything else got deleted' }] }],
    });
    const earlier = normalizeSyncDoc({
      lists: [{ id: 'L1', name: 'Groceries', items: [{ id: 'a', text: 'Eggs' }, { id: 'c', text: 'Bread' }] }],
    });
    const { client } = fakeSupabase({ doc: current, version: 5 }, { id: 'u1', email: 'me@example.com' }, [
      { id: 1, version: 3, list_count: 1, item_count: 2, saved_at: '2026-10-20T15:00:00Z', doc: earlier },
    ]);
    vi.spyOn(syncModule, 'getSupabase').mockReturnValue(client);

    render(<App />);
    expect(await screen.findByText('Oops, everything else got deleted')).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: 'Sync: Synced' }));
    fireEvent.click(screen.getByRole('button', { name: /Earlier versions/ }));
    expect(await screen.findByText(/1 lists · 2 items/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    const confirm = await screen.findByText(/Replace your lists, archive, and tags/);
    fireEvent.click(within(confirm.closest('[role="dialog"]')).getByRole('button', { name: 'Restore' }));

    expect(await screen.findByText('Eggs')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();
    expect(screen.queryByText('Oops, everything else got deleted')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(await screen.findByText('Oops, everything else got deleted')).toBeInTheDocument();
    expect(screen.queryByText('Eggs')).not.toBeInTheDocument();
  });
});
