import { normalizeLists, normalizeList, normalizeItem } from './normalizeLists';
import { createId } from './ids';

function mergeItems(existingItems, incomingItems) {
  const byId = new Map(existingItems.map((item) => [item.id, item]));
  const byText = new Map(
    existingItems.map((item) => [item.text.trim().toLowerCase(), item])
  );
  const merged = [...existingItems];

  incomingItems.forEach((raw) => {
    const incoming = normalizeItem(raw);
    if (byId.has(incoming.id)) {
      const idx = merged.findIndex((item) => item.id === incoming.id);
      merged[idx] = {
        ...merged[idx],
        ...incoming,
        subItems:
          incoming.subItems.length > 0 ? incoming.subItems : merged[idx].subItems,
      };
      return;
    }
    const textKey = incoming.text.trim().toLowerCase();
    if (textKey && byText.has(textKey)) {
      const existing = byText.get(textKey);
      const idx = merged.findIndex((item) => item.id === existing.id);
      merged[idx] = {
        ...existing,
        ...incoming,
        id: existing.id,
        subItems:
          incoming.subItems.length > 0 ? incoming.subItems : existing.subItems,
      };
      return;
    }
    const withId = { ...incoming, id: createId() };
    merged.push(withId);
    byId.set(withId.id, withId);
    if (textKey) byText.set(textKey, withId);
  });

  return merged;
}

/**
 * Merge imported lists into existing ones by id, then by name (case-insensitive).
 * New lists are appended. Items merge by id, then by text.
 */
export function mergeLists(existingLists, importedData) {
  const result = normalizeLists(importedData);
  if (!result.ok) return result;

  const next = existingLists.map((list) => ({ ...list, items: [...list.items] }));
  const byId = new Map(next.map((list) => [list.id, list]));
  const byName = new Map(next.map((list) => [list.name.trim().toLowerCase(), list]));

  result.lists.forEach((incoming) => {
    let target = byId.get(incoming.id);
    if (!target) {
      const nameKey = incoming.name.trim().toLowerCase();
      target = nameKey ? byName.get(nameKey) : null;
    }

    if (target) {
      const idx = next.findIndex((list) => list.id === target.id);
      next[idx] = {
        ...target,
        name: incoming.name || target.name,
        color: incoming.color || target.color,
        icon: incoming.icon || target.icon,
        items: mergeItems(target.items, incoming.items),
      };
      byId.set(next[idx].id, next[idx]);
      byName.set(next[idx].name.trim().toLowerCase(), next[idx]);
    } else {
      const fresh = normalizeList({
        ...incoming,
        id: createId(),
        items: incoming.items.map((item) => ({ ...item, id: createId() })),
      });
      next.push(fresh);
      byId.set(fresh.id, fresh);
      byName.set(fresh.name.trim().toLowerCase(), fresh);
    }
  });

  return { ok: true, lists: next };
}
