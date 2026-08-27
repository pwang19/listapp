import { parseQuickAdd } from './parseQuickAdd';

/**
 * @param {string} text multiline input
 */
export function parseBatchQuickAdd(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseQuickAdd(line));
}
