import { useEffect, useMemo, useState } from "react";
import type { Note, Section } from "../lib/types";
import { NOTE_COLORS } from "../lib/types";
import { cls, fmtDate } from "../lib/utils";
import { useStore } from "../state/store";
import { EmptyState, Modal, SectionHead, stagger } from "../components/ui";
import { IconCheck, IconNote, IconPencil, IconPin, IconPlus, IconSearch, IconTrash } from "../components/icons";

type Nav = (s: Section, intent?: unknown) => void;

interface FormState {
  title: string;
  body: string;
  color: string;
  pinned: boolean;
}

const emptyForm: FormState = { title: "", body: "", color: "mint", pinned: false };

export default function Notes({ intent }: { onNav: Nav; intent?: unknown }) {
  const { state, addNote, updateNote, deleteNote, togglePin, toast } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if ((intent as { add?: boolean } | undefined)?.add) openAdd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (n: Note) => {
    setEditingId(n.id);
    setForm({ title: n.title, body: n.body, color: n.color, pinned: n.pinned });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.title.trim() && !form.body.trim()) {
      toast("Write something first", "err");
      return;
    }
    if (editingId) {
      updateNote(editingId, {
        title: form.title.trim() || "Untitled",
        body: form.body,
        color: form.color,
        pinned: form.pinned,
      });
      toast("Note updated");
    } else {
      addNote({ title: form.title.trim() || "Untitled", body: form.body, color: form.color, pinned: form.pinned });
      toast("Note pinned to the pad");
    }
    setModalOpen(false);
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.notes]
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [state.notes, query]);

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="Notes"
        kickerColor="var(--color-blush)"
        title="Scratchpad."
        desc="Standup scribbles, gift ideas, half-formed thoughts — capture fast, sort later."
        right={
          <div className="flex items-center gap-2">
            <div className="relative">
              <IconSearch size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
              <input
                className="field w-40 py-1.5 pl-8 text-xs"
                placeholder="Search notes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={14} /> New note
            </button>
          </div>
        }
      />

      {list.length === 0 ? (
        <div className="panel animate-rise" style={stagger(1)}>
          <EmptyState
            icon={<IconNote size={22} />}
            title={query ? "No notes match" : "The pad is blank"}
            hint={query ? "Try another keyword." : "Jot down whatever's floating around in your head."}
            action={
              !query ? (
                <button className="btn btn-primary text-xs" onClick={openAdd}>
                  <IconPlus size={13} /> Write one
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
          {list.map((n, i) => {
            const c = NOTE_COLORS[n.color] ?? NOTE_COLORS.mint;
            return (
              <article
                key={n.id}
                className="animate-rise group relative mb-4 break-inside-avoid rounded-2xl border p-4.5 px-4 py-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: c.bg, borderColor: c.border, ...stagger(i) }}
              >
                <div className="flex items-start gap-2">
                  <h3 className="min-w-0 flex-1 font-display text-[15px] font-bold leading-snug" style={{ color: c.ink }}>
                    {n.title}
                  </h3>
                  <button
                    className={cls("icon-btn h-7 w-7", n.pinned ? "text-amber" : "opacity-0 group-hover:opacity-100")}
                    onClick={() => {
                      togglePin(n.id);
                      toast(n.pinned ? "Unpinned" : "Pinned to top", "ok");
                    }}
                    aria-label="Toggle pin"
                  >
                    <IconPin size={14} filled={n.pinned} />
                  </button>
                </div>
                {n.body && (
                  <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-mist">{n.body}</p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2.5">
                  <span className="font-mono text-[9.5px] uppercase tracking-wider text-dim">edited {fmtDate(n.updatedAt)}</span>
                  <span className="flex opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="icon-btn h-7 w-7" onClick={() => openEdit(n)} aria-label="Edit note">
                      <IconPencil size={13} />
                    </button>
                    <button
                      className="icon-btn danger h-7 w-7"
                      onClick={() => {
                        deleteNote(n.id);
                        toast("Note torn off", "warn");
                      }}
                      aria-label="Delete note"
                    >
                      <IconTrash size={13} />
                    </button>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit note" : "New note"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              <IconCheck size={14} /> {editingId ? "Save note" : "Add note"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input
              className="field"
              placeholder="e.g. Standup — Monday"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Body</label>
            <textarea
              className="field min-h-[130px] resize-y leading-relaxed"
              placeholder="Type it out… line breaks are kept"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="label">Color</label>
              <div className="flex gap-1.5">
                {Object.entries(NOTE_COLORS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setForm({ ...form, color: k })}
                    className={cls(
                      "h-7 w-7 rounded-lg border-2 transition-transform hover:scale-110",
                      form.color === k ? "border-fog" : "border-transparent"
                    )}
                    style={{ background: v.border }}
                    aria-label={`Color ${k}`}
                  />
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#f5b84b]"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              <IconPin size={13} className={form.pinned ? "text-amber" : "text-dim"} filled={form.pinned} />
              Pin it
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
