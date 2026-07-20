import { TAG_PALETTE, CUSTOM_TAG_COLORS } from './constants';
import { createId } from './ids';

export function getAllTags(customTags = []) {
  const custom = (customTags || []).map((t) => ({
    id: t.id,
    label: t.label,
    color: t.color,
    custom: true,
  }));
  const builtIn = TAG_PALETTE.map((t) => ({ ...t, custom: false }));
  const builtInIds = new Set(builtIn.map((t) => t.id));
  return [...builtIn, ...custom.filter((t) => !builtInIds.has(t.id))];
}

export function getTagById(tagId, customTags = []) {
  return getAllTags(customTags).find((t) => t.id === tagId) || null;
}

export function slugifyTag(label) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

export function createCustomTag(label, existingTags = []) {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const slug = slugifyTag(trimmed);
  const id = slug || createId();
  const all = getAllTags(existingTags);
  if (all.some((t) => t.id === id || t.label.toLowerCase() === trimmed.toLowerCase())) {
    return all.find((t) => t.label.toLowerCase() === trimmed.toLowerCase()) || null;
  }
  const colorIndex = existingTags.length % CUSTOM_TAG_COLORS.length;
  return { id, label: trimmed, color: CUSTOM_TAG_COLORS[colorIndex] };
}
