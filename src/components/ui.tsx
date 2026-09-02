import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cls } from "../lib/utils";
import { useStore } from "../state/store";
import { IconAlert, IconCheck, IconInbox, IconX } from "./icons";

/* ---------- section header ---------- */

export function SectionHead({
  kicker,
  kickerColor = "var(--color-mint)",
  title,
  desc,
  right,
}: {
  kicker: string;
  kickerColor?: string;
  title: ReactNode;
  desc?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="animate-rise">
      <div className="kicker" style={{ color: kickerColor }}>
        <span
          className="inline-block h-[7px] w-[7px] rounded-full animate-pulsesoft"
          style={{ background: kickerColor }}
        />
        {kicker}
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <h1 className="font-display text-[1.9rem] leading-tight font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
      {desc && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">{desc}</p>}
    </header>
  );
}

/* ---------- progress bar ---------- */

export function HBar({
  value,
  color,
  className,
  h = 8,
}: {
  value: number; // 0..1+
  color: string;
  className?: string;
  h?: number;
}) {
  const w = Math.max(0, Math.min(value, 1)) * 100;
  const over = value > 1;
  return (
    <div
      className={cls("w-full overflow-hidden rounded-full bg-white/[0.06]", className)}
      style={{ height: h }}
    >
      <div
        className="animate-growx h-full rounded-full"
        style={{
          width: `${over ? 100 : w}%`,
          background: over ? "var(--color-coral)" : color,
          boxShadow: `0 0 12px ${over ? "rgba(242,112,91,.45)" : "transparent"}`,
        }}
      />
    </div>
  );
}

/* ---------- progress ring ---------- */

export function Ring({
  value,
  size = 116,
  stroke = 10,
  color = "var(--color-mint)",
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 60);
    return () => window.clearTimeout(t);
  }, []);
  const off = on ? C * (1 - Math.min(Math.max(value, 0), 1)) : C;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------- donut ---------- */

export function Donut({
  segments,
  size = 156,
  thickness = 17,
  children,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  children?: ReactNode;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 60);
    return () => window.clearTimeout(t);
  }, []);
  let acc = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.055)"
          strokeWidth={thickness}
        />
        {segments.map((s, i) => {
          const frac = total > 0 ? s.value / total : 0;
          const offset = acc;
          acc += frac;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${(on ? frac : 0) * C} ${C}`}
              strokeDashoffset={-offset * C}
              style={{
                transition: `stroke-dasharray .9s cubic-bezier(.22,1,.36,1) ${i * 80}ms`,
              }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------- mini bar chart ---------- */

export function MiniBars({
  data,
  height = 92,
  color = "var(--color-aqua)",
  format,
  highlightLast = true,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  format?: (v: number) => string;
  highlightLast?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-[5px]">
      {data.map((d, i) => {
        const last = highlightLast && i === data.length - 1;
        return (
          <div key={i} className="group relative flex h-full flex-1 flex-col justify-end" style={{ height: height + 18 }}>
            <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-white/10 bg-ink-700 px-1.5 py-0.5 font-mono text-[10px] text-fog shadow-lg group-hover:block">
              {format ? format(d.value) : d.value}
            </div>
            <div
              className="animate-growy w-full rounded-[3px] transition-[filter] group-hover:brightness-125"
              style={{
                height: `${Math.max((d.value / max) * height, 3)}px`,
                background: d.value === 0 ? "rgba(255,255,255,0.07)" : last ? "var(--color-mint)" : color,
                animationDelay: `${i * 36}ms`,
              }}
            />
            <div className="mt-1.5 text-center font-mono text-[9px] text-dim group-hover:text-mist">
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-ink-950/75 backdrop-blur-[3px]"
        style={{ animation: "fadein .2s ease both" }}
        onClick={onClose}
      />
      <div className="panel animate-rise relative w-full" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={17} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- empty state ---------- */

export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-dim">
        {icon ?? <IconInbox size={22} />}
      </div>
      <p className="text-sm font-semibold text-fog">{title}</p>
      {hint && <p className="max-w-xs text-xs leading-relaxed text-dim">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ---------- toast host ---------- */

export function ToastHost() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toastin pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-2xl"
          style={{
            background: "rgba(15,20,32,0.94)",
            borderColor:
              t.kind === "ok"
                ? "rgba(62,207,142,0.35)"
                : t.kind === "warn"
                ? "rgba(245,184,75,0.35)"
                : "rgba(242,112,91,0.35)",
          }}
        >
          <span
            className={cls(
              "flex h-5 w-5 items-center justify-center rounded-full",
              t.kind === "ok" && "bg-mint/15 text-mint",
              t.kind === "warn" && "bg-amber/15 text-amber",
              t.kind === "err" && "bg-coral/15 text-coral"
            )}
          >
            {t.kind === "ok" ? <IconCheck size={12} /> : <IconAlert size={12} />}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ---------- misc ---------- */

export function stagger(i: number): CSSProperties {
  return { animationDelay: `${i * 70}ms` };
}
