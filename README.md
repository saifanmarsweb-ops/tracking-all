# LifeOS — personal day-ops console

A local-first life tracker: Finance, Budget, personal Daily Tasks, project-based IT work board,
a password vault with generator, and Notes.

**Database:** real [SQLite](https://www.sqlite.org/) running in the browser via
[sql.js](https://github.com/sql-js/sql.js) (SQLite compiled to WebAssembly). The whole dataset is one
SQLite database file, persisted to IndexedDB, and exportable as a genuine `lifeos.db` binary you can
open with any SQLite tool.

---

## Run it on your laptop

### 1. Install Node.js (once)

- Download the **LTS** installer from <https://nodejs.org> (v18 or newer).
- Verify:

```bash
node -v
npm -v
```

### 2. Get the project files

Copy this project folder anywhere, e.g. `~/projects/lifeos`, then open a terminal inside it:

```bash
cd ~/projects/lifeos
```

### 3. Install dependencies (once)

```bash
npm install
```

### 4. Start the dev server

```bash
npm run dev
```

Open the printed URL — usually **http://localhost:5173** — in your browser.
Everything you add is saved into the SQLite database automatically (watch the
`sqlite · xx.x kb · hh:mm:ss` line in the sidebar footer).

### 5. Production build (optional)

```bash
npm run build     # outputs to dist/
npm run preview   # serves the built app locally
```

---

## Your data

- **Where it lives:** an SQLite database kept in your browser's IndexedDB — offline, private, no server.
- **Back it up:** click **Export .db** (dashboard footer or sidebar) to download `lifeos-YYYY-MM-DD.db`.
- **Restore:** click **Restore** and pick a `.db` (or legacy `.json`) backup.
- **Move between devices:** export `.db` on one machine, restore it on the other.
- **Reset:** sidebar → Reset reseeds the demo dataset (wipes all tables).

### Open the database with normal SQLite tools

CLI:

```bash
sqlite3 lifeos-2026-01-01.db
.tables
SELECT * FROM tasks;
SELECT category, SUM(amount) FROM transactions WHERE type='expense' GROUP BY category;
```

Or use [DB Browser for SQLite](https://sqlitebrowser.org/) — *File → Open Database* → pick the `.db`.

### Schema

| table          | columns                                                              |
| -------------- | -------------------------------------------------------------------- |
| `meta`         | key, value (app settings like your name)                             |
| `transactions` | id, type, amount, category, note, date                               |
| `budgets`      | id, category, limit                                                  |
| `tasks`        | id, title, done, priority, due, createdAt                            |
| `projects`     | id, name, code, color, createdAt                                     |
| `work`         | id, projectId, seq, title, tag, priority, status, due                |
| `vault`        | id, site, username, password, url, favorite, updatedAt               |
| `notes`        | id, title, body, color, pinned, updatedAt                            |

---

## Troubleshooting

- **Port 5173 busy?** Vite picks the next free port automatically — check the terminal output.
- **Blank page after update?** Hard-refresh (Ctrl/Cmd+Shift+R); the WASM asset may be cached.
- **Want a clean slate?** Export a backup first, then sidebar → Reset.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS v4 · sql.js (SQLite/WASM) · IndexedDB persistence
