export function formatEstimate(minutes) {
  if (!minutes || minutes <= 0) return '';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function parseEstimateToken(token) {
  const match = String(token).match(/^(\d+)(m|h|min|hr|hours?)?$/i);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = (match[2] || 'm').toLowerCase();
  if (unit.startsWith('h')) return value * 60;
  return value;
}
