export type Section =
  | "dashboard"
  | "finance"
  | "budget"
  | "tasks"
  | "work"
  | "vault"
  | "notes";

export type Priority = "low" | "med" | "high";

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string; // ISO yyyy-mm-dd
}

export interface Budget {
  id: string;
  category: string; // expense category id
  limit: number;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  due: string; // ISO
  createdAt: string;
}

export type WorkStatus = "backlog" | "doing" | "review" | "done";

export interface Project {
  id: string;
  name: string;
  code: string; // 2–5 char ticket prefix, e.g. ATL
  color: string;
  createdAt: string;
}

export interface WorkTask {
  id: string;
  seq: number;
  projectId: string;
  title: string;
  tag: string;
  priority: Priority;
  status: WorkStatus;
  due?: string;
}

export interface VaultEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  url?: string;
  favorite: boolean;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  color: string; // palette id
  pinned: boolean;
  updatedAt: string;
}

export interface AppState {
  name: string;
  transactions: Transaction[];
  budgets: Budget[];
  tasks: Task[];
  projects: Project[];
  work: WorkTask[];
  vault: VaultEntry[];
  notes: Note[];
}

/* ---------------- meta ---------------- */

export interface CategoryMeta {
  id: string;
  label: string;
  color: string;
}

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { id: "housing", label: "Housing", color: "#7fb4f0" },
  { id: "groceries", label: "Groceries", color: "#63d68c" },
  { id: "dining", label: "Dining out", color: "#f5a94b" },
  { id: "transport", label: "Transport", color: "#5bc8f5" },
  { id: "bills", label: "Utilities & bills", color: "#c79bf2" },
  { id: "health", label: "Health", color: "#f27e9d" },
  { id: "fun", label: "Fun & leisure", color: "#ead163" },
  { id: "shopping", label: "Shopping", color: "#f2705b" },
  { id: "subs", label: "Subscriptions", color: "#8fd3c7" },
  { id: "other", label: "Other", color: "#8a93a6" },
];

export const INCOME_CATEGORIES: CategoryMeta[] = [
  { id: "salary", label: "Salary", color: "#3ecf8e" },
  { id: "freelance", label: "Freelance", color: "#5bc8f5" },
  { id: "invest", label: "Investments", color: "#c79bf2" },
  { id: "gift", label: "Gifts & other", color: "#ead163" },
];

export const ALL_CATEGORIES: CategoryMeta[] = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
];

export function catById(id: string): CategoryMeta {
  return (
    ALL_CATEGORIES.find((c) => c.id === id) ?? {
      id,
      label: id,
      color: "#8a93a6",
    }
  );
}

export const WORK_TAGS: Record<string, { label: string; color: string }> = {
  dev: { label: "dev", color: "#5bc8f5" },
  devops: { label: "devops", color: "#3ecf8e" },
  security: { label: "security", color: "#f2705b" },
  support: { label: "support", color: "#f5b84b" },
  meeting: { label: "meeting", color: "#c79bf2" },
  docs: { label: "docs", color: "#8fd3c7" },
};

export const WORK_COLUMNS: { id: WorkStatus; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "#8a93a6" },
  { id: "doing", label: "In progress", color: "#5bc8f5" },
  { id: "review", label: "Review", color: "#f5b84b" },
  { id: "done", label: "Done", color: "#3ecf8e" },
];

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  low: { label: "Low", color: "#8a93a6" },
  med: { label: "Medium", color: "#f5b84b" },
  high: { label: "High", color: "#f2705b" },
};

export const PROJECT_COLORS = [
  "#5bc8f5",
  "#3ecf8e",
  "#f5b84b",
  "#f2705b",
  "#c79bf2",
  "#f27e9d",
  "#8fd3c7",
  "#ead163",
];

export const NOTE_COLORS: Record<string, { bg: string; border: string; ink: string }> = {
  amber: { bg: "rgba(245,184,75,0.07)", border: "rgba(245,184,75,0.32)", ink: "#f5b84b" },
  mint: { bg: "rgba(62,207,142,0.07)", border: "rgba(62,207,142,0.32)", ink: "#3ecf8e" },
  aqua: { bg: "rgba(91,200,245,0.07)", border: "rgba(91,200,245,0.32)", ink: "#5bc8f5" },
  coral: { bg: "rgba(242,112,91,0.07)", border: "rgba(242,112,91,0.32)", ink: "#f2705b" },
  lav: { bg: "rgba(199,155,242,0.07)", border: "rgba(199,155,242,0.32)", ink: "#c79bf2" },
};

export const MONOGRAM_COLORS = [
  "#3ecf8e",
  "#5bc8f5",
  "#f5b84b",
  "#f2705b",
  "#c79bf2",
  "#f27e9d",
  "#8fd3c7",
  "#ead163",
];
