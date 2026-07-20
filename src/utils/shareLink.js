export function encodeListToHash(list) {
  try {
    const payload = { name: list.name, icon: list.icon, color: list.color, items: list.items };
    const json = JSON.stringify(payload);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return `#share=${encoded}`;
  } catch {
    return '';
  }
}

export function decodeListFromHash(hash) {
  try {
    const match = hash.match(/#share=([A-Za-z0-9+/=]+)/);
    if (!match) return null;
    const json = decodeURIComponent(escape(atob(match[1])));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
