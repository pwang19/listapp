import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SyncModal from './SyncModal';
import * as push from '../../utils/push';

const baseSync = () => ({
  email: 'me@example.com',
  status: 'synced',
  error: '',
  syncNow: vi.fn(),
  requestCode: vi.fn(),
  verifyCode: vi.fn(),
  signOut: vi.fn(),
  listHistory: vi.fn(async () => []),
  fetchHistoryDoc: vi.fn(),
  enableReminders: vi.fn(async () => {}),
  disableReminders: vi.fn(async () => {}),
});

afterEach(() => vi.restoreAllMocks());

test('turning on daily reminders subscribes this device', async () => {
  vi.spyOn(push, 'remindersUnavailableReason').mockReturnValue('');
  vi.spyOn(push, 'remindersEnabled').mockResolvedValue(false);
  const sync = baseSync();
  render(<SyncModal isOpen onClose={() => {}} sync={sync} onRestore={() => {}} />);

  const box = screen.getByRole('checkbox', { name: /Daily reminder at 8am/ });
  expect(box).not.toBeChecked();
  fireEvent.click(box);
  await waitFor(() => expect(box).toBeChecked());
  expect(sync.enableReminders).toHaveBeenCalled();
});

test('a failure is shown and the box stays off', async () => {
  vi.spyOn(push, 'remindersUnavailableReason').mockReturnValue('');
  vi.spyOn(push, 'remindersEnabled').mockResolvedValue(false);
  const sync = { ...baseSync(), enableReminders: vi.fn(async () => { throw new Error('Notifications are blocked for Lists.'); }) };
  render(<SyncModal isOpen onClose={() => {}} sync={sync} onRestore={() => {}} />);

  fireEvent.click(screen.getByRole('checkbox', { name: /Daily reminder/ }));
  expect(await screen.findByText('Notifications are blocked for Lists.')).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /Daily reminder/ })).not.toBeChecked();
});

test('where push is unavailable the box is disabled with the reason', async () => {
  vi.spyOn(push, 'remindersUnavailableReason').mockReturnValue('Open Lists from its Home Screen icon.');
  vi.spyOn(push, 'remindersEnabled').mockResolvedValue(false);
  render(<SyncModal isOpen onClose={() => {}} sync={baseSync()} onRestore={() => {}} />);
  expect(screen.getByRole('checkbox', { name: /Daily reminder/ })).toBeDisabled();
  expect(screen.getByText('Open Lists from its Home Screen icon.')).toBeInTheDocument();
});
