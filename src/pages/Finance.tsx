import { useEffect, useMemo, useState } from "react";
import type { Section } from "../lib/types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, catById } from "../lib/types";
import {
  addDaysISO,
  cls,
  fmtDate,
  fmtMoney,
  fmtMoney0,
  fromISO,
  monthKey,
  monthTitle,
  shiftMonthKey,
  todayISO,
} from "../lib/utils";
import { useStore } from "../state/store";
import { Donut, EmptyState, MiniBars, SectionHead, stagger } from "../components/ui";
import {
  IconArrowDownR,
  IconArrowUpR,
  IconSearch,
  IconSend,
  IconTrash,
  IconTrendUp,
  IconWallet,
} from "../components/icons";

type Nav = (s: Section, intent?: unknown) => void;

export default function Finance({ onNav, intent }: { onNav: Nav; intent?: unknown }) {
  const { state, addTransaction, deleteTransaction, toast } = useStore();
  const today = todayISO();
  const mk = monthKey(today);
  const pmk = shiftMonthKey(mk, -1);

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("dining");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const i = intent as { tx?: "expense" | "income" } | undefined;
    if (i?.tx) setType(i.tx);
  }, [intent]);

  const cats = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const switchType = (t: "expense" | "income") => {
    setType(t);
    setCategory((t === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)[0].id);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast("Enter a valid amount first", "err");
      return;
    }
    addTransaction({
      type,
      amount: Math.round(amt * 100) / 100,
      category,
      note: note.trim() || catById(category).label,
      date: date || today,
    });
    toast(`${type === "income" ? "Income" : "Expense"} of ${fmtMoney(amt)} logged`);
    setAmount("");
    setNote("");
  };

  const sums = (key: string) => {
    const txs = state.transactions.filter((t) => t.date.startsWith(key));
    const inc = txs.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const exp = txs.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
    return { inc, exp, net: inc - exp, n: txs.length };
  };
  const cur = sums(mk);
  const prev = sums(pmk);
  const expDelta = prev.exp > 0 ? ((cur.exp - prev.exp) / prev.exp) * 100 : null;

  const bars = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = addDaysISO(today, i - 13);
        const v = state.transactions
          .filter((t) => t.date === d && t.type === "expense")
          .reduce((a, t) => a + t.amount, 0);
        return { label: fromISO(d).getDate().toString(), value: v };
      }),
    [state.transactions, today]
  );

  const donutSegs = useMemo(() => {
    const map = new Map<string, number>();
    state.transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(mk))
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, value]) => ({ cat, value, color: catById(cat).color }));
  }, [state.transactions, mk]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.transactions]
      .filter((t) => (filter === "all" ? true : t.type === filter))
      .filter(
        (t) =>
          !q ||
          t.note.toLowerCase().includes(q) ||
          catById(t.category).label.toLowerCase().includes(q)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.transactions, filter, query]);

  const deltaChip = (d: number | null) =>
    d === null ? null : (
      <span
        className={cls(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold",
          d <= 0 ? "bg-mint/12 text-mint" : "bg-coral/12 text-coral"
        )}
      >
        {d <= 0 ? <IconArrowDownR size={10} /> : <IconArrowUpR size={10} />}
        {Math.abs(d).toFixed(0)}% vs last mo
      </span>
    );

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="Finance"
        kickerColor="var(--color-aqua)"
        title="The ledger."
        desc={`Every dollar in and out — ${monthTitle(mk)}. Log it the moment it happens and the month stays honest.`}
        right={
          <button className="chip" onClick={() => onNav("budget")}>
            Budgets <IconArrowUpR size={12} />
          </button>
        }
      />

      {/* month stats */}
      <div className="animate-rise grid gap-3 sm:grid-cols-3" style={stagger(1)}>
        {[
          {
            label: "Income",
            v: fmtMoney0(cur.inc),
            sub: prev.inc > 0 ? `${(((cur.inc - prev.inc) / prev.inc) * 100).toFixed(0)}% vs last month` : "this month",
            icon: <IconTrendUp size={15} />,
            c: "var(--color-mint)",
          },
          {
            label: "Expenses",
            v: fmtMoney0(cur.exp),
            sub: `${cur.n} entries`,
            icon: <IconWallet size={15} />,
            c: "var(--color-coral)",
            chip: deltaChip(expDelta),
          },
          {
            label: "Net",
            v: fmtMoney0(cur.net),
            sub: cur.net >= 0 ? "you're in the green" : "spending exceeds income",
            icon: <IconArrowUpR size={15} />,
            c: cur.net >= 0 ? "var(--color-mint)" : "var(--color-amber)",
          },
        ].map((s) => (
          <div key={s.label} className="panel panel-hover p-4.5 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
                <span style={{ color: s.c }}>{s.icon}</span>
                {s.label}
              </span>
              {s.chip}
            </div>
            <div className="tabular mt-2 font-display text-[1.7rem] font-bold leading-none" style={{ color: s.c }}>
              {s.v}
            </div>
            <div className="mt-1.5 text-[11px] text-mist">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* charts */}
          <section className="panel animate-rise p-5" style={stagger(2)}>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-display text-base font-bold">Daily spend · 14 days</h3>
                <p className="mt-0.5 text-[11px] text-dim">hover a bar for the exact figure</p>
                <div className="mt-4">
                  <MiniBars data={bars} height={104} color="var(--color-coral)" format={(v) => fmtMoney(v)} highlightLast={false} />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <h3 className="self-start font-display text-base font-bold">Where it went · {monthTitle(mk).split(" ")[0]}</h3>
                <p className="mt-0.5 self-start text-[11px] text-dim">by category this month</p>
                {donutSegs.length === 0 ? (
                  <p className="mt-8 text-xs text-dim">No expenses recorded yet.</p>
                ) : (
                  <div className="mt-3 flex items-center gap-5">
                    <Donut segments={donutSegs} size={138} thickness={15}>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-dim">spent</span>
                      <span className="tabular font-display text-lg font-bold">{fmtMoney0(cur.exp)}</span>
                    </Donut>
                    <ul className="max-w-[150px] space-y-1.5">
                      {donutSegs.slice(0, 5).map((s) => (
                        <li key={s.cat} className="flex items-center gap-2 text-[11px]">
                          <span className="h-2 w-2 flex-none rounded-[3px]" style={{ background: s.color }} />
                          <span className="min-w-0 flex-1 truncate text-mist">{catById(s.cat).label}</span>
                          <span className="tabular font-mono text-[10px] text-fog">{fmtMoney0(s.value)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* list */}
          <section className="panel animate-rise" style={stagger(3)}>
            <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-5 py-4">
              <h3 className="mr-auto font-display text-base font-bold">
                Transactions <span className="font-mono text-xs font-normal text-dim">({list.length})</span>
              </h3>
              {(["all", "income", "expense"] as const).map((f) => (
                <button key={f} className={cls("chip capitalize", filter === f && "on")} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
              <div className="relative">
                <IconSearch size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
                <input
                  className="field w-40 py-1.5 pl-8 text-xs"
                  placeholder="Search notes…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            {list.length === 0 ? (
              <EmptyState
                title="Nothing here yet"
                hint="Log your first transaction with the form — it takes five seconds."
              />
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {list.map((t) => {
                  const meta = catById(t.category);
                  return (
                    <li
                      key={t.id}
                      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.025]"
                    >
                      <span
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-lg font-display text-[13px] font-bold"
                        style={{ background: `${meta.color}1c`, color: meta.color }}
                      >
                        {meta.label[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{t.note}</div>
                        <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-dim">
                          <span style={{ color: meta.color }}>{meta.label}</span>
                          <span>·</span>
                          <span>{fmtDate(t.date)}</span>
                        </div>
                      </div>
                      <span
                        className={cls(
                          "tabular font-mono text-[13px] font-semibold",
                          t.type === "income" ? "text-mint" : "text-fog"
                        )}
                      >
                        {t.type === "income" ? "+" : "−"}
                        {fmtMoney(t.amount).replace("−", "")}
                      </span>
                      <button
                        className="icon-btn danger opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => {
                          deleteTransaction(t.id);
                          toast("Transaction removed", "warn");
                        }}
                        aria-label="Delete transaction"
                      >
                        <IconTrash size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* add form */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <form className="panel animate-rise p-5" style={stagger(2)} onSubmit={submit}>
            <h3 className="font-display text-base font-bold">Log a transaction</h3>
            <div className="mt-3.5 grid grid-cols-2 gap-1 rounded-xl border border-white/[0.07] bg-ink-800 p-1">
              {(["expense", "income"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => switchType(t)}
                  className={cls(
                    "rounded-lg py-1.5 text-xs font-bold capitalize transition-all",
                    type === t
                      ? t === "expense"
                        ? "bg-coral/15 text-coral shadow-sm"
                        : "bg-mint/15 text-mint shadow-sm"
                      : "text-dim hover:text-mist"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="label">Amount</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-dim">$</span>
                <input
                  className="field tabular pl-7 font-mono text-lg font-semibold"
                  placeholder="0.00"
                  inputMode="decimal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Category</label>
                <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input className="field" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Note</label>
              <input
                className="field"
                placeholder={type === "expense" ? "e.g. Groceries — weekend stock" : "e.g. Freelance invoice #12"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className={cls("btn mt-4 w-full", type === "income" ? "btn-primary" : "")}
              style={type === "expense" ? { background: "var(--color-coral)", color: "#2b0d07" } : undefined}
            >
              <IconSend size={14} />
              Add {type}
            </button>
            <p className="mt-3 text-center font-mono text-[10px] leading-relaxed text-dim">
              tip: expenses feed your budgets
              <br />
              automatically by category
            </p>
          </form>
        </aside>
      </div>
    </div>
  );
}
