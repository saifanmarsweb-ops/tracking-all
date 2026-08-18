import type { AppState, Task, Transaction, VaultEntry, WorkTask, Note, Budget } from "./types";
import { addDaysISO, daysAgoISO, todayISO, uid } from "./utils";

export function buildSeed(): AppState {
  const today = todayISO();
  const T = (
    type: Transaction["type"],
    amount: number,
    category: string,
    note: string,
    back: number
  ): Transaction => ({ id: uid(), type, amount, category, note, date: daysAgoISO(back) });

  const transactions: Transaction[] = [
    // last month (for comparison)
    T("income", 4200, "salary", "Monthly salary — Acme Corp", 43),
    T("expense", 1450, "housing", "Rent — Maple St. apartment", 42),
    T("expense", 86.4, "groceries", "Weekly grocery run", 40),
    T("expense", 42.5, "dining", "Ramen night with the team", 38),
    T("expense", 79, "bills", "Fiber internet", 36),
    T("expense", 15.49, "subs", "Netflix", 34),
    T("expense", 64, "transport", "Metro pass + fuel", 33),
    T("expense", 118, "shopping", "Running shoes", 31),
    // this month
    T("income", 4200, "salary", "Monthly salary — Acme Corp", 12),
    T("income", 650, "freelance", "Landing page gig — Nova Labs", 3),
    T("expense", 1450, "housing", "Rent — Maple St. apartment", 12),
    T("expense", 92.15, "bills", "Electricity bill", 10),
    T("expense", 79, "bills", "Fiber internet", 9),
    T("expense", 61.2, "groceries", "Groceries — fresh market", 8),
    T("expense", 11.99, "subs", "Spotify", 7),
    T("expense", 2.99, "subs", "iCloud 200GB", 7),
    T("expense", 15.49, "subs", "Netflix", 6),
    T("expense", 24.8, "dining", "Coffee + brunch", 5),
    T("expense", 38, "transport", "Fuel top-up", 4),
    T("expense", 45, "health", "Gym membership", 4),
    T("expense", 73.4, "groceries", "Groceries — weekend stock", 2),
    T("expense", 32, "fun", "Cinema — Dune marathon", 1),
    T("expense", 18.6, "dining", "Team lunch", 0),
  ];

  const budgets: Budget[] = [
    { id: uid(), category: "groceries", limit: 420 },
    { id: uid(), category: "dining", limit: 220 },
    { id: uid(), category: "transport", limit: 140 },
    { id: uid(), category: "bills", limit: 260 },
    { id: uid(), category: "health", limit: 90 },
    { id: uid(), category: "fun", limit: 120 },
    { id: uid(), category: "shopping", limit: 180 },
    { id: uid(), category: "subs", limit: 60 },
  ];

  const tasks: Task[] = [
    { id: uid(), title: "Review PR #482 — OAuth token refresh", done: false, priority: "high", due: today, createdAt: daysAgoISO(1) },
    { id: uid(), title: "Ship weekly status report to Dana", done: false, priority: "high", due: today, createdAt: daysAgoISO(1) },
    { id: uid(), title: "Reply to landlord about lease renewal", done: false, priority: "med", due: today, createdAt: daysAgoISO(2) },
    { id: uid(), title: "Prep demo environment for v2.4 release", done: false, priority: "high", due: addDaysISO(today, 1), createdAt: daysAgoISO(1) },
    { id: uid(), title: "Book dentist appointment", done: false, priority: "low", due: addDaysISO(today, 5), createdAt: daysAgoISO(3) },
    { id: uid(), title: "Plan Saturday hike — Eagle Creek", done: false, priority: "low", due: addDaysISO(today, 3), createdAt: daysAgoISO(2) },
    { id: uid(), title: "30-minute run along the river", done: true, priority: "med", due: today, createdAt: daysAgoISO(1) },
    { id: uid(), title: "Water the plants + feed the cat", done: true, priority: "low", due: today, createdAt: today },
    { id: uid(), title: "Clear inbox to zero", done: true, priority: "med", due: daysAgoISO(1), createdAt: daysAgoISO(2) },
  ];

  const work: WorkTask[] = [
    { id: uid(), seq: 118, title: "Rotate service-account keys (prod)", tag: "security", priority: "high", status: "backlog", due: addDaysISO(today, 4) },
    { id: uid(), seq: 119, title: "Document on-call runbook for pager alerts", tag: "docs", priority: "low", status: "backlog" },
    { id: uid(), seq: 120, title: "Upgrade staging cluster to Node 22 LTS", tag: "devops", priority: "med", status: "backlog" },
    { id: uid(), seq: 121, title: "Fix flaky CI pipeline — auth service tests", tag: "devops", priority: "high", status: "doing", due: today },
    { id: uid(), seq: 122, title: "Implement SSO for the admin panel", tag: "dev", priority: "med", status: "doing", due: addDaysISO(today, 2) },
    { id: uid(), seq: 123, title: "PR #482 — OAuth token refresh flow", tag: "dev", priority: "high", status: "review" },
    { id: uid(), seq: 124, title: "Patch vulnerable deps on legacy host", tag: "security", priority: "high", status: "review", due: today },
    { id: uid(), seq: 125, title: "Provision Grafana dashboards for checkout", tag: "devops", priority: "med", status: "done" },
    { id: uid(), seq: 126, title: "Reset MFA for finance team (3 users)", tag: "support", priority: "low", status: "done" },
    { id: uid(), seq: 127, title: "Q3 access audit — offboarded accounts", tag: "security", priority: "med", status: "done" },
  ];

  const vault: VaultEntry[] = [
    { id: uid(), site: "GitHub", username: "alex.rivera", password: "Gh!42-river-QUO-xenon", url: "github.com", favorite: true, updatedAt: daysAgoISO(21) },
    { id: uid(), site: "AWS Console", username: "alex@acme.io", password: "Aws#9-mango-TIDE-brisk", url: "aws.amazon.com", favorite: true, updatedAt: daysAgoISO(9) },
    { id: uid(), site: "Figma", username: "alex@acme.io", password: "fig-KITE-77-plume$", url: "figma.com", favorite: false, updatedAt: daysAgoISO(48) },
    { id: uid(), site: "Acme VPN", username: "arivera", password: "vpn2024!", url: "vpn.acme.io", favorite: false, updatedAt: daysAgoISO(120) },
    { id: uid(), site: "Netflix", username: "alex.rivera@mail.com", password: "popcorn", url: "netflix.com", favorite: false, updatedAt: daysAgoISO(200) },
  ];

  const notes: Note[] = [
    {
      id: uid(),
      title: "Standup — Monday",
      body: "• Auth refresh PR needs second review\n• Staging flake: retry count bumped to 3\n• Dana wants demo env ready by Thursday\n• Blocker: waiting on infra quota increase",
      color: "aqua",
      pinned: true,
      updatedAt: daysAgoISO(1),
    },
    {
      id: uid(),
      title: "Reading list",
      body: "1. Designing Data-Intensive Applications (ch. 7)\n2. The Phoenix Project\n3. Blog: 'P99 latency budget' — SRE weekly",
      color: "mint",
      pinned: false,
      updatedAt: daysAgoISO(6),
    },
    {
      id: uid(),
      title: "Gift ideas — Sam's birthday",
      body: "Mechanical keyboard keycap set? Espresso grinder. Board game: Wingspan. Ask Maya what he's into lately.",
      color: "amber",
      pinned: false,
      updatedAt: daysAgoISO(14),
    },
  ];

  return {
    name: "Alex",
    transactions,
    budgets,
    tasks,
    workSeq: 127,
    work,
    vault,
    notes,
  };
}
