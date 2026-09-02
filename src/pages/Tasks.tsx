import { useEffect, useMemo, useRef, useState } from "react";
import type { Priority, Section } from "../lib/types";
import { PRIORITY_META } from "../lib/types";
import { addDaysISO, cls, dueLabel, todayISO } from "../lib/utils";
import { useStore } from "../state/store";
import { EmptyState, Ring, SectionHead, stagger } from "../components/ui";
import { IconCheck, IconClock, IconPlus, IconTasks, IconTrash } from "../components/icons";

type Nav = (s: Section, intent?: unknown) => void;

const DUE_OPTIONS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
  { label: "Someday", days: 21 },
];

export default function Tasks({ intent }: { onNav: Nav; intent?: unknown }) {
  const { state, addTask, toggleTask, deleteTask, clearDoneTasks, toast } = useStore();
  const today = todayISO();

  const [title, setTitle] = useState("");
  const [prio, setPrio] = useState<Priority>("med");
  const [dueDays, setDueDays] = useState(0);
  const [view, setView] = useState<"all" | "open" | "done">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((intent as { add?: boolean } | undefined)?.add) inputRef.current?.focus();
  }, [intent]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      toast("Give the task a name first", "err");
      return;
    }
    addTask(t, prio, addDaysISO(today, dueDays));
    setTitle("");
    toast("Task added to the list");
  };

  const groups = useMemo(() => {
    const overdue = state.tasks.filter((t) => !t.done && t.due < today).sort((a, b) => a.due.localeCompare(b.due));
    const todays = state.tasks.filter((t) => !t.done && t.due === today);
    const upcoming = state.tasks.filter((t) => !t.done && t.due > today).sort((a, b) => a.due.localeCompare(b.due));
    const done = state.tasks.filter((t) => t.done);
    return { overdue, todays, upcoming, done };
  }, [state.tasks, today]);

  const doneCount = groups.done.length;
  const total = state.tasks.length;
  const frac = total ? doneCount / total : 0;

  const Row = ({ t, muted }: { t: (typeof state.tasks)[number]; muted?: boolean }) => {
    const pm = PRIORITY_META[t.priority];
    const isOver = !t.done && t.due < today;
    return (
      <li className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-all hover:border-white/[0.07] hover:bg-white/[0.03]">
        <button
          onClick={() => {
            toggleTask(t.id);
            if (!t.done) toast("Nice — task done", "ok");
          }}
          aria-label="Toggle done"
          className={cls(
            "flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md border transition-all",
            t.done
              ? "border-mint bg-mint text-ink-950"
              : "border-white/20 text-transparent hover:border-mint hover:text-mint/60"
          )}
        >
          <span className={t.done ? "animate-pop" : undefined}>
            <IconCheck size={13} />
          </span>
        </button>
        <span
          className={cls(
            "min-w-0 flex-1 truncate text-sm font-medium transition-all",
            (t.done || muted) && "text-dim line-through decoration-dim/50"
          )}
        >
          {t.title}
        </span>
        <span
          className="flex flex-none items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold"
          style={{ color: pm.color, background: `${pm.color}1a` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: pm.color }} />
          {pm.label}
        </span>
        <span
          className={cls(
            "flex w-[74px] flex-none items-center justify-end gap-1 text-right font-mono text-[10.5px]",
            isOver ? "font-bold text-coral" : "text-dim"
          )}
        >
          {isOver && <IconClock size={11} />}
          {dueLabel(t.due)}
        </span>
        <button
          className="icon-btn danger flex-none opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => {
            deleteTask(t.id);
            toast("Task deleted", "warn");
          }}
          aria-label="Delete task"
        >
          <IconTrash size={14} />
        </button>
      </li>
    );
  };

  const Group = ({ label, items, color, empty }: { label: string; items: typeof state.tasks; color: string; empty?: string }) => {
    if (items.length === 0) {
      return empty ? (
        <p className="px-3 py-2 text-[11px] italic text-dim">{empty}</p>
      ) : null;
    }
    return (
      <div>
        <div className="mb-1 flex items-center gap-2 px-3">
          <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">{label}</span>
          <span className="font-mono text-[10px] text-dim/70">({items.length})</span>
        </div>
        <ul className="space-y-1">{items.map((t) => <Row key={t.id} t={t} />)}</ul>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="Personal · Daily tasks"
        kickerColor="var(--color-mint)"
        title="Life, handled."
        desc="Your personal side of the day — health, home, errands, and promises made to yourself. Office work lives on the IT board."
        right={
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-display text-2xl font-bold leading-none">
                {doneCount}
                <span className="text-base text-dim">/{total}</span>
              </div>
              <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-dim">completed</div>
            </div>
            <Ring value={frac} size={64} stroke={7}>
              <span className="font-mono text-[11px] font-bold">{Math.round(frac * 100)}%</span>
            </Ring>
          </div>
        }
      />

      {/* quick add */}
      <form className="panel animate-rise p-4" style={stagger(1)} onSubmit={submit}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <IconPlus size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mint" />
            <input
              ref={inputRef}
              className="field pl-10"
              placeholder="Add a personal task… press Enter to save"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-ink-800 p-1">
              {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPrio(p)}
                  className={cls(
                    "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all",
                    prio === p ? "shadow-sm" : "text-dim hover:text-mist"
                  )}
                  style={
                    prio === p
                      ? { background: `${PRIORITY_META[p].color}1f`, color: PRIORITY_META[p].color }
                      : undefined
                  }
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
            <select
              className="field w-auto py-1.5 text-xs"
              value={dueDays}
              onChange={(e) => setDueDays(Number(e.target.value))}
            >
              {DUE_OPTIONS.map((d) => (
                <option key={d.days} value={d.days}>
                  {d.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">
              Add it
            </button>
          </div>
        </div>
      </form>

      {/* filters + list */}
      <section className="panel animate-rise" style={stagger(2)}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
          {(
            [
              ["all", "Everything"],
              ["open", "Open"],
              ["done", "Done"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} className={cls("chip", view === v && "on")} onClick={() => setView(v)}>
              {l}
            </button>
          ))}
          {doneCount > 0 && (
            <button
              className="chip ml-auto hover:border-coral/40 hover:text-coral"
              onClick={() => {
                clearDoneTasks();
                toast(`Cleared ${doneCount} completed task${doneCount > 1 ? "s" : ""}`, "warn");
              }}
            >
              <IconTrash size={12} /> Clear done ({doneCount})
            </button>
          )}
        </div>

        <div className="space-y-5 p-4">
          {total === 0 && (
            <EmptyState
              icon={<IconTasks size={22} />}
              title="A blank slate"
              hint="Add your first personal task — gym, groceries, calling mom, watering the plants."
            />
          )}

          {view !== "done" && (
            <>
              <Group
                label="Overdue"
                items={groups.overdue}
                color="var(--color-coral)"
                empty={view === "all" ? undefined : "Nothing overdue. Keep it that way."}
              />
              <Group label="Today" items={groups.todays} color="var(--color-mint)" />
              <Group label="Upcoming" items={groups.upcoming} color="var(--color-aqua)" />
            </>
          )}

          {view !== "open" && (
            <Group
              label="Completed"
              items={groups.done}
              color="var(--color-dim)"
              empty={view === "done" ? "Nothing completed yet today — the ring awaits." : undefined}
            />
          )}

          {view === "all" && total > 0 && groups.overdue.length + groups.todays.length + groups.upcoming.length === 0 && (
            <EmptyState
              icon={<IconCheck size={22} />}
              title="Everything's done"
              hint="All personal tasks cleared. Go live a little — the list will wait."
            />
          )}
        </div>
      </section>
    </div>
  );
}
