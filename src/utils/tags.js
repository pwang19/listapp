import { TAG_PALETTE, CUSTOM_TAG_COLORS } from './constants';
import { createId } from './ids';

export function resolveTagId(tagInput, customTags = []) {
  const raw = tagInput.trim().toLowerCase();
  if (!raw) return '';
  const all = getAllTags(customTags);
  const direct = all.find((t) => t.id === raw);
  if (direct) return direct.id;
  const byLabel = all.find((t) => t.label.toLowerCase() === raw);
  if (byLabel) return byLabel.id;
  const byAlias = (customTags || []).find((t) =>
    (t.aliases || []).some((a) => a.toLowerCase() === raw)
  );
  return byAlias?.id || raw;
}

export function getAllTags(customTags = []) {
  const custom = (customTags || []).map((t) => ({
    id: t.id,
    label: t.label,
    color: t.color,
    parentId: t.parentId || '',
    aliases: t.aliases || [],
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
