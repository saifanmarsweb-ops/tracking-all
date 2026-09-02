import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  Note,
  Priority,
  Task,
  Transaction,
  VaultEntry,
  WorkStatus,
} from "../lib/types";
import { buildSeed } from "../lib/seed";
import { todayISO, uid } from "../lib/utils";
import { exportDbBytes, getDb, idbSave, initDb, openDbBytes, readState, writeState } from "../db/sqlite";

export type ToastKind = "ok" | "warn" | "err";
export interface Toast {
  id: string;
  msg: string;
  kind: ToastKind;
}

export interface DbStats {
  ready: boolean;
  saving: boolean;
  bytes: number;
  savedAt: string | null; // hh:mm:ss
}

interface StoreCtx {
  state: AppState;
  db: DbStats;
  toasts: Toast[];
  toast: (msg: string, kind?: ToastKind) => void;
  setName: (name: string) => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (category: string, limit: number) => void;
  setBudgetLimit: (id: string, limit: number) => void;
  deleteBudget: (id: string) => void;
  addTask: (title: string, priority: Priority, due: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearDoneTasks: () => void;
  addWork: (w: { title: string; tag: string; priority: Priority; due?: string; projectId: string }) => void;
  moveWork: (id: string, status: WorkStatus) => void;
  deleteWork: (id: string) => void;
  addProject: (p: { name: string; code: string; color: string }) => string;
  updateProject: (id: string, patch: { name?: string; code?: string; color?: string }) => void;
  deleteProject: (id: string) => void;
  addVault: (e: Omit<VaultEntry, "id" | "updatedAt" | "favorite"> & { favorite?: boolean }) => void;
  updateVault: (id: string, patch: Partial<VaultEntry>) => void;
  deleteVault: (id: string) => void;
  toggleVaultFav: (id: string) => void;
  addNote: (n: { title: string; body: string; color: string; pinned: boolean }) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  replaceState: (next: Partial<AppState>) => void;
  resetToSeed: () => void;
  exportDb: () => Uint8Array | null;
  importDbFile: (file: File) => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(buildSeed);
  const [stats, setStats] = useState<DbStats>({ ready: false, saving: false, bytes: 0, savedAt: null });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);
  const saveTimer = useRef<number | null>(null);

  const toast = useCallback((msg: string, kind: ToastKind = "ok") => {
    const id = uid();
    setToasts((ts) => [...ts.slice(-3), { id, msg, kind }]);
    timers.current.push(
      window.setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2600)
    );
  }, []);

  /* boot: open (or create + seed) the SQLite database */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { database } = await initDb();
        if (!alive) return;
        const loaded = readState(database);
        setState(loaded);
        setStats({ ready: true, saving: false, bytes: database.export().length, savedAt: null });
      } catch {
        if (!alive) return;
        // fallback: in-memory seeded db so the app still works
        setState(buildSeed());
        setStats({ ready: true, saving: false, bytes: 0, savedAt: null });
        toast("Couldn't open local database — running in memory", "err");
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* debounced persistence of every change into SQLite + IndexedDB */
  useEffect(() => {
    if (!stats.ready) return;
    setStats((s) => ({ ...s, saving: true }));
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const database = getDb();
      if (!database) return;
      try {
        writeState(database, state);
        const bytes = exportDbBytes(database);
        await idbSave(bytes);
        setStats((s) => ({
          ...s,
          saving: false,
          bytes: bytes.length,
          savedAt: new Date().toLocaleTimeString("en-US", { hour12: false }),
        }));
      } catch {
        setStats((s) => ({ ...s, saving: false }));
      }
    }, 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state, stats.ready]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const api = useMemo<StoreCtx>(
    () => ({
      state,
      db: stats,
      toasts,
      toast,
      setName: (name) => setState((s) => ({ ...s, name })),
      addTransaction: (t) =>
        setState((s) => ({ ...s, transactions: [{ ...t, id: uid() }, ...s.transactions] })),
      deleteTransaction: (id) =>
        setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) })),
      addBudget: (category, limit) =>
        setState((s) => ({ ...s, budgets: [...s.budgets, { id: uid(), category, limit }] })),
      setBudgetLimit: (id, limit) =>
        setState((s) => ({
          ...s,
          budgets: s.budgets.map((b) => (b.id === id ? { ...b, limit } : b)),
        })),
      deleteBudget: (id) =>
        setState((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== id) })),
      addTask: (title, priority, due) =>
        setState((s) => ({
          ...s,
          tasks: [
            { id: uid(), title, done: false, priority, due, createdAt: todayISO() },
            ...s.tasks,
          ],
        })),
      toggleTask: (id) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      deleteTask: (id) => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
      clearDoneTasks: () => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => !t.done) })),
      addWork: (w) => {
        const seq =
          state.work
            .filter((x) => x.projectId === w.projectId)
            .reduce((m, x) => Math.max(m, x.seq), 0) + 1;
        setState((s) => ({
          ...s,
          work: [{ id: uid(), seq, status: "backlog" as WorkStatus, ...w }, ...s.work],
        }));
      },
      moveWork: (id, status) =>
        setState((s) => ({
          ...s,
          work: s.work.map((t) => (t.id === id ? { ...t, status } : t)),
        })),
      deleteWork: (id) => setState((s) => ({ ...s, work: s.work.filter((t) => t.id !== id) })),
      addProject: (p) => {
        const id = uid();
        setState((s) => ({
          ...s,
          projects: [...s.projects, { ...p, id, createdAt: todayISO() }],
        }));
        return id;
      },
      updateProject: (id, patch) =>
        setState((s) => ({
          ...s,
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deleteProject: (id) =>
        setState((s) => ({
          ...s,
          projects: s.projects.filter((p) => p.id !== id),
          work: s.work.filter((w) => w.projectId !== id),
        })),
      addVault: (e) =>
        setState((s) => ({
          ...s,
          vault: [
            { ...e, favorite: e.favorite ?? false, id: uid(), updatedAt: todayISO() },
            ...s.vault,
          ],
        })),
      updateVault: (id, patch) =>
        setState((s) => ({
          ...s,
          vault: s.vault.map((v) => (v.id === id ? { ...v, ...patch, updatedAt: todayISO() } : v)),
        })),
      deleteVault: (id) =>
        setState((s) => ({ ...s, vault: s.vault.filter((v) => v.id !== id) })),
      toggleVaultFav: (id) =>
        setState((s) => ({
          ...s,
          vault: s.vault.map((v) => (v.id === id ? { ...v, favorite: !v.favorite } : v)),
        })),
      addNote: (n) =>
        setState((s) => ({
          ...s,
          notes: [{ ...n, id: uid(), updatedAt: todayISO() }, ...s.notes],
        })),
      updateNote: (id, patch) =>
        setState((s) => ({
          ...s,
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: todayISO() } : n)),
        })),
      deleteNote: (id) => setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) })),
      togglePin: (id) =>
        setState((s) => ({
          ...s,
          notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
        })),
      replaceState: (next) =>
        setState(() => ({
          name: next.name ?? "Alex",
          transactions: next.transactions ?? [],
          budgets: next.budgets ?? [],
          tasks: next.tasks ?? [],
          projects: next.projects ?? [],
          work: next.work ?? [],
          vault: next.vault ?? [],
          notes: next.notes ?? [],
        })),
      resetToSeed: () => setState(() => buildSeed()),
      exportDb: () => {
        const database = getDb();
        return database ? exportDbBytes(database) : null;
      },
      importDbFile: async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const loaded = await openDbBytes(bytes);
        setState(loaded);
      },
    }),
    [state, stats, toasts, toast]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
