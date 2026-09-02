import type { Section } from "../lib/types";
import { todayISO } from "../lib/utils";
import { useStore } from "../state/store";
import {
  IconGrid,
  IconKey,
  IconNote,
  IconSpark,
  IconTarget,
  IconTasks,
  IconTerminal,
  IconWallet,
  type IconProps,
} from "./icons";
import { Ring } from "./ui";
import { BackupControls } from "./Backup";
import { cls } from "../lib/utils";

const NAV: { id: Section; label: string; icon: (p: IconProps) => React.ReactElement; hue: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: IconGrid, hue: "var(--color-mint)" },
  { id: "finance", label: "Finance", icon: IconWallet, hue: "var(--color-aqua)" },
  { id: "budget", label: "Budget", icon: IconTarget, hue: "var(--color-amber)" },
  { id: "tasks", label: "Daily Tasks", icon: IconTasks, hue: "var(--color-mint)" },
  { id: "work", label: "IT Work", icon: IconTerminal, hue: "var(--color-aqua)" },
  { id: "vault", label: "Passwords", icon: IconKey, hue: "var(--color-lav)" },
  { id: "notes", label: "Notes", icon: IconNote, hue: "var(--color-blush)" },
];

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-mint/25 bg-mint/10 text-mint shadow-[0_0_24px_-6px_rgba(62,207,142,0.5)]">
        <IconSpark size={17} />
      </span>
      <div className="leading-none">
        <div className="font-display text-[1.05rem] font-bold tracking-tight">
          Life<span className="text-mint">OS</span>
        </div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-dim">
          day console
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  section,
  onNav,
}: {
  section: Section;
  onNav: (s: Section) => void;
}) {
  const { state } = useStore();
  const done = state.tasks.filter((t) => t.done).length;
  const total = state.tasks.length;
  const frac = total ? done / total : 0;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-white/[0.06] bg-ink-900/80 px-4 py-5 backdrop-blur-md lg:flex">
      <Brand />
      <nav className="mt-8 flex flex-col gap-1">
        {NAV.map((n) => {
          const active = section === n.id;
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              onClick={() => onNav(n.id)}
              className={cls(
                "group relative flex w-full items-center gap-3 rounded-[10px] px-3 py-[9px] text-left text-[0.855rem] font-medium transition-all duration-200",
                active
                  ? "bg-white/[0.06] text-fog"
                  : "text-mist hover:bg-white/[0.035] hover:text-fog"
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
                  style={{ background: n.hue }}
                />
              )}
              <span
                className="transition-colors"
                style={{ color: active ? n.hue : undefined }}
              >
                <Icon size={17} />
              </span>
              {n.label}
              {n.id === "tasks" && total - done > 0 && (
                <span className="ml-auto rounded-full bg-mint/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-mint">
                  {total - done}
                </span>
              )}
              {n.id === "work" && (
                <span className="ml-auto rounded-full bg-aqua/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-aqua">
                  {state.work.filter((w) => w.status !== "done").length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="panel flex items-center gap-3.5 p-3.5">
          <Ring value={frac} size={54} stroke={6}>
            <span className="font-mono text-[11px] font-bold text-fog">
              {Math.round(frac * 100)}%
            </span>
          </Ring>
          <div className="min-w-0">
            <div className="text-[0.8rem] font-semibold leading-tight">Personal tasks</div>
            <div className="mt-0.5 font-mono text-[10.5px] text-dim">
              {done}/{total} done · {todayISO().slice(5).replace("-", "/")}
            </div>
          </div>
        </div>
        <BackupControls />
        <p className="mt-3 px-1 font-mono text-[9.5px] leading-relaxed text-dim/70">
          no server · data lives in this browser
          <br />
          v1.1 · lifeos.local
        </p>
      </div>
    </aside>
  );
}

export function MobileNav({
  section,
  onNav,
}: {
  section: Section;
  onNav: (s: Section) => void;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <Brand />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">
          {todayISO()}
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV.map((n) => {
          const active = section === n.id;
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              onClick={() => onNav(n.id)}
              className={cls(
                "flex flex-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                active
                  ? "border-mint/40 bg-mint/12 text-mint"
                  : "border-white/[0.08] text-mist hover:text-fog"
              )}
            >
              <Icon size={14} />
              {n.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
