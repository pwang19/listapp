import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';
import { STORAGE_KEY } from './utils/storage';
import { normalizeLists } from './utils/normalizeLists';

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
