import { createId } from '../utils/ids';
import { MAX_UNDO } from '../utils/constants';

export function trimStack(stack, max = MAX_UNDO) {
  return stack.slice(0, max);
}

export function createUndoEntry(message, snapshot) {
  return {
    id: createId(),
    message,
    lists: snapshot.lists,
    archived: snapshot.archived,
    customTags: snapshot.customTags,
  };
}

export function createRedoEntry(snapshot) {
  return {
    id: createId(),
    message: 'Redo',
    lists: snapshot.lists,
    archived: snapshot.archived,
    customTags: snapshot.customTags,
  };
}

export function popUndoEntry(stack) {
  if (!stack.length) return { entry: null, rest: stack };
  const [entry, ...rest] = stack;
  return { entry, rest };
}

export function popRedoEntry(stack) {
  if (!stack.length) return { entry: null, rest: stack };
  const [entry, ...rest] = stack;
  return { entry, rest };
}

export function applySnapshot(entry, { dispatch, setArchived, setCustomTags }) {
  dispatch({ type: 'RESTORE_SNAPSHOT', lists: entry.lists });
  setArchived(entry.archived);
  setCustomTags(entry.customTags || []);
}
