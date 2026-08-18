import { useMemo, useState } from "react";
import type { Section } from "../lib/types";
import { EXPENSE_CATEGORIES, catById } from "../lib/types";
import { cls, fmtMoney0, monthKey, monthTitle, todayISO } from "../lib/utils";
import { useStore } from "../state/store";
import { EmptyState, HBar, SectionHead, stagger } from "../components/ui";
import { IconArrowUpR, IconCheck, IconPencil, IconPlus, IconTarget, IconTrash, IconX } from "../components/icons";

type Nav = (s: Section, intent?: unknown) => void;

function statusOf(ratio: number) {
  if (ratio > 1) return { label: "Over limit", color: "var(--color-coral)", bg: "rgba(242,112,91,0.13)" };
  if (ratio > 0.8) return { label: "Getting close", color: "var(--color-amber)", bg: "rgba(245,184,75,0.13)" };
  return { label: "On track", color: "var(--color-mint)", bg: "rgba(62,207,142,0.13)" };
}

export default function Budget({ onNav }: { onNav: Nav; intent?: unknown }) {
  const { state, addBudget, setBudgetLimit, deleteBudget, toast } = useStore();
  const mk = monthKey(todayISO());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newLimit, setNewLimit] = useState("");

  const spentBy = useMemo(() => {
    const m = new Map<string, number>();
    state.transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(mk))
      .forEach((t) => m.set(t.category, (m.get(t.category) ?? 0) + t.amount));
    return m;
  }, [state.transactions, mk]);

  const rows = state.budgets.map((b) => {
    const spent = spentBy.get(b.category) ?? 0;
    return { ...b, spent, ratio: b.limit > 0 ? spent / b.limit : spent > 0 ? 2 : 0 };
  });

  const totalLimit = rows.reduce((a, r) => a + r.limit, 0);
  const totalSpent = rows.reduce((a, r) => a + r.spent, 0);
  const totalRatio = totalLimit > 0 ? totalSpent / totalLimit : 0;
  const unbudgeted = EXPENSE_CATEGORIES.filter((c) => !state.budgets.some((b) => b.category === c.id));

  const commitEdit = (id: string) => {
    const v = parseFloat(editVal);
    if (!Number.isFinite(v) || v <= 0) {
      toast("Limit must be a positive number", "err");
      return;
    }
    setBudgetLimit(id, Math.round(v));
    setEditingId(null);
    toast("Budget limit updated");
  };

  const submitNew = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(newLimit);
    if (!newCat) {
      toast("Pick a category", "err");
      return;
    }
    if (!Number.isFinite(v) || v <= 0) {
      toast("Enter a valid monthly limit", "err");
      return;
    }
    addBudget(newCat, Math.round(v));
    toast(`Budget added for ${catById(newCat).label}`);
    setNewCat("");
    setNewLimit("");
  };

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="Budget"
        kickerColor="var(--color-amber)"
        title="Give every dollar a job."
        desc={`Category envelopes for ${monthTitle(mk)}. Spend inside the envelope and the bar stays friendly.`}
        right={
          <button className="chip" onClick={() => onNav("finance")}>
            Ledger <IconArrowUpR size={12} />
          </button>
        }
      />

      {/* overview */}
      <section className="panel animate-rise relative overflow-hidden p-6" style={stagger(1)}>
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-amber/10 blur-3xl" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
              total budgeted · {monthTitle(mk)}
            </div>
            <div className="tabular mt-1 font-display text-4xl font-bold tracking-tight">
              {fmtMoney0(totalSpent)}
              <span className="text-xl font-semibold text-dim"> / {fmtMoney0(totalLimit)}</span>
            </div>
          </div>
          <div className="text-right">
            <div
              className={cls(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                totalRatio > 1 ? "bg-coral/12 text-coral" : totalRatio > 0.85 ? "bg-amber/12 text-amber" : "bg-mint/12 text-mint"
              )}
            >
              <IconTarget size={13} />
              {totalRatio > 1 ? `${fmtMoney0(totalSpent - totalLimit)} over` : `${fmtMoney0(totalLimit - totalSpent)} left`}
            </div>
            <div className="mt-1.5 font-mono text-[10.5px] text-dim">{Math.round(totalRatio * 100)}% of envelopes used</div>
          </div>
        </div>
        <div className="mt-5">
          <HBar value={totalRatio} color="var(--color-amber)" h={10} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* cards */}
        <div className="grid content-start gap-3 sm:grid-cols-2 lg:col-span-2">
          {rows.length === 0 && (
            <div className="panel animate-rise sm:col-span-2">
              <EmptyState
                icon={<IconTarget size={22} />}
                title="No envelopes yet"
                hint="Add a category budget on the right and spending will be tracked against it automatically."
              />
            </div>
          )}
          {rows.map((r, i) => {
            const meta = catById(r.category);
            const st = statusOf(r.ratio);
            const editing = editingId === r.id;
            return (
              <article
                key={r.id}
                className="panel panel-hover animate-rise group p-4.5 px-4 py-4"
                style={stagger(i + 2)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-bold"
                      style={{ background: `${meta.color}1c`, color: meta.color }}
                    >
                      {meta.label[0]}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold leading-tight">{meta.label}</h3>
                      <span
                        className="mt-0.5 inline-block rounded-full px-1.5 py-[1px] font-mono text-[9px] font-semibold"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="icon-btn"
                      aria-label="Edit limit"
                      onClick={() => {
                        setEditingId(r.id);
                        setEditVal(String(r.limit));
                      }}
                    >
                      <IconPencil size={14} />
                    </button>
                    <button
                      className="icon-btn danger"
                      aria-label="Delete budget"
                      onClick={() => {
                        deleteBudget(r.id);
                        toast(`${meta.label} budget removed`, "warn");
                      }}
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3.5 flex items-baseline justify-between">
                  <span className="tabular font-mono text-sm font-semibold">
                    {fmtMoney0(r.spent)} <span className="text-dim">/ {fmtMoney0(r.limit)}</span>
                  </span>
                  <span className="tabular font-mono text-[11px]" style={{ color: st.color }}>
                    {r.ratio > 1 ? `+${fmtMoney0(r.spent - r.limit)}` : fmtMoney0(r.limit - r.spent)}{" "}
                    {r.ratio > 1 ? "over" : "left"}
                  </span>
                </div>
                <div className="mt-2">
                  {editing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        className="field tabular py-1 font-mono text-xs"
                        type="number"
                        min="1"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(r.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button className="icon-btn" style={{ color: "var(--color-mint)" }} onClick={() => commitEdit(r.id)} aria-label="Save">
                        <IconCheck size={15} />
                      </button>
                      <button className="icon-btn" onClick={() => setEditingId(null)} aria-label="Cancel">
                        <IconX size={15} />
                      </button>
                    </div>
                  ) : (
                    <HBar value={r.ratio} color={meta.color} h={7} />
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* add */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <form className="panel animate-rise p-5" style={stagger(3)} onSubmit={submitNew}>
            <h3 className="font-display text-base font-bold">New envelope</h3>
            <p className="mt-1 text-[11px] text-dim">Pick a category that doesn&apos;t have a limit yet.</p>
            <div className="mt-4">
              <label className="label">Category</label>
              {unbudgeted.length === 0 ? (
                <p className="rounded-lg border border-mint/20 bg-mint/8 px-3 py-2.5 text-xs text-mint">
                  Every category already has an envelope — nicely covered.
                </p>
              ) : (
                <select className="field" value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                  <option value="">Choose…</option>
                  {unbudgeted.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="mt-3">
              <label className="label">Monthly limit</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-dim">$</span>
                <input
                  className="field tabular pl-7 font-mono"
                  placeholder="250"
                  type="number"
                  min="1"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  disabled={unbudgeted.length === 0}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-4 w-full" disabled={unbudgeted.length === 0}>
              <IconPlus size={14} /> Add envelope
            </button>
            <div className="mt-4 border-t border-white/[0.05] pt-3.5">
              <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">rule of thumb</div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist">
                Bars turn <span className="font-semibold text-amber">amber</span> past 80% and{" "}
                <span className="font-semibold text-coral">red</span> over 100%. Adjust limits inline anytime.
              </p>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
