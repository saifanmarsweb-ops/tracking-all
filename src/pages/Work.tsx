import { useEffect, useRef, useState } from "react";
import type { Priority, Section, WorkStatus } from "../lib/types";
import { PRIORITY_META, WORK_COLUMNS, WORK_TAGS } from "../lib/types";
import { cls, dueLabel, todayISO } from "../lib/utils";
import { useStore } from "../state/store";
import { SectionHead, stagger } from "../components/ui";
import {
  IconCalendar,
  IconCheck,
  IconChevronL,
  IconChevronR,
  IconPlus,
  IconTerminal,
  IconTrash,
} from "../components/icons";

type Nav = (s: Section, intent?: unknown) => void;

export default function Work({ intent }: { onNav: Nav; intent?: unknown }) {
  const { state, addWork, moveWork, deleteWork, toast } = useStore();
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("dev");
  const [prio, setPrio] = useState<Priority>("med");
  const [due, setDue] = useState("");
  const [overCol, setOverCol] = useState<WorkStatus | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((intent as { add?: boolean } | undefined)?.add) titleRef.current?.focus();
  }, [intent]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      toast("Ticket needs a title", "err");
      return;
    }
    addWork({ title: t, tag, priority: prio, due: due || undefined });
    setTitle("");
    setDue("");
    toast("Ticket added to backlog");
  };

  const byCol = (s: WorkStatus) => state.work.filter((w) => w.status === s);
  const open = state.work.filter((w) => w.status !== "done").length;
  const doneCount = state.work.length - open;

  const onDrop = (e: React.DragEvent, col: WorkStatus) => {
    e.preventDefault();
    setOverCol(null);
    const id = e.dataTransfer.getData("text/plain");
    const item = state.work.find((w) => w.id === id);
    if (id && item && item.status !== col) {
      moveWork(id, col);
      toast(`#${item.seq} moved to ${WORK_COLUMNS.find((c) => c.id === col)?.label}`, "ok");
    }
  };

  const move = (id: string, dir: -1 | 1) => {
    const item = state.work.find((w) => w.id === id);
    if (!item) return;
    const idx = WORK_COLUMNS.findIndex((c) => c.id === item.status);
    const next = WORK_COLUMNS[idx + dir];
    if (next) {
      moveWork(id, next.id);
      toast(`#${item.seq} → ${next.label}`);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="IT office"
        kickerColor="var(--color-aqua)"
        title="Ops board."
        desc="Tickets, incidents and office IT — drag cards across the pipeline or nudge them with the arrows."
        right={
          <div className="flex items-center gap-2">
            <span className="chip cursor-default border-aqua/30 bg-aqua/10 text-aqua">
              <IconTerminal size={12} /> {open} open
            </span>
            <span className="chip cursor-default border-mint/30 bg-mint/10 text-mint">
              <IconCheck size={12} /> {doneCount} shipped
            </span>
          </div>
        }
      />

      <div className="animate-rise grid items-start gap-3 md:grid-cols-2 xl:grid-cols-4" style={stagger(1)}>
        {WORK_COLUMNS.map((col) => {
          const items = byCol(col.id);
          const isOver = overCol === col.id;
          return (
            <section
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col.id);
              }}
              onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
              onDrop={(e) => onDrop(e, col.id)}
              className={cls(
                "flex min-h-[300px] flex-col rounded-2xl border bg-ink-900/60 transition-all duration-200",
                isOver ? "border-dashed border-mint/50 bg-mint/[0.04]" : "border-white/[0.06]"
              )}
            >
              <header className="flex items-center gap-2 px-3.5 pb-2 pt-3.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                <h2 className="font-display text-[13.5px] font-bold">{col.label}</h2>
                <span
                  className="ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
                  style={{ background: `${col.color}1a`, color: col.color }}
                >
                  {items.length}
                </span>
              </header>
              <div className="mx-3 mb-3 h-px" style={{ background: `${col.color}2e` }} />

              <div className="flex-1 space-y-2 px-2.5 pb-2.5">
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-white/[0.08] px-3 py-5 text-center font-mono text-[10px] text-dim">
                    drop tickets here
                  </p>
                )}
                {items.map((w) => {
                  const pm = PRIORITY_META[w.priority];
                  const tg = WORK_TAGS[w.tag] ?? { label: w.tag, color: "#8a93a6" };
                  const colIdx = WORK_COLUMNS.findIndex((c) => c.id === w.status);
                  return (
                    <article
                      key={w.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", w.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className={cls(
                        "group cursor-grab rounded-xl border border-white/[0.07] bg-ink-800 p-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-white/[0.16] hover:shadow-lg active:cursor-grabbing",
                        w.status === "done" && "opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-dim">#{w.seq}</span>
                        <span
                          className="flex items-center gap-1 rounded-full px-1.5 py-[1px] font-mono text-[9px] font-bold"
                          style={{ background: `${pm.color}1a`, color: pm.color }}
                        >
                          <span className="h-1 w-1 rounded-full" style={{ background: pm.color }} />
                          {pm.label.toUpperCase()}
                        </span>
                        <button
                          className="icon-btn danger ml-auto h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => {
                            deleteWork(w.id);
                            toast(`Ticket #${w.seq} deleted`, "warn");
                          }}
                          aria-label="Delete ticket"
                        >
                          <IconTrash size={12} />
                        </button>
                      </div>
                      <h3
                        className={cls(
                          "mt-1.5 text-[13px] font-semibold leading-snug",
                          w.status === "done" && "line-through decoration-dim/60"
                        )}
                      >
                        {w.title}
                      </h3>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span
                          className="rounded-md px-1.5 py-0.5 font-mono text-[9.5px] font-semibold"
                          style={{ background: `${tg.color}17`, color: tg.color }}
                        >
                          {tg.label}
                        </span>
                        {w.due && (
                          <span
                            className={cls(
                              "flex items-center gap-1 font-mono text-[9.5px]",
                              w.due < todayISO() && w.status !== "done" ? "font-bold text-coral" : "text-dim"
                            )}
                          >
                            <IconCalendar size={10} />
                            {dueLabel(w.due)}
                          </span>
                        )}
                        <span className="ml-auto flex opacity-0 transition-opacity group-hover:opacity-100">
                          {colIdx > 0 && (
                            <button className="icon-btn h-6 w-6" onClick={() => move(w.id, -1)} aria-label="Move back">
                              <IconChevronL size={13} />
                            </button>
                          )}
                          {colIdx < WORK_COLUMNS.length - 1 && (
                            <button className="icon-btn h-6 w-6" onClick={() => move(w.id, 1)} aria-label="Move forward">
                              <IconChevronR size={13} />
                            </button>
                          )}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {col.id === "backlog" && (
                <form className="border-t border-white/[0.06] p-2.5" onSubmit={submit}>
                  <div className="flex items-center gap-1.5">
                    <IconPlus size={13} className="flex-none text-aqua" />
                    <input
                      ref={titleRef}
                      className="field border-transparent bg-transparent px-1 py-1 text-xs shadow-none focus:border-mint/40"
                      placeholder="New ticket… Enter to add"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 pl-[22px]">
                    <select className="field w-auto px-2 py-1 text-[10.5px]" value={tag} onChange={(e) => setTag(e.target.value)}>
                      {Object.entries(WORK_TAGS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <select
                      className="field w-auto px-2 py-1 text-[10.5px]"
                      value={prio}
                      onChange={(e) => setPrio(e.target.value as Priority)}
                    >
                      {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                        <option key={p} value={p}>
                          {PRIORITY_META[p].label}
                        </option>
                      ))}
                    </select>
                    <input
                      className="field w-auto flex-1 px-2 py-1 text-[10.5px]"
                      type="date"
                      min={todayISO()}
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                      title="Due date (optional)"
                    />
                  </div>
                </form>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
