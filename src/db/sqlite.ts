import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import type { AppState, Budget, Note, Project, Task, Transaction, VaultEntry, WorkTask } from "../lib/types";
import { buildSeed } from "../lib/seed";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY, type TEXT, amount REAL, category TEXT, note TEXT, date TEXT
);
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY, category TEXT, "limit" REAL
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY, title TEXT, done INTEGER, priority TEXT, due TEXT, createdAt TEXT
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, name TEXT, code TEXT, color TEXT, createdAt TEXT
);
CREATE TABLE IF NOT EXISTS work (
  id TEXT PRIMARY KEY, projectId TEXT, seq INTEGER, title TEXT, tag TEXT, priority TEXT, status TEXT, due TEXT
);
CREATE TABLE IF NOT EXISTS vault (
  id TEXT PRIMARY KEY, site TEXT, username TEXT, password TEXT, url TEXT, favorite INTEGER, updatedAt TEXT
);
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY, title TEXT, body TEXT, color TEXT, pinned INTEGER, updatedAt TEXT
);
`;

const IDB_NAME = "lifeos";
const IDB_STORE = "sqlite";
const IDB_KEY = "main";

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

/* ---------------- IndexedDB helpers ---------------- */

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbLoad(): Promise<Uint8Array | null> {
  try {
    const conn = await idbOpen();
    return await new Promise((resolve, reject) => {
      const tx = conn.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as Uint8Array) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbSave(bytes: Uint8Array): Promise<void> {
  const conn = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = conn.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------------- SQLite lifecycle ---------------- */

export async function getSQL(): Promise<SqlJsStatic> {
  if (!SQL) SQL = await initSqlJs({ locateFile: () => wasmUrl });
  return SQL;
}

export function getDb(): Database | null {
  return db;
}

/** Boot the database: open saved file from IndexedDB, or create + seed a fresh one. */
export async function initDb(): Promise<{ database: Database; fresh: boolean }> {
  const sql = await getSQL();
  const saved = await idbLoad();
  if (saved && saved.byteLength > 0) {
    db = new sql.Database(saved);
    return { database: db, fresh: false };
  }
  db = new sql.Database();
  db.run(SCHEMA);
  writeState(db, buildSeed());
  await idbSave(db.export());
  return { database: db, fresh: true };
}

/* ---------------- read / write ---------------- */

type Row = { [col: string]: number | string | Uint8Array | null };

function rows(database: Database, sql: string): Row[] {
  const res = database.exec(sql);
  if (res.length === 0) return [];
  const { columns, values } = res[0];
  return values.map((v) => {
    const r: Row = {};
    columns.forEach((c, i) => (r[c] = v[i]));
    return r;
  });
}

const b = (v: number | string | Uint8Array | null): number => Number(v ?? 0);
const s = (v: number | string | Uint8Array | null): string => String(v ?? "");
const so = (v: number | string | Uint8Array | null): string | undefined =>
  v === null || v === undefined ? undefined : String(v);

export function readState(database: Database): AppState {
  const meta = rows(database, "SELECT value FROM meta WHERE key='name'");
  const transactions: Transaction[] = rows(database, "SELECT * FROM transactions ORDER BY date DESC").map((r) => ({
    id: s(r.id),
    type: r.type === "income" ? "income" : "expense",
    amount: Number(r.amount ?? 0),
    category: s(r.category),
    note: s(r.note),
    date: s(r.date),
  }));
  const budgets: Budget[] = rows(database, 'SELECT * FROM budgets').map((r) => ({
    id: s(r.id),
    category: s(r.category),
    limit: Number(r.limit ?? 0),
  }));
  const tasks: Task[] = rows(database, "SELECT * FROM tasks").map((r) => ({
    id: s(r.id),
    title: s(r.title),
    done: b(r.done) === 1,
    priority: (r.priority as Task["priority"]) ?? "med",
    due: s(r.due),
    createdAt: s(r.createdAt),
  }));
  const projects: Project[] = rows(database, "SELECT * FROM projects").map((r) => ({
    id: s(r.id),
    name: s(r.name),
    code: s(r.code),
    color: s(r.color),
    createdAt: s(r.createdAt),
  }));
  const work: WorkTask[] = rows(database, "SELECT * FROM work").map((r) => ({
    id: s(r.id),
    projectId: s(r.projectId),
    seq: Number(r.seq ?? 0),
    title: s(r.title),
    tag: s(r.tag),
    priority: (r.priority as WorkTask["priority"]) ?? "med",
    status: (r.status as WorkTask["status"]) ?? "backlog",
    due: so(r.due),
  }));
  const vault: VaultEntry[] = rows(database, "SELECT * FROM vault").map((r) => ({
    id: s(r.id),
    site: s(r.site),
    username: s(r.username),
    password: s(r.password),
    url: so(r.url),
    favorite: b(r.favorite) === 1,
    updatedAt: s(r.updatedAt),
  }));
  const notes: Note[] = rows(database, "SELECT * FROM notes").map((r) => ({
    id: s(r.id),
    title: s(r.title),
    body: s(r.body),
    color: s(r.color),
    pinned: b(r.pinned) === 1,
    updatedAt: s(r.updatedAt),
  }));

  return {
    name: meta.length ? s(meta[0].value) : "Alex",
    transactions,
    budgets,
    tasks,
    projects,
    work,
    vault,
    notes,
  };
}

export function writeState(database: Database, st: AppState): void {
  database.run("BEGIN");
  database.run("DELETE FROM meta");
  database.run("DELETE FROM transactions");
  database.run("DELETE FROM budgets");
  database.run("DELETE FROM tasks");
  database.run("DELETE FROM projects");
  database.run("DELETE FROM work");
  database.run("DELETE FROM vault");
  database.run("DELETE FROM notes");

  const ins = (sql: string, params: (number | string | null)[]) => {
    const stmt = database.prepare(sql);
    stmt.run(params);
    stmt.free();
  };

  ins("INSERT INTO meta (key, value) VALUES ('name', ?)", [st.name]);
  for (const t of st.transactions)
    ins("INSERT INTO transactions VALUES (?,?,?,?,?,?)", [t.id, t.type, t.amount, t.category, t.note, t.date]);
  for (const bg of st.budgets) ins('INSERT INTO budgets VALUES (?,?,?)', [bg.id, bg.category, bg.limit]);
  for (const tk of st.tasks)
    ins("INSERT INTO tasks VALUES (?,?,?,?,?,?)", [tk.id, tk.title, tk.done ? 1 : 0, tk.priority, tk.due, tk.createdAt]);
  for (const p of st.projects)
    ins("INSERT INTO projects VALUES (?,?,?,?,?)", [p.id, p.name, p.code, p.color, p.createdAt]);
  for (const w of st.work)
    ins("INSERT INTO work VALUES (?,?,?,?,?,?,?,?)", [w.id, w.projectId, w.seq, w.title, w.tag, w.priority, w.status, w.due ?? null]);
  for (const v of st.vault)
    ins("INSERT INTO vault VALUES (?,?,?,?,?,?,?)", [v.id, v.site, v.username, v.password, v.url ?? null, v.favorite ? 1 : 0, v.updatedAt]);
  for (const n of st.notes)
    ins("INSERT INTO notes VALUES (?,?,?,?,?,?,?)", [n.id, n.title, n.body, n.color, n.pinned ? 1 : 0, n.updatedAt]);

  database.run("COMMIT");
}

/** Serialize the current database to a real SQLite binary file payload. */
export function exportDbBytes(database: Database): Uint8Array {
  return database.export();
}

/** Open an uploaded .db file, validate it, and swap it in as the live database. */
export async function openDbBytes(bytes: Uint8Array): Promise<AppState> {
  const sql = await getSQL();
  const candidate = new sql.Database(bytes);
  // throws if the schema is missing required tables
  const st = readState(candidate);
  if (!Array.isArray(st.tasks)) throw new Error("invalid");
  candidate.close();
  if (db) db.close();
  db = new sql.Database(bytes);
  await idbSave(db.export());
  return st;
}
