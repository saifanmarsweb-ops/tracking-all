import { useEffect, useMemo, useState } from "react";
import type { Section, VaultEntry } from "../lib/types";
import { cls, copyText, fmtDate, genPassword, initials, monogramColor, passwordStrength } from "../lib/utils";
import { useStore } from "../state/store";
import { EmptyState, Modal, SectionHead, stagger } from "../components/ui";
import {
  IconAlert,
  IconCheck,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLock,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconStar,
  IconTrash,
} from "../components/icons";

type Nav = (s: Section, intent?: unknown) => void;

interface FormState {
  site: string;
  url: string;
  username: string;
  password: string;
  favorite: boolean;
}

const emptyForm: FormState = { site: "", url: "", username: "", password: "", favorite: false };

export default function Vault({ intent }: { onNav: Nav; intent?: unknown }) {
  const { state, addVault, updateVault, deleteVault, toggleVaultFav, toast } = useStore();

  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // generator
  const [len, setLen] = useState(18);
  const [opts, setOpts] = useState({ upper: true, lower: true, digits: true, symbols: true });
  const [gen, setGen] = useState(() => genPassword(18, { upper: true, lower: true, digits: true, symbols: true }));

  useEffect(() => {
    if ((intent as { add?: boolean } | undefined)?.add) openAdd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const regen = (l = len, o = opts) => setGen(genPassword(l, o));

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, password: gen });
    setModalOpen(true);
  };

  const openEdit = (e: VaultEntry) => {
    setEditingId(e.id);
    setForm({ site: e.site, url: e.url ?? "", username: e.username, password: e.password, favorite: e.favorite });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.site.trim() || !form.password.trim()) {
      toast("Site and password are required", "err");
      return;
    }
    if (editingId) {
      updateVault(editingId, {
        site: form.site.trim(),
        url: form.url.trim() || undefined,
        username: form.username.trim(),
        password: form.password,
        favorite: form.favorite,
      });
      toast("Entry updated");
    } else {
      addVault({
        site: form.site.trim(),
        url: form.url.trim() || undefined,
        username: form.username.trim(),
        password: form.password,
        favorite: form.favorite,
      });
      toast(`${form.site.trim()} added to the vault`);
    }
    setModalOpen(false);
  };

  const copy = async (text: string, what: string) => {
    const ok = await copyText(text);
    toast(ok ? `${what} copied to clipboard` : "Copy failed — select manually", ok ? "ok" : "err");
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.vault]
      .filter((v) => (favOnly ? v.favorite : true))
      .filter((v) => !q || v.site.toLowerCase().includes(q) || v.username.toLowerCase().includes(q) || (v.url ?? "").toLowerCase().includes(q))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.site.localeCompare(b.site));
  }, [state.vault, query, favOnly]);

  const weak = state.vault.filter((v) => passwordStrength(v.password).score <= 1);
  const genStrength = passwordStrength(gen);

  return (
    <div className="space-y-5">
      <SectionHead
        kicker="Vault"
        kickerColor="var(--color-lav)"
        title="The keyring."
        desc="Logins and secrets, kept offline in this browser only. Generate strong ones, retire the weak ones."
        right={
          <button className="btn btn-primary" onClick={openAdd}>
            <IconPlus size={14} /> New entry
          </button>
        }
      />

      {weak.length > 0 && (
        <div className="animate-rise flex items-center gap-3 rounded-xl border border-coral/30 bg-coral/[0.08] px-4 py-3" style={stagger(1)}>
          <IconAlert size={17} className="flex-none text-coral" />
          <p className="text-[13px] text-fog">
            <b className="text-coral">{weak.length} weak password{weak.length > 1 ? "s" : ""}</b> detected —{" "}
            {weak.map((w) => w.site).join(", ")}. Hit edit and swap in a generated one.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* generator */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="panel animate-rise p-5" style={stagger(2)}>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-bold">
                <IconLock size={15} className="text-lav" /> Generator
              </h3>
              <button className="icon-btn" onClick={() => regen()} aria-label="Regenerate">
                <IconRefresh size={15} />
              </button>
            </div>
            <div className="mt-3.5 rounded-xl border border-white/[0.08] bg-ink-950/70 px-3.5 py-3">
              <div className="tabular break-all font-mono text-[13.5px] font-semibold leading-relaxed text-mint">
                {gen}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-1.5 flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-full transition-colors duration-300"
                    style={{ background: i < genStrength.score ? genStrength.color : "rgba(255,255,255,0.08)" }}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] font-bold" style={{ color: genStrength.color }}>
                {genStrength.label}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="label mb-0">Length</label>
                <span className="tabular font-mono text-xs font-bold text-lav">{len}</span>
              </div>
              <input
                type="range"
                min={8}
                max={32}
                value={len}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setLen(v);
                  regen(v);
                }}
                className="mt-2 w-full accent-[#c79bf2]"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {(
                [
                  ["upper", "A–Z"],
                  ["lower", "a–z"],
                  ["digits", "0–9"],
                  ["symbols", "!@#$"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    const next = { ...opts, [k]: !opts[k] };
                    if (!next.upper && !next.lower && !next.digits && !next.symbols) {
                      toast("Keep at least one character set", "warn");
                      return;
                    }
                    setOpts(next);
                    regen(len, next);
                  }}
                  className={cls("chip justify-center font-mono", opts[k] && "on")}
                >
                  {opts[k] && <IconCheck size={11} />}
                  {l}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="btn btn-ghost" onClick={() => copy(gen, "Password")}>
                <IconCopy size={13} /> Copy
              </button>
              <button className="btn btn-ghost" onClick={() => regen()}>
                <IconRefresh size={13} /> Reroll
              </button>
            </div>
          </div>
          <div className="panel animate-rise p-4" style={stagger(3)}>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">vault status</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {[
                { n: state.vault.length, l: "entries", c: "var(--color-fog)" },
                { n: state.vault.filter((v) => v.favorite).length, l: "starred", c: "var(--color-amber)" },
                { n: weak.length, l: "weak", c: weak.length ? "var(--color-coral)" : "var(--color-mint)" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2.5">
                  <div className="tabular font-display text-xl font-bold" style={{ color: s.c }}>
                    {s.n}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-dim">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* entries */}
        <section className="panel animate-rise lg:col-span-2" style={stagger(2)}>
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <h3 className="mr-auto font-display text-base font-bold">
              Entries <span className="font-mono text-xs font-normal text-dim">({list.length})</span>
            </h3>
            <button className={cls("chip", favOnly && "on")} onClick={() => setFavOnly(!favOnly)}>
              <IconStar size={11} filled={favOnly} /> Starred
            </button>
            <div className="relative">
              <IconSearch size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
              <input
                className="field w-44 py-1.5 pl-8 text-xs"
                placeholder="Search vault…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {list.length === 0 ? (
            <EmptyState
              icon={<IconKey size={22} />}
              title={query || favOnly ? "No matches" : "Vault is empty"}
              hint={query || favOnly ? "Try a different search or clear the filters." : "Add your first login — a generated password comes free."}
              action={
                !query && !favOnly ? (
                  <button className="btn btn-primary text-xs" onClick={openAdd}>
                    <IconPlus size={13} /> New entry
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {list.map((v) => {
                const st = passwordStrength(v.password);
                const shown = !!revealed[v.id];
                const color = monogramColor(v.site);
                return (
                  <li key={v.id} className="group flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3.5 transition-colors hover:bg-white/[0.025] sm:flex-nowrap">
                    <span
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-xl font-display text-sm font-bold"
                      style={{ background: `${color}1c`, color, border: `1px solid ${color}33` }}
                    >
                      {initials(v.site)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold">{v.site}</span>
                        {v.favorite && <IconStar size={11} filled className="flex-none text-amber" />}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-dim">
                        <span className="truncate">{v.username || "—"}</span>
                        {v.url && (
                          <>
                            <span>·</span>
                            <span className="truncate">{v.url}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>upd {fmtDate(v.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex w-full items-center gap-1.5 sm:w-auto sm:flex-none">
                      <code className="tabular min-w-0 flex-1 truncate rounded-lg border border-white/[0.07] bg-ink-950/60 px-2.5 py-1.5 font-mono text-[11.5px] text-mist sm:flex-none sm:basis-[150px]">
                        {shown ? v.password : "••••••••••••"}
                      </code>
                      <button
                        className="icon-btn"
                        onClick={() => setRevealed((r) => ({ ...r, [v.id]: !shown }))}
                        aria-label={shown ? "Hide password" : "Show password"}
                      >
                        {shown ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                      </button>
                      <button className="icon-btn" onClick={() => copy(v.password, `${v.site} password`)} aria-label="Copy password">
                        <IconCopy size={14} />
                      </button>
                      <button className="icon-btn" onClick={() => copy(v.username, "Username")} aria-label="Copy username">
                        <span className="font-mono text-[9px] font-bold">user</span>
                      </button>
                    </div>

                    <div className="flex flex-none items-center gap-1">
                      <span className="mr-1 flex items-center gap-1" title={`${st.label} password`}>
                        {[0, 1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className="h-3 w-[3px] rounded-full"
                            style={{ background: i < st.score ? st.color : "rgba(255,255,255,0.1)" }}
                          />
                        ))}
                      </span>
                      <button
                        className={cls("icon-btn", v.favorite ? "text-amber" : "")}
                        onClick={() => toggleVaultFav(v.id)}
                        aria-label="Toggle star"
                      >
                        <IconStar size={14} filled={v.favorite} />
                      </button>
                      <button className="icon-btn" onClick={() => openEdit(v)} aria-label="Edit entry">
                        <IconPencil size={14} />
                      </button>
                      <button
                        className="icon-btn danger opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => {
                          deleteVault(v.id);
                          toast(`${v.site} removed from vault`, "warn");
                        }}
                        aria-label="Delete entry"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* add / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit entry" : "New vault entry"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              <IconCheck size={14} /> {editingId ? "Save changes" : "Add to vault"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Site / service *</label>
              <input className="field" placeholder="e.g. GitHub" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} autoFocus />
            </div>
            <div>
              <label className="label">URL</label>
              <input className="field" placeholder="github.com" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Username / email</label>
            <input className="field" placeholder="you@work.io" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label className="label">Password *</label>
            <div className="flex gap-2">
              <input
                className="field tabular flex-1 font-mono text-sm"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="paste or generate →"
              />
              <button
                type="button"
                className="btn btn-ghost flex-none"
                onClick={() => {
                  setForm({ ...form, password: gen });
                  toast("Generated password inserted");
                }}
              >
                <IconRefresh size={13} /> Use generated
              </button>
            </div>
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-1 flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => {
                    const s = passwordStrength(form.password);
                    return (
                      <span
                        key={i}
                        className="flex-1 rounded-full"
                        style={{ background: i < s.score ? s.color : "rgba(255,255,255,0.08)" }}
                      />
                    );
                  })}
                </div>
                <span className="font-mono text-[10px] font-bold" style={{ color: passwordStrength(form.password).color }}>
                  {passwordStrength(form.password).label}
                </span>
              </div>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/[0.07] bg-ink-800/60 px-3 py-2.5 text-sm font-medium transition-colors hover:border-white/[0.14]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#f5b84b]"
              checked={form.favorite}
              onChange={(e) => setForm({ ...form, favorite: e.target.checked })}
            />
            <IconStar size={13} className={form.favorite ? "text-amber" : "text-dim"} filled={form.favorite} />
            Pin as favorite — starred entries float to the top
          </label>
        </div>
      </Modal>
    </div>
  );
}
