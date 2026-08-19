import type { AppState, Priority, Project, WorkStatus, WorkTask } from "./types";
import { addDaysISO, daysAgoISO, todayISO } from "./utils";

function wt(
  projectId: string,
  seq: number,
  title: string,
  tag: string,
  priority: Priority,
  status: WorkStatus,
  due?: string
): WorkTask {
  return {
    id: `wt-${projectId}-${seq}`,
    projectId,
    seq,
    title,
    tag,
    priority,
    status,
    due,
  };
}

export function buildSeed(): AppState {
  const t = todayISO();

  const projects: Project[] = [
    { id: "proj-atlas", name: "Atlas CRM", code: "ATL", color: "#5bc8f5", createdAt: daysAgoISO(42) },
    { id: "proj-infra", name: "Infra & Cloud", code: "INF", color: "#3ecf8e", createdAt: daysAgoISO(31) },
    { id: "proj-desk", name: "Helpdesk", code: "HDS", color: "#f5b84b", createdAt: daysAgoISO(18) },
  ];

  return {
    name: "Alex",
    transactions: [
      { id: "tx-s1", type: "income", amount: 3400, category: "salary", note: "Monthly salary", date: daysAgoISO(9) },
      { id: "tx-1", type: "expense", amount: 1250, category: "housing", note: "Rent — Maple St. apartment", date: daysAgoISO(8) },
      { id: "tx-2", type: "expense", amount: 86.4, category: "groceries", note: "Weekly grocery run", date: daysAgoISO(7) },
      { id: "tx-3", type: "expense", amount: 64.2, category: "transport", note: "Fuel top-up", date: daysAgoISO(6) },
      { id: "tx-4", type: "expense", amount: 32.5, category: "dining", note: "Ramen with the team", date: daysAgoISO(5) },
      { id: "tx-5", type: "expense", amount: 118, category: "bills", note: "Electricity + water", date: daysAgoISO(4) },
      { id: "tx-6", type: "income", amount: 450, category: "freelance", note: "Landing page gig", date: daysAgoISO(4) },
      { id: "tx-7", type: "expense", amount: 42.99, category: "fun", note: "Concert ticket", date: daysAgoISO(3) },
      { id: "tx-8", type: "expense", amount: 27.97, category: "subs", note: "Streaming bundle", date: daysAgoISO(2) },
      { id: "tx-9", type: "expense", amount: 96.3, category: "groceries", note: "Costco haul", date: daysAgoISO(1) },
      { id: "tx-10", type: "expense", amount: 18.75, category: "dining", note: "Coffee + bagel", date: daysAgoISO(1) },
      { id: "tx-11", type: "expense", amount: 24.5, category: "transport", note: "Metro card reload", date: t },
    ],
    budgets: [
      { id: "bg-1", category: "housing", limit: 1300 },
      { id: "bg-2", category: "groceries", limit: 420 },
      { id: "bg-3", category: "dining", limit: 200 },
      { id: "bg-4", category: "transport", limit: 160 },
      { id: "bg-5", category: "bills", limit: 240 },
      { id: "bg-6", category: "fun", limit: 150 },
      { id: "bg-7", category: "subs", limit: 60 },
      { id: "bg-8", category: "shopping", limit: 180 },
    ],
    tasks: [
      { id: "tk-1", title: "Morning run — 5k loop", done: true, priority: "med", due: t, createdAt: t },
      { id: "tk-2", title: "Review monthly budget vs actuals", done: false, priority: "high", due: t, createdAt: daysAgoISO(1) },
      { id: "tk-3", title: "Call the dentist — reschedule", done: false, priority: "med", due: t, createdAt: daysAgoISO(2) },
      { id: "tk-4", title: "Water the balcony plants", done: false, priority: "low", due: t, createdAt: t },
      { id: "tk-5", title: "Groceries: refill fridge staples", done: false, priority: "high", due: addDaysISO(t, 1), createdAt: t },
      { id: "tk-6", title: "Pay electricity bill", done: false, priority: "high", due: daysAgoISO(1), createdAt: daysAgoISO(4) },
      { id: "tk-7", title: "Plan Saturday hike with friends", done: false, priority: "low", due: addDaysISO(t, 3), createdAt: daysAgoISO(1) },
      { id: "tk-8", title: "30 min Spanish practice", done: true, priority: "med", due: t, createdAt: t },
    ],
    projects,
    work: [
      wt("proj-atlas", 1, "SSO integration with Okta", "security", "high", "review", addDaysISO(t, 1)),
      wt("proj-atlas", 2, "Fix token refresh loop on mobile", "dev", "high", "doing", t),
      wt("proj-atlas", 3, "Write API docs for v2 endpoints", "docs", "med", "backlog", addDaysISO(t, 6)),
      wt("proj-atlas", 4, "Deploy staging environment", "devops", "med", "done"),
      wt("proj-infra", 1, "Rotate TLS certs on k8s ingress", "devops", "high", "doing", addDaysISO(t, 2)),
      wt("proj-infra", 2, "Set up Grafana alert rules", "devops", "med", "backlog", addDaysISO(t, 9)),
      wt("proj-infra", 3, "Q3 disaster-recovery drill report", "docs", "low", "done"),
      wt("proj-desk", 1, "Provision laptop for new hire", "support", "med", "review", t),
      wt("proj-desk", 2, "VPN access issue — ticket #142", "support", "low", "backlog", addDaysISO(t, 3)),
    ],
    vault: [
      {
        id: "vw-1",
        site: "GitHub",
        username: "alex.dev",
        password: "Tr!bute-9Kilobyte-marble",
        url: "github.com",
        favorite: true,
        updatedAt: daysAgoISO(12),
      },
      {
        id: "vw-2",
        site: "AWS Console",
        username: "alex@company.io",
        password: "N0de!repl1ca-Sunset-42",
        url: "aws.amazon.com",
        favorite: true,
        updatedAt: daysAgoISO(6),
      },
      {
        id: "vw-3",
        site: "Jira",
        username: "alex@company.io",
        password: "sprint2023",
        url: "company.atlassian.net",
        favorite: false,
        updatedAt: daysAgoISO(45),
      },
      {
        id: "vw-4",
        site: "Netflix",
        username: "alex@home.me",
        password: "Popcorn&Ch1ll#2024",
        url: "netflix.com",
        favorite: false,
        updatedAt: daysAgoISO(30),
      },
      {
        id: "vw-5",
        site: "Banking",
        username: "a.moreau",
        password: "V4ult!Ledger-Cobalt-88",
        url: "mybank.com",
        favorite: true,
        updatedAt: daysAgoISO(3),
      },
    ],
    notes: [
      {
        id: "nt-1",
        title: "Standup notes",
        body: "Blockers: staging DB migration still pending.\nAsk infra for a 30-min slot on Thursday.",
        color: "aqua",
        pinned: true,
        updatedAt: t,
      },
      {
        id: "nt-2",
        title: "Gift ideas",
        body: "Mom: espresso grinder · Sam: mechanical keyboard keycaps · June: board game night pack.",
        color: "amber",
        pinned: false,
        updatedAt: daysAgoISO(2),
      },
      {
        id: "nt-3",
        title: "Reading list",
        body: "• Designing Data-Intensive Applications\n• The Phoenix Project\n• Deep Work",
        color: "mint",
        pinned: false,
        updatedAt: daysAgoISO(5),
      },
    ],
  };
}
