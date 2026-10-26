// Read-only stand-in for user_state_history: list (newest first) and fetch one doc.
function historyQuery(db) {
  const filters = {};
  const q = {
    select() { return q; },
    order() { return q; },
    limit() { return q; },
    eq(col, val) { filters[col] = val; return q; },
    async single() {
      const row = db.history.find((h) => h.id === filters.id);
      return row ? { data: { doc: row.doc }, error: null } : { data: null, error: { message: 'not found' } };
    },
    then(resolve) {
      const rows = [...db.history].reverse().map(({ doc, ...meta }) => meta);
      return resolve({ data: rows, error: null });
    },
  };
  return q;
}

// In-memory stand-in for the user_state table, covering the query shapes sync.js uses.
export function fakeSupabase(initial = null, user = null, history = []) {
  const db = { row: initial, writes: 0, beforeWrite: null, history };
  const from = (table) => {
    if (table === 'user_state_history') return historyQuery(db);
    const filters = {};
    let op = null;
    let payload = null;
    const q = {
      select() { return q; },
      eq(col, val) { filters[col] = val; return q; },
      insert(data) { op = 'insert'; payload = data; return q; },
      update(data) { op = 'update'; payload = data; return q; },
      async maybeSingle() {
        return { data: db.row && { doc: JSON.parse(JSON.stringify(db.row.doc)), version: db.row.version }, error: null };
      },
      then(resolve) {
        db.beforeWrite?.();
        db.beforeWrite = null;
        if (op === 'insert') {
          if (db.row) return resolve({ data: null, error: { code: '23505' } });
          db.row = { ...payload };
        } else if (db.row && db.row.version === filters.version) {
          db.row = { ...db.row, ...payload };
        } else {
          return resolve({ data: [], error: null });
        }
        db.writes += 1;
        return resolve({ data: [{ version: db.row.version }], error: null });
      },
    };
    return q;
  };
  const auth = {
    async getSession() { return { data: { session: user ? { user } : null } }; },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
  };
  return { db, client: { from, auth } };
}

