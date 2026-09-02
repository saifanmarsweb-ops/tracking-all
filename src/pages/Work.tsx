import { useEffect, useMemo, useRef, useState } from "react";
import type { Priority, Project, Section, WorkStatus, WorkTask } from "../lib/types";
import { PRIORITY_META, PROJECT_COLORS, WORK_COLUMNS, WORK_TAGS } from "../lib/types";
import { cls, dueLabel, todayISO } from "../lib/utils";
import { useStore } from "../state/store";
import { EmptyState, Modal, SectionHead, stagger } from "../components/ui";
import {
  IconCalendar,
  IconCheck,
  IconChevronL,
  IconChevronR,
  IconDots,
  IconInbox,
  IconPlus,
  IconTerminal,
  IconTrash,
  IconX,
} from "../components/icons";

type Nav = (s: Section, intent?: unknown) => void;

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; id: string }
  | { mode: "delete"; id: string }
  | null;

function suggestCode(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return letters.slice(0, 3) || "PRJ";
}

export default function Work({ intent }: { onNav: Nav; intent?: unknown }) {
  const { state, addWork, moveWork, deleteWork, addProject, updateProject, deleteProject, toast } =
    useStore();
  const today = todayISO();

  const [filter, setFilter] = useState<string>("all");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  // project form
  const [pName, setPName] = useState("");
  const [pCode, setPCode] = useState("");
  const [pCodeTouched, setPCodeTouched] = useState(false);
  const [pColor, setPColor] = useState(PROJECT_COLORS[0]);

  // ticket form
  const [tTitle, setTTitle] = useState("");
  const [tTag, setTTag] = useState("dev");
  const [tPrio, setTPrio] = useState<Priority>("med");
  const [tDue, setTDue] = useState("");
  const [tProject, setTProject] = useState("");
  const tInputRef = useRef<HTMLInputElement>(null);

  const projById = useMemo(
    () => new Map(state.projects.map((p) => [p.id, p] as const)),
    [state.projects]
  );

  useEffect(() => {
    if ((intent as { add?: boolean } | undefined)?.add) {
      window.setTimeout(() => tInputRef.current?.focus(), 80);
    }
  }, [intent]);

  const activeFilter = filter !== "all" && projById.has(filter) ? filter : "all";
  const activeProject = activeFilter !== "all" ? projById.get(activeFilter) ?? null : null;

  const visible = useMemo(
    () => state.work.filter((w) => activeFilter === "all" || w.projectId === activeFilter),
    [state.work, activeFilter]
  );
  const byCol = (c: WorkStatus) => visible.filter((w) => w.status === c);
  const openVisible = visible.filter((w) => w.status !== "done").length;
  const doneVisible = visible.length - openVisible;

  /* ---------- project form ---------- */

  const editingId = modal?.mode === "edit" ? modal.id : null;
  const deleting = modal?.mode === "delete" ? projById.get(modal.id) : null;
  const deletingCount = deleting ? state.work.filter((w) => w.projectId === deleting.id).length : 0;

  const openProjectForm = (proj?: Project) => {
    setPName(proj?.name ?? "");
    setPCode(proj?.code ?? "");
    setPCodeTouched(!!proj);
    setPColor(proj?.color ?? PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length]);
    setModal(proj ? { mode: "edit", id: proj.id } : { mode: "create" });
    setMenuFor(null);
  };

  const saveProject = () => {
    const name = pName.trim();
    const code = pCode.trim().toUpperCase();
    if (!name) {
      toast("Project needs a name", "err");
      return;
    }
    if (!/^[A-Z0-9]{2,5}$/.test(code)) {
      toast("Code must be 2–5 letters or digits", "err");
      return;
    }
    const clash = state.projects.some(
      (p) => p.code.toUpperCase() === code && p.id !== editingId
    );
    if (clash) {
      toast(`Code “${code}” is already taken`, "err");
      return;
    }
    if (editingId) {
      updateProject(editingId, { name, code, color: pColor });
      toast(`Project “${name}” updated`);
    } else {
      addProject({ name, code, color: pColor });
      toast(`Project “${name}” created — add its first ticket`);
    }
    setModal(null);
  };

  const confirmDeleteProject = () => {
    if (!deleting) return;
    deleteProject(deleting.id);
    if (activeFilter === deleting.id) setFilter("all");
    toast(
      deletingCount > 0
        ? `“${deleting.name}” and ${deletingCount} ticket${deletingCount > 1 ? "s" : ""} removed`
        : `“${deleting.name}” removed`,
      "warn"
    );
    setModal(null);
  };

  /* ---------- ticket form ---------- */

  const submitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const title = tTitle.trim();
    const projectId = tProject || activeProject?.id || state.projects[0]?.id;
    if (!title) {
      toast("Ticket needs a title", "err");
      return;
    }
    if (!projectId) {
      toast("Create a project first — tickets live inside projects", "err");
      return;
    }
    addWork({ title, tag: tTag, priority: tPrio, due: tDue || undefined, projectId });
    const proj = projById.get(projectId);
    toast(`${proj?.code ?? "T"}-${(visible.filter((w) => w.projectId === projectId).length || 0) + 1} added to backlog`);
    setTTitle("");
    setTDue("");
  };

  /* ---------- card ---------- */

  const Card = ({ w }: { w: WorkTask }) => {
    const proj = projById.get(w.projectId);
    const pm = PRIORITY_META[w.priority];
    const tag = WORK_TAGS[w.tag];
    const idx = WORK_COLUMNS.findIndex((c) => c.id === w.status);
    const isOver = !!w.due && w.due < today && w.status !== "done";
    return (
      <div
        draggable
        onDragStart={() => setDragId(w.id)}
        onDragEnd={() => setDragId(null)}
        className={cls(
          "group cursor-grab rounded-xl border border-white/[0.07] bg-ink-800/90 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.16] hover:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.8)] active:cursor-grabbing",
          dragId === w.id && "opacity-40"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wide"
            style={{ color: proj?.color ?? "#8a93a6" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: proj?.color ?? "#8a93a6" }}
            />
            {proj?.code ?? "?"}-{w.seq}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
            style={{ color: pm.color, background: `${pm.color}1a` }}
          >
            {pm.label}
          </span>
        </div>
        <p
          className={cls(
            "mt-1.5 text-[13px] font-semibold leading-snug",
            w.status === "done" && "text-dim line-through decoration-dim/50"
          )}
        >
          {w.title}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {tag && (
            <span
              className="rounded-md px-1.5 py-0.5 font-mono text-[9.5px] font-semibold"
              style={{ color: tag.color, background: `${tag.color}14`, border: `1px solid ${tag.color}2e` }}
            >
              {tag.label}
            </span>
          )}
          {w.due && (
            <span
              className={cls(
                "flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9.5px] font-semibold",
                isOver ? "bg-coral/12 text-coral" : "bg-white/[0.05] text-dim"
              )}
            >
              <IconCalendar size={10} /> {dueLabel(w.due)}
            </span>
          )}
          <span className="ml-auto flex items-center opacity-0 transition-opacity group-hover:opacity-100">
            <button
              className="icon-btn !h-6 !w-6"
              disabled={idx === 0}
              onClick={() => moveWork(w.id, WORK_COLUMNS[idx - 1].id)}
              aria-label="Move left"
            >
              <IconChevronL size={13} />
            </button>
            <button
              className="icon-btn !h-6 !w-6"
              disabled={idx === WORK_COLUMNS.length - 1}
              onClick={() => {
                moveWork(w.id, WORK_COLUMNS[idx + 1].id);
                if (idx + 1 === WORK_COLUMNS.length - 1) toast("Ticket shipped — nice", "ok");
              }}
              aria-label="Move right"
            >
              <IconChevronR size={13} />
            </button>
            <button
              className="icon-btn danger !h-6 !w-6"
              onClick={() => {
                deleteWork(w.id);
                toast("Ticket deleted", "warn");
              }}
              aria-label="Delete ticket"
            >
              <IconTrash size={13} />
            </button>
          </span>
        </div>
      </div>
    );
  };

  /* ---------- render ---------- */

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="IT · Office"
        kickerColor="var(--color-aqua)"
        title="Project board."
        desc="Office work, organized by project. Spin up a project, file tickets, drag them across the pipeline."
        right={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => openProjectForm()}>
              <IconPlus size={14} /> New project
            </button>
            <button
              className="btn btn-primary"
              onClick={() => tInputRef.current?.focus()}
              disabled={state.projects.length === 0}
            >
              <IconTerminal size={14} /> New ticket
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[248px_1fr]">
        {/* -------- project rail -------- */}
        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <div className="panel animate-rise overflow-hidden" style={stagger(1)}>
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
                Projects ({state.projects.length})
              </span>
              <button className="icon-btn !h-6 !w-6 text-mint" onClick={() => openProjectForm()} aria-label="New project">
                <IconPlus size={14} />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={() => setFilter("all")}
                className={cls(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition-all",
                  activeFilter === "all"
                    ? "bg-white/[0.06] text-fog"
                    : "text-mist hover:bg-white/[0.03] hover:text-fog"
                )}
              >
                <IconInbox size={15} className={activeFilter === "all" ? "text-aqua" : "text-dim"} />
                All tickets
                <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-dim">
                  {state.work.filter((w) => w.status !== "done").length}
                </span>
              </button>

              {state.projects.length === 0 && (
                <p className="px-2.5 py-3 text-[11.5px] leading-relaxed text-dim">
                  No projects yet. Create one — like <i>“Website relaunch”</i> — and its tickets
                  will be numbered automatically.
                </p>
              )}

              <ul className="mt-1 space-y-0.5">
                {state.projects.map((p) => {
                  const tickets = state.work.filter((w) => w.projectId === p.id);
                  const open = tickets.filter((w) => w.status !== "done").length;
                  const active = activeFilter === p.id;
                  return (
                    <li key={p.id} className="group relative">
                      <button
                        onClick={() => setFilter(active ? "all" : p.id)}
                        className={cls(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all",
                          active
                            ? "bg-white/[0.06] text-fog"
                            : "text-mist hover:bg-white/[0.03] hover:text-fog"
                        )}
                        style={active ? { boxShadow: `inset 2px 0 0 ${p.color}` } : undefined}
                      >
                        <span
                          className="h-2.5 w-2.5 flex-none rounded-[4px]"
                          style={{ background: p.color }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold leading-tight">
                            {p.name}
                          </span>
                          <span className="mt-0.5 block font-mono text-[9.5px] uppercase tracking-wider text-dim">
                            {p.code} · {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
                          </span>
                        </span>
                        {open > 0 && (
                          <span
                            className="flex-none rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold"
                            style={{ color: p.color, background: `${p.color}1a` }}
                          >
                            {open}
                          </span>
                        )}
                      </button>
                      <button
                        className="icon-btn !h-6 !w-6 absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuFor(menuFor === p.id ? null : p.id);
                        }}
                        aria-label={`Project menu for ${p.name}`}
                      >
                        <IconDots size={13} />
                      </button>
                      {menuFor === p.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                          <div className="animate-pop absolute right-1 top-8 z-40 w-32 overflow-hidden rounded-lg border border-white/10 bg-ink-750 py-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.85)]">
                            <button
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-mist hover:bg-white/[0.06] hover:text-fog"
                              onClick={() => openProjectForm(p)}
                            >
                              <IconPencilMini /> Edit
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-coral hover:bg-coral/10"
                              onClick={() => {
                                setMenuFor(null);
                                setModal({ mode: "delete", id: p.id });
                              }}
                            >
                              <IconTrash size={12} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {activeProject && (
            <div
              className="panel animate-rise border-l-2 p-4"
              style={{ borderLeftColor: activeProject.color, ...stagger(2) }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold"
                  style={{ color: activeProject.color, background: `${activeProject.color}1a` }}
                >
                  {activeProject.code}
                </span>
                <button className="chip !py-1 text-[10px]" onClick={() => setFilter("all")}>
                  <IconX size={10} /> Clear filter
                </button>
              </div>
              <h3 className="mt-2 font-display text-lg font-bold leading-tight">{activeProject.name}</h3>
              <p className="mt-1 font-mono text-[10.5px] text-dim">
                {openVisible} open · {doneVisible} done
              </p>
              {doneVisible + openVisible > 0 && (
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="animate-growx h-full rounded-full"
                    style={{
                      width: `${((doneVisible / (doneVisible + openVisible)) * 100).toFixed(1)}%`,
                      background: activeProject.color,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </aside>

        {/* -------- board -------- */}
        <section className="min-w-0 space-y-4">
          {/* ticket form */}
          {state.projects.length > 0 ? (
            <form className="panel animate-rise p-4" style={stagger(1)} onSubmit={submitTicket}>
              <div className="flex flex-col gap-2.5">
                <div className="relative">
                  <IconTerminal size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-aqua" />
                  <input
                    ref={tInputRef}
                    className="field pl-10"
                    placeholder={
                      activeProject
                        ? `New ${activeProject.code} ticket — press Enter to file it…`
                        : "New ticket — press Enter to file it…"
                    }
                    value={tTitle}
                    onChange={(e) => setTTitle(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="field w-auto py-1.5 text-xs font-semibold"
                    value={tProject || activeProject?.id || state.projects[0]?.id || ""}
                    onChange={(e) => setTProject(e.target.value)}
                  >
                    {state.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="field w-auto py-1.5 text-xs"
                    value={tTag}
                    onChange={(e) => setTTag(e.target.value)}
                  >
                    {Object.entries(WORK_TAGS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="field w-auto py-1.5 text-xs"
                    value={tPrio}
                    onChange={(e) => setTPrio(e.target.value as Priority)}
                  >
                    {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_META[p].label} priority
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="field w-auto py-1.5 font-mono text-xs"
                    value={tDue}
                    min={today}
                    onChange={(e) => setTDue(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary ml-auto">
                    <IconPlus size={13} /> File ticket
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="panel animate-rise flex flex-wrap items-center gap-3 p-4" style={stagger(1)}>
              <p className="flex-1 text-sm text-mist">
                Tickets belong to projects. Create your first project to start the board.
              </p>
              <button className="btn btn-primary" onClick={() => openProjectForm()}>
                <IconPlus size={13} /> New project
              </button>
            </div>
          )}

          {/* columns */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {WORK_COLUMNS.map((col, ci) => {
              const items = byCol(col.id);
              return (
                <div
                  key={col.id}
                  className={cls(
                    "animate-rise rounded-[13px] border border-white/[0.05] bg-ink-900/50 p-2.5 transition-colors",
                    dragId && "border-dashed border-white/[0.14]"
                  )}
                  style={stagger(2 + ci)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) {
                      moveWork(dragId, col.id);
                      if (col.id === "done") toast("Ticket shipped — nice", "ok");
                    }
                    setDragId(null);
                  }}
                >
                  <div className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-mist">
                      {col.label}
                    </span>
                    <span
                      className="tabular ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                      style={{ background: `${col.color}14`, color: col.color }}
                    >
                      {items.length}
                    </span>
                  </div>
                  <div className="min-h-[72px] space-y-2">
                    {items.length === 0 && (
                      <div className="flex h-[72px] items-center justify-center rounded-xl border border-dashed border-white/[0.08] text-[11px] text-dim/80">
                        {dragId ? "Drop here" : "No tickets"}
                      </div>
                    )}
                    {items.map((w) => (
                      <Card key={w.id} w={w} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {state.work.length === 0 && (
            <EmptyState
              icon={<IconTerminal size={22} />}
              title="The board is clear"
              hint="File a ticket above — it lands in Backlog with a project code like ATL-1."
            />
          )}
        </section>
      </div>

      {/* -------- project create / edit modal -------- */}
      <Modal
        open={modal?.mode === "create" || modal?.mode === "edit"}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit project" : "New project"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={saveProject}>
              <IconCheck size={14} /> {modal?.mode === "edit" ? "Save changes" : "Create project"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Project name *</label>
            <input
              className="field"
              placeholder="e.g. Website relaunch"
              value={pName}
              autoFocus
              onChange={(e) => {
                setPName(e.target.value);
                if (!pCodeTouched) setPCode(suggestCode(e.target.value));
              }}
            />
          </div>
          <div>
            <label className="label">Ticket prefix *</label>
            <div className="flex items-center gap-2">
              <input
                className="field w-28 font-mono uppercase"
                maxLength={5}
                placeholder="ATL"
                value={pCode}
                onChange={(e) => {
                  setPCodeTouched(true);
                  setPCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                }}
              />
              <span className="font-mono text-xs text-dim">
                → tickets will read{" "}
                <b className="text-aqua">{(pCode.trim() || "PRJ")}-1</b>,{" "}
                <b className="text-aqua">{(pCode.trim() || "PRJ")}-2</b>…
              </span>
            </div>
          </div>
          <div>
            <label className="label">Project color</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPColor(c)}
                  aria-label={`Use color ${c}`}
                  className={cls(
                    "h-8 w-8 rounded-lg transition-transform hover:scale-110",
                    pColor === c && "ring-2 ring-fog ring-offset-2 ring-offset-ink-850"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* -------- delete confirm modal -------- */}
      <Modal
        open={modal?.mode === "delete"}
        onClose={() => setModal(null)}
        title="Delete project"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>
              Keep it
            </button>
            <button className="btn btn-danger" onClick={confirmDeleteProject}>
              <IconTrash size={14} /> Delete project
            </button>
          </>
        }
      >
        {deleting && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-mist">
              Remove{" "}
              <b className="text-fog" style={{ color: deleting.color }}>
                {deleting.name}
              </b>{" "}
              <span className="font-mono text-xs text-dim">({deleting.code})</span> from the board?
            </p>
            {deletingCount > 0 && (
              <p className="rounded-lg border border-coral/25 bg-coral/[0.08] px-3 py-2 text-[12.5px] text-coral">
                Heads up: {deletingCount} ticket{deletingCount > 1 ? "s" : ""} in this project will
                be deleted with it.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function IconPencilMini() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15.3 5.2l3.5 3.5L8.3 19.2l-4.5 1 1-4.5z" />
      <path d="M13.3 7.2l3.5 3.5" />
    </svg>
  );
}
