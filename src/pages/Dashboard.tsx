import { useEffect, useState } from "react";
import type { Section } from "../lib/types";
import { PRIORITY_META, catById } from "../lib/types";
import {
  addDaysISO,
  cls,
  dueLabel,
  fmtDate,
  fmtMoney,
  fmtMoney0,
  fromISO,
  greeting,
  monthKey,
  passwordStrength,
  todayISO,
} from "../lib/utils";
import { useStore } from "../state/store";
import { EmptyState, HBar, MiniBars, stagger } from "../components/ui";
import { BackupControls } from "../components/Backup";
import {
  IconArrowUpR,
  IconCheck,
  IconFlame,
  IconKey,
  IconNote,
  IconPencil,
  IconPlus,
  IconSpark,
  IconTasks,
  IconTerminal,
  IconTrendUp,
  IconWallet,
  IconZap,
} from "../components/icons";

type Nav = (s: Section, intent?: unknown) => void;

export default function Dashboard({ onNav }: { onNav: Nav }) {
  const { state, toggleTask, setName, toast } = useStore();
  const [now, setNow] = useState(new Date());
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(state.name);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const today = todayISO();
  const mk = monthKey(today);
  const monthTx = state.transactions.filter((t) => t.date.startsWith(mk));
  const income = monthTx.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const net = income - expense;
  const spentToday = state.transactions
    .filter((t) => t.date === today && t.type === "expense")
    .reduce((a, t) => a + t.amount, 0);

  const openTasks = state.tasks.filter((t) => !t.done);
  const doneTasks = state.tasks.length - openTasks.length;
  const prioW = { high: 0, med: 1, low: 2 } as const;
  const focus = [...openTasks]
    .sort((a, b) => prioW[a.priority] - prioW[b.priority] || a.due.localeCompare(b.due))
    .slice(0, 4);

  const doing = state.work.filter((w) => w.status === "doing");
  const review = state.work.filter((w) => w.status === "review");
  const weak = state.vault.filter((v) => passwordStrength(v.password).score <= 1).length;

  // last 7 days spend
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = addDaysISO(today, i - 6);
    const v = state.transactions
      .filter((t) => t.date === d && t.type === "expense")
      .reduce((a, t) => a + t.amount, 0);
    return { label: fromISO(d).toLocaleDateString("en-US", { weekday: "narrow" }), value: v };
  });
  const weekSpend = bars.reduce((a, b) => a + b.value, 0);

  // budget snapshot — worst ratios first
  const budgetSnap = state.budgets
    .map((b) => {
      const spent = monthTx
        .filter((t) => t.type === "expense" && t.category === b.category)
        .reduce((a, t) => a + t.amount, 0);
      return { ...b, spent, ratio: b.limit > 0 ? spent / b.limit : 0 };
    })
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 4);

  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const commitName = () => {
    const n = nameDraft.trim();
    if (n) setName(n);
    setEditingName(false);
  };

  const quick: { label: string; icon: React.ReactNode; go: () => void }[] = [
    { label: "Log expense", icon: <IconWallet size={13} />, go: () => onNav("finance", { tx: "expense" }) },
    { label: "Log income", icon: <IconTrendUp size={13} />, go: () => onNav("finance", { tx: "income" }) },
    { label: "Personal task", icon: <IconTasks size={13} />, go: () => onNav("tasks", { add: true }) },
    { label: "New ticket", icon: <IconTerminal size={13} />, go: () => onNav("work", { add: true }) },
    { label: "Add secret", icon: <IconKey size={13} />, go: () => onNav("vault", { add: true }) },
    { label: "Write note", icon: <IconNote size={13} />, go: () => onNav("notes", { add: true }) },
  ];

  return (
    <div className="space-y-5">
      {/* header */}
      <header className="animate-rise flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="kicker text-mint">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-mint animate-pulsesoft" />
            Personal console · {now.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-[2.9rem] sm:leading-[1.05]">
            {greeting(now.getHours())},{" "}
            {editingName ? (
              <input
                autoFocus
                className="field inline-block w-44 font-display text-3xl font-bold"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => e.key === "Enter" && commitName()}
              />
            ) : (
              <span className="group inline-flex items-center gap-2">
                {state.name}
                <button
                  className="icon-btn opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    setNameDraft(state.name);
                    setEditingName(true);
                  }}
                  aria-label="Edit name"
                >
                  <IconPencil size={15} />
                </button>
              </span>
            )}
            <span className="text-mint">.</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
            {openTasks.length > 0 ? (
              <>
                You have <b className="text-fog">{openTasks.length} personal task{openTasks.length > 1 && "s"}</b> open,{" "}
                <b className="text-fog">{doing.length + review.length} office ticket{doing.length + review.length !== 1 && "s"}</b>{" "}
                in flight across <b className="text-fog">{state.projects.length} project{state.projects.length !== 1 && "s"}</b>, and
                you&apos;ve spent <b className="text-fog">{fmtMoney(spentToday)}</b> today.
              </>
            ) : (
              <>All tasks clear — a rare and beautiful sight. Maybe log a win below.</>
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">Quick</span>
            {quick.map((q) => (
              <button
                key={q.label}
                onClick={q.go}
                className="chip hover:-translate-y-px hover:border-mint/40 hover:text-mint"
              >
                {q.icon}
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* clock */}
        <div className="panel animate-rise relative overflow-hidden px-6 py-5" style={stagger(1)}>
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-mint/10 blur-2xl" />
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
            <span className="h-[6px] w-[6px] rounded-full bg-mint animate-pulsesoft" /> live
          </div>
          <div className="tabular mt-1 font-mono text-[2.6rem] font-bold leading-none tracking-tight">
            {hh}:{mm}
            <span className="text-mint/70">:{ss}</span>
          </div>
          <div className="mt-2 text-xs font-medium text-mist">
            {now.toLocaleDateString("en-US", { weekday: "long" })} · week{" "}
            {Math.ceil(((+now - +new Date(now.getFullYear(), 0, 1)) / 864e5 + 1) / 7)}
          </div>
        </div>
      </header>

      {/* stat band */}
      <div
        className="panel animate-rise grid grid-cols-2 divide-x divide-y divide-white/[0.05] sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0"
        style={stagger(2)}
      >
        {[
          {
            label: "Net this month",
            value: fmtMoney0(net),
            sub: `in ${fmtMoney0(income)} · out ${fmtMoney0(expense)}`,
            icon: <IconTrendUp size={15} />,
            color: net >= 0 ? "var(--color-mint)" : "var(--color-coral)",
          },
          {
            label: "Spent today",
            value: fmtMoney(spentToday),
            sub: spentToday > 0 ? "keep an eye on it" : "nothing yet — nice",
            icon: <IconFlame size={15} />,
            color: "var(--color-amber)",
          },
          {
            label: "Open tasks",
            value: String(openTasks.length),
            sub: `${doneTasks} completed`,
            icon: <IconTasks size={15} />,
            color: "var(--color-mint)",
          },
          {
            label: "Work in flight",
            value: String(doing.length),
            sub: `${review.length} in review · ${state.projects.length} project${state.projects.length !== 1 ? "s" : ""}`,
            icon: <IconTerminal size={15} />,
            color: "var(--color-aqua)",
          },
          {
            label: "Vault alerts",
            value: String(weak),
            sub: weak > 0 ? "weak passwords found" : "everything looks strong",
            icon: <IconKey size={15} />,
            color: weak > 0 ? "var(--color-coral)" : "var(--color-lav)",
          },
        ].map((s) => (
          <div key={s.label} className="group px-4 py-4 transition-colors hover:bg-white/[0.02] sm:px-5">
            <div className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">
              <span style={{ color: s.color }}>{s.icon}</span>
              {s.label}
            </div>
            <div className="tabular mt-1.5 font-display text-[1.45rem] font-bold leading-none" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="mt-1.5 truncate text-[11px] text-mist">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* main grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {/* focus */}
          <section className="panel animate-rise p-5" style={stagger(3)}>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <IconZap size={16} className="text-amber" />
                Personal focus
              </h2>
              <button className="chip" onClick={() => onNav("tasks")}>
                Full list <IconArrowUpR size={12} />
              </button>
            </div>
            {focus.length === 0 ? (
              <EmptyState
                icon={<IconCheck size={22} />}
                title="All clear"
                hint="Every task is done. Add the next thing worth doing."
                action={
                  <button className="btn btn-ghost text-xs" onClick={() => onNav("tasks", { add: true })}>
                    <IconPlus size={13} /> Add a task
                  </button>
                }
              />
            ) : (
              <ul className="mt-3 space-y-1.5">
                {focus.map((t) => (
                  <li
                    key={t.id}
                    className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-all hover:border-white/[0.07] hover:bg-white/[0.03]"
                  >
                    <button
                      onClick={() => {
                        toggleTask(t.id);
                        toast("Task checked off", "ok");
                      }}
                      className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md border border-white/20 text-transparent transition-all hover:border-mint hover:text-mint/60"
                      aria-label="Toggle task"
                    >
                      <IconCheck size={13} />
                    </button>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                    <span
                      className="flex flex-none items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold"
                      style={{
                        color: PRIORITY_META[t.priority].color,
                        background: `${PRIORITY_META[t.priority].color}1a`,
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_META[t.priority].color }} />
                      {PRIORITY_META[t.priority].label}
                    </span>
                    <span className="flex-none font-mono text-[10.5px] text-dim">
                      {t.due === today ? "today" : dueLabel(t.due).toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {openTasks.length > focus.length && (
              <p className="mt-3 border-t border-white/[0.05] pt-3 text-center font-mono text-[10.5px] text-dim">
                +{openTasks.length - focus.length} more on the full list
              </p>
            )}
          </section>

          {/* spend bars */}
          <section className="panel animate-rise p-5" style={stagger(4)}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Spending — last 7 days</h2>
              <span className="tabular font-mono text-xs text-mist">
                total <b className="text-amber">{fmtMoney(weekSpend)}</b>
              </span>
            </div>
            <div className="mt-4">
              <MiniBars data={bars} height={96} color="var(--color-amber)" format={(v) => fmtMoney(v)} />
            </div>
          </section>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {/* budget snapshot */}
          <section className="panel animate-rise p-5" style={stagger(4)}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Budget watch</h2>
              <button className="chip" onClick={() => onNav("budget")}>
                Manage <IconArrowUpR size={12} />
              </button>
            </div>
            {budgetSnap.length === 0 ? (
              <p className="mt-3 text-xs text-dim">No budgets yet — set one to start tracking.</p>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {budgetSnap.map((b) => {
                  const meta = catById(b.category);
                  return (
                    <li key={b.id}>
                      <div className="mb-1.5 flex items-baseline justify-between text-xs">
                        <span className="font-semibold" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                        <span className="tabular font-mono text-[10.5px] text-mist">
                          {fmtMoney0(b.spent)} / {fmtMoney0(b.limit)}
                        </span>
                      </div>
                      <HBar value={b.ratio} color={meta.color} h={6} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* work pipeline */}
          <section className="panel animate-rise p-5" style={stagger(5)}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Office projects</h2>
              <button className="chip" onClick={() => onNav("work")}>
                Board <IconArrowUpR size={12} />
              </button>
            </div>
            <div className="mt-3.5 space-y-2.5">
              {state.projects.slice(0, 4).map((p) => {
                const tickets = state.work.filter((w) => w.projectId === p.id);
                const open = tickets.filter((w) => w.status !== "done").length;
                const frac = tickets.length ? (tickets.length - open) / tickets.length : 0;
                return (
                  <div key={p.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 flex-none rounded-[4px]" style={{ background: p.color }} />
                      <span className="min-w-0 flex-1 truncate text-xs font-bold">{p.name}</span>
                      <span className="flex-none font-mono text-[9.5px] font-bold tracking-wide" style={{ color: p.color }}>
                        {p.code}
                      </span>
                      <span className="tabular flex-none font-mono text-[10px] text-mist">
                        {open} open / {tickets.length}
                      </span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="animate-growx h-full rounded-full"
                        style={{ width: `${(frac * 100).toFixed(1)}%`, background: p.color }}
                      />
                    </div>
                  </div>
                );
              })}
              {state.projects.length === 0 && (
                <p className="text-xs text-dim">No projects yet — spin one up on the board.</p>
              )}
            </div>
            {[...doing, ...review].slice(0, 2).map((w) => {
              const proj = state.projects.find((p) => p.id === w.projectId);
              return (
                <div
                  key={w.id}
                  className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-ink-800/60 px-3 py-2.5 text-xs"
                >
                  <span
                    className="h-2 w-2 flex-none animate-pulsesoft rounded-full"
                    style={{ background: w.status === "doing" ? "var(--color-aqua)" : "var(--color-amber)" }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">{w.title}</span>
                  <span className="flex-none font-mono text-[10px] text-dim">
                    {proj?.code ?? "?"}-{w.seq}
                  </span>
                </div>
              );
            })}
          </section>

          {/* recent money */}
          <section className="panel animate-rise p-5" style={stagger(6)}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Latest money moves</h2>
              <button className="chip" onClick={() => onNav("finance")}>
                Ledger <IconArrowUpR size={12} />
              </button>
            </div>
            <ul className="mt-3 divide-y divide-white/[0.04]">
              {recent.map((t) => {
                const meta = catById(t.category);
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: meta.color }} />
                    <span className="min-w-0 flex-1 truncate font-medium">{t.note}</span>
                    <span className="flex-none font-mono text-[10.5px] text-dim">{fmtDate(t.date)}</span>
                    <span
                      className={cls(
                        "tabular flex-none font-mono text-xs font-semibold",
                        t.type === "income" ? "text-mint" : "text-coral"
                      )}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {fmtMoney(t.amount).replace("−", "")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      <div className="animate-rise flex flex-wrap items-center justify-between gap-3 pb-2 pt-1" style={stagger(7)}>
        <p className="flex items-center gap-2 font-mono text-[10px] text-dim/70">
          <IconSpark size={11} className="text-mint/60" />
          LifeOS · powered by a real SQLite database (sql.js/WASM), stored on-device — no account, no cloud, no leaks.
        </p>
        <BackupControls compact />
      </div>
    </div>
  );
}
