// Agent edits as pure functions of the synced doc. Each mutation goes through the
// app's own reducer (src/state/listsReducer.js), so an agent's edit means exactly
// what the same edit in the app means: history entries, recurring completion,
// blocker cleanup. Mutations return { doc, result } for updateRemoteDoc.
import { listsReducer } from '../src/state/listsReducer';

function apply(doc, action) {
  return { ...doc, lists: listsReducer(doc.lists, { ...action, customTags: doc.customTags }) };
}

/** A list by id, or by name ignoring case. Folders are excluded: they hold lists, not items. */
export function findList(doc, ref) {
  const lists = doc.lists.filter((l) => !l.isFolder);
  const byId = lists.find((l) => l.id === ref);
  if (byId) return byId;
  const key = String(ref).trim().toLowerCase();
  const matches = lists.filter((l) => l.name.trim().toLowerCase() === key);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(`Several lists are named "${ref}". Use an id: ${matches.map((l) => l.id).join(', ')}`);
  }
  throw new Error(`No list "${ref}". Lists: ${lists.map((l) => l.name).join(', ') || '(none)'}`);
}

function findItem(list, itemId) {
  const item = list.items.find((i) => i.id === itemId);
  if (!item) throw new Error(`No item ${itemId} in "${list.name}".`);
  return item;
}

function summarizeList(doc, list) {
  const done = list.items.filter((i) => i.complete).length;
  const parent = list.parentId && doc.lists.find((l) => l.id === list.parentId);
  return {
    id: list.id,
    name: list.name,
    icon: list.icon,
    color: list.color,
    ...(parent ? { folder: parent.name } : {}),
    open: list.items.length - done,
    done,
  };
}

function itemView(item) {
  const out = { id: item.id, text: item.text, complete: item.complete };
  if (item.description) out.description = item.description;
  if (item.dueDate) out.dueDate = item.dueDate;
  if (item.priority) out.priority = item.priority;
  if (item.tags.length) out.tags = item.tags;
  if (item.recurring !== 'none') out.recurring = item.recurring;
  if (item.subItems.length) out.subItems = item.subItems.map(({ text, complete }) => ({ text, complete }));
  return out;
}

export function listLists(doc) {
  return doc.lists.filter((l) => !l.isFolder).map((l) => summarizeList(doc, l));
}

export function getList(doc, ref) {
  const list = findList(doc, ref);
  return { ...summarizeList(doc, list), items: list.items.map(itemView) };
}

function addItemsTo(doc, listId, items) {
  let next = doc;
  items.forEach((item) => {
    next = apply(next, { type: 'ADD_ITEM', listId, ...item });
  });
  return next;
}

/** The app appends new lists and items, so the new ones are the last entries. */
const added = (before, after) => after.slice(before.length);

export function createList(doc, { name, icon, color, items = [] }) {
  let next = apply(doc, { type: 'ADD_LIST', name: name.trim(), icon, color });
  const list = next.lists[next.lists.length - 1];
  next = addItemsTo(next, list.id, items);
  return { doc: next, result: getList(next, list.id) };
}

export function addItems(doc, { list: ref, items }) {
  const list = findList(doc, ref);
  const next = addItemsTo(doc, list.id, items);
  const after = next.lists.find((l) => l.id === list.id).items;
  return { doc: next, result: { list: list.name, added: added(list.items, after).map(itemView) } };
}

export function updateItem(doc, { list: ref, itemId, text, complete, ...patch }) {
  const list = findList(doc, ref);
  const item = findItem(list, itemId);
  let next = doc;
  if (text !== undefined && text !== item.text) {
    next = apply(next, { type: 'RENAME_ITEM', listId: list.id, itemId, name: text });
  }
  if (Object.keys(patch).length) {
    next = apply(next, { type: 'UPDATE_ITEM', listId: list.id, itemId, patch });
  }
  if (complete !== undefined && complete !== item.complete) {
    next = apply(next, { type: 'TOGGLE_ITEM', listId: list.id, itemId });
  }
  return { doc: next, result: itemView(findItem(findList(next, list.id), itemId)) };
}

export function deleteItem(doc, { list: ref, itemId }) {
  const list = findList(doc, ref);
  const item = findItem(list, itemId);
  const next = apply(doc, { type: 'DELETE_ITEM', listId: list.id, itemId });
  return { doc: next, result: { deleted: item.text, list: list.name } };
}

export function updateList(doc, { list: ref, name, icon, color }) {
  const list = findList(doc, ref);
  let next = doc;
  if (name !== undefined) next = apply(next, { type: 'RENAME_LIST', listId: list.id, name: name.trim() });
  if (icon !== undefined || color !== undefined) {
    next = apply(next, { type: 'SET_LIST_STYLE', listId: list.id, icon, color });
  }
  return { doc: next, result: summarizeList(next, findList(next, list.id)) };
}

export function deleteList(doc, { list: ref }) {
  const list = findList(doc, ref);
  const next = apply(doc, { type: 'DELETE_LIST', listId: list.id });
  return { doc: next, result: { deleted: list.name, items: list.items.length } };
}
