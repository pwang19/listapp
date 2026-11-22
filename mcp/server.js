// MCP server that lets local agents (Claude Code in any project) read and edit
// your lists. It signs in as you, so row-level security still applies, and saves
// through the same compare-and-set as the app, so open devices merge its edits.
//
//   npm run build:mcp                 bundle to mcp/dist/server.js
//   node mcp/dist/server.js login     one-time email-code sign-in
//   claude mcp add --scope user listapp -- node <repo>/mcp/dist/server.js
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { createClient } from '@supabase/supabase-js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { updateRemoteDoc, normalizeSyncDoc } from '../src/utils/sync';
import { LIST_COLORS, LIST_ICONS } from '../src/utils/constants';
import * as ops from './listOps';

const SESSION_FILE = path.join(os.homedir(), '.config', 'listapp', 'agent-session.json');

// Auth storage on disk, owner-only: it holds a refresh token for your account.
const fileStorage = {
  read() {
    try {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    } catch {
      return {};
    }
  },
  write(data) {
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true, mode: 0o700 });
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data), { mode: 0o600 });
  },
  getItem(key) {
    return this.read()[key] ?? null;
  },
  setItem(key, value) {
    this.write({ ...this.read(), [key]: value });
  },
  removeItem(key) {
    const { [key]: _removed, ...rest } = this.read();
    this.write(rest);
  },
};

function connect() {
  // Inlined at build time from .env, like the app's own build.
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY were not set when this was built.');
  return createClient(url, key, {
    auth: { storage: fileStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
}

async function login(supabase) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const email = (await rl.question('Email: ')).trim();
    const sent = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (sent.error) throw sent.error;
    const token = (await rl.question('Code from the email: ')).trim();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    console.log(`Signed in as ${email}. Session saved to ${SESSION_FILE}`);
  } finally {
    rl.close();
  }
}

async function serve(supabase) {
  async function userId() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw new Error('Not signed in. Run: node <listapp>/mcp/dist/server.js login');
    }
    return data.session.user.id;
  }

  async function read() {
    const { data, error } = await supabase
      .from('user_state')
      .select('doc')
      .eq('user_id', await userId())
      .maybeSingle();
    if (error) throw error;
    return normalizeSyncDoc(data?.doc);
  }

  const reply = (handler) => async (args) => {
    try {
      return { content: [{ type: 'text', text: JSON.stringify(await handler(args), null, 2) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: err?.message || String(err) }], isError: true };
    }
  };
  const query = (op) => reply(async (args) => op(await read(), args));
  const mutation = (op) => reply(async (args) => updateRemoteDoc(supabase, await userId(), (doc) => op(doc, args)));

  const listRef = z.string().min(1).describe('List id, or its exact name (case-insensitive)');
  const date = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]);
  const itemFields = {
    description: z.string().optional().describe('Markdown notes'),
    dueDate: date.optional().describe('YYYY-MM-DD; empty string clears it'),
    priority: z.number().int().min(0).max(3).optional().describe('0 none, 1 high, 2 medium, 3 low'),
    tags: z.array(z.string()).optional().describe('Existing tag ids or labels; unknown tags are dropped'),
  };
  const newItem = z.object({ text: z.string().min(1), ...itemFields });
  const style = {
    icon: z.enum(LIST_ICONS).optional(),
    color: z.enum(LIST_COLORS.map((c) => c.id)).optional(),
  };

  const server = new McpServer({ name: 'listapp', version: '1.0.0' });
  const tool = (name, description, inputSchema, handler) =>
    server.registerTool(name, { description, inputSchema }, handler);

  tool('list_lists', 'All lists with id, name and open/done item counts.', {}, query(ops.listLists));
  tool('get_list', "A list's items, with the ids the edit tools take.", { list: listRef },
    query((doc, { list }) => ops.getList(doc, list)));
  tool('create_list', 'Create a list, optionally with items.',
    { name: z.string().trim().min(1), ...style, items: z.array(newItem).optional() },
    mutation(ops.createList));
  tool('add_items', 'Append items to a list.', { list: listRef, items: z.array(newItem).min(1) },
    mutation(ops.addItems));
  tool('update_item', 'Edit an item: text, notes, due date, priority, tags, or mark it complete.',
    { list: listRef, itemId: z.string(), text: z.string().min(1).optional(), complete: z.boolean().optional(), ...itemFields },
    mutation(ops.updateItem));
  tool('delete_item', 'Delete an item.', { list: listRef, itemId: z.string() }, mutation(ops.deleteItem));
  tool('update_list', 'Rename a list or change its icon or color.',
    { list: listRef, name: z.string().trim().min(1).optional(), ...style },
    mutation(ops.updateList));
  tool('delete_list', 'Delete a list and its items. Earlier versions stay restorable from the Sync dialog.',
    { list: listRef }, mutation(ops.deleteList));

  await server.connect(new StdioServerTransport());
}

const supabase = connect();
if (process.argv[2] === 'login') {
  login(supabase).then(
    () => process.exit(0),
    (err) => {
      console.error(err?.message || err);
      process.exit(1);
    }
  );
} else {
  serve(supabase);
}
