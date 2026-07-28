import { createId } from './ids';

export const MAX_HISTORY = 50;

/** @typedef {{ id: string; type: string; at: string; detail: string }} HistoryEntry */

/**
 * @param {string} type
 * @param {string} [detail]
 * @returns {HistoryEntry}
 */
export function createHistoryEntry(type, detail = '') {
  return { id: createId(), type, at: new Date().toISOString(), detail };
}

/**
 * @param {import('../types').Item} item
 * @param {HistoryEntry} entry
 */
export function appendHistory(item, entry) {
  const history = [...(item.history || []), entry].slice(-MAX_HISTORY);
  return { ...item, history };
}

const LABELS = {
  created: 'Created',
  completed: 'Completed',
  uncompleted: 'Marked incomplete',
  renamed: 'Renamed',
  moved: 'Moved',
  tagged: 'Tags updated',
  due_date: 'Due date changed',
  priority: 'Priority changed',
  recurring: 'Recurring changed',
  snoozed: 'Snoozed',
  unsnoozed: 'Snooze cleared',
  archived: 'Archived',
  description: 'Notes updated',
  sub_item_added: 'Sub-item added',
  sub_item_completed: 'Sub-item completed',
};

export function historyTypeLabel(type) {
  return LABELS[type] || type;
}

export function formatHistoryDetail(entry) {
  if (!entry.detail) return historyTypeLabel(entry.type);
  return `${historyTypeLabel(entry.type)}: ${entry.detail}`;
}
