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
  Project,
  Transaction,
  VaultEntry,
  WorkStatus,
  WorkTask,
} from "../lib/types";
import { buildSeed } from "../lib/seed";
import { todayISO, uid } from "../lib/utils";

const KEY = "lifeos.state.v1";

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AppState>;
      if (
        p &&
        Array.isArray(p.transactions) &&
        Array.isArray(p.tasks) &&
        Array.isArray(p.work) &&
        Array.isArray(p.vault) &&
        Array.isArray(p.notes) &&
        Array.isArray(p.budgets)
      ) {
        let projects = Array.isArray(p.projects) ? p.projects : null;
        let work = p.work as WorkTask[];
        if (!projects || projects.length === 0) {
          // migrate from the pre-project version
          const gen: Project = {
            id: "proj-general",
            name: "General IT",
            code: "GEN",
            color: "#5bc8f5",
            createdAt: todayISO(),
          };
          projects = [gen];
          work = work.map((w) => ({ ...w, projectId: w.projectId ?? gen.id }));
        } else {
          const known = new Set(projects.map((pr) => pr.id));
          const fallback = projects[0].id;
          work = work.map((w) =>
            w.projectId && known.has(w.projectId) ? w : { ...w, projectId: fallback }
          );
        }
        return {
          name: p.name ?? "Alex",
          transactions: p.transactions,
          budgets: p.budgets,
          tasks: p.tasks,
          projects,
          work,
          vault: p.vault,
          notes: p.notes,
        };
      }
    }
  } catch {
    /* corrupted -> reseed */
  }
  return buildSeed();
}

export type ToastKind = "ok" | "warn" | "err";
export interface Toast {
  id: string;
  msg: string;
  kind: ToastKind;
}

interface StoreCtx {
  state: AppState;
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
  addProject: (p: { name: string; code: string; color: string }) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addWork: (w: {
    title: string;
    tag: string;
    priority: Priority;
    due?: string;
    projectId: string;
  }) => void;
  moveWork: (id: string, status: WorkStatus) => void;
  deleteWork: (id: string) => void;
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
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full — ignore */
    }
  }, [state]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const toast = useCallback((msg: string, kind: ToastKind = "ok") => {
    const id = uid();
    setToasts((ts) => [...ts.slice(-3), { id, msg, kind }]);
    timers.current.push(
      window.setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2600)
    );
  }, []);

  const api = useMemo<StoreCtx>(
    () => ({
      state,
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
      addProject: (p) =>
        setState((s) => ({
          ...s,
          projects: [
            ...s.projects,
            { id: uid(), name: p.name, code: p.code.toUpperCase(), color: p.color, createdAt: todayISO() },
          ],
        })),
      updateProject: (id, patch) =>
        setState((s) => ({
          ...s,
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, code: (patch.code ?? p.code).toUpperCase() } : p
          ),
        })),
      deleteProject: (id) =>
        setState((s) => ({
          ...s,
          projects: s.projects.filter((p) => p.id !== id),
          work: s.work.filter((w) => w.projectId !== id),
        })),
      addWork: (w) =>
        setState((s) => {
          const seq =
            s.work.filter((t) => t.projectId === w.projectId).reduce((m, t) => Math.max(m, t.seq), 0) + 1;
          return {
            ...s,
            work: [{ id: uid(), seq, status: "backlog" as WorkStatus, ...w }, ...s.work],
          };
        }),
      moveWork: (id, status) =>
        setState((s) => ({
          ...s,
          work: s.work.map((t) => (t.id === id ? { ...t, status } : t)),
        })),
      deleteWork: (id) => setState((s) => ({ ...s, work: s.work.filter((t) => t.id !== id) })),
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
    }),
    [state, toasts, toast]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
