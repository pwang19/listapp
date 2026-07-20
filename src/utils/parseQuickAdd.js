const DATE_RE = /^(\d{4}-\d{2}-\d{2})$/;
const TAG_RE = /#([a-zA-Z0-9_-]+)/g;
const PRIORITY_RE = /!(p?[123]|high|medium|low)\b/i;
const DUE_RE = /!(\d{4}-\d{2}-\d{2})\b/;

const PRIORITY_MAP = { p1: 1, p2: 2, p3: 3, low: 1, medium: 2, high: 3, 1: 1, 2: 2, 3: 3 };

export function parseQuickAdd(input) {
  let text = input.trim();
  const tags = [];
  const tagMatches = [...text.matchAll(TAG_RE)];
  tagMatches.forEach((m) => {
    const id = m[1].toLowerCase();
    if (!tags.includes(id)) tags.push(id);
  });
  text = text.replace(TAG_RE, '').trim();

  let dueDate = '';
  const dueMatch = text.match(DUE_RE);
  if (dueMatch) {
    dueDate = dueMatch[1];
    text = text.replace(DUE_RE, '').trim();
  }

  let priority = 0;
  const priMatch = text.match(PRIORITY_RE);
  if (priMatch) {
    const key = priMatch[1].toLowerCase();
    priority = PRIORITY_MAP[key] ?? 0;
    text = text.replace(PRIORITY_RE, '').trim();
  }

  text = text.replace(/\s+/g, ' ').trim();
  return { text, tags, dueDate, priority };
}

export function isValidDateString(s) {
  return DATE_RE.test(s);
}
