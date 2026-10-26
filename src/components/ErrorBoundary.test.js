import { test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import * as storage from '../utils/storage';

function Broken() {
  throw new Error('flattenAllItems is not defined');
}

test('shows a recovery screen instead of a blank page when rendering fails', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const backup = vi.spyOn(storage, 'downloadBackup').mockImplementation(() => {});

  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>
  );

  expect(screen.getByRole('alert')).toHaveTextContent('flattenAllItems is not defined');
  fireEvent.click(screen.getByRole('button', { name: 'Download backup' }));
  expect(backup).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  vi.restoreAllMocks();
});
