import { MONOGRAM_COLORS } from "./types";

export function cls(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function uid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDaysISO(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function daysAgoISO(n: number): string {
  return addDaysISO(todayISO(), -n);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function fmtMoney(n: number): string {
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtMoney0(n: number): string {
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function fmtDate(iso: string): string {
  return fromISO(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtDateFull(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function monthTitle(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function dueLabel(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === addDaysISO(today, 1)) return "Tomorrow";
  if (iso === addDaysISO(today, -1)) return "Yesterday";
  return fmtDate(iso);
}

export function greeting(hour: number): string {
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function monogramColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return MONOGRAM_COLORS[h % MONOGRAM_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ---------------- passwords ---------------- */

export interface GenOptions {
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
}

const SETS = {
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lower: "abcdefghijkmnopqrstuvwxyz",
  digits: "23456789",
  symbols: "!@#$%^&*_-+=?~",
};

export function genPassword(len: number, o: GenOptions): string {
  const pools: string[] = [];
  if (o.upper) pools.push(SETS.upper);
  if (o.lower) pools.push(SETS.lower);
  if (o.digits) pools.push(SETS.digits);
  if (o.symbols) pools.push(SETS.symbols);
  if (pools.length === 0) pools.push(SETS.lower);
  const all = pools.join("");
  const chars: string[] = [];
  // guarantee one from each chosen class
  for (const p of pools) chars.push(p[Math.floor(Math.random() * p.length)]);
  while (chars.length < len) chars.push(all[Math.floor(Math.random() * all.length)]);
  // fisher–yates
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, len).join("");
}

export function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "Empty", color: "#5f6c87" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 14) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.min(4, s);
  const labels = ["Weak", "Fair", "Good", "Strong", "Elite"];
  const colors = ["#f2705b", "#f5a94b", "#ead163", "#3ecf8e", "#5bc8f5"];
  return { score, label: labels[score], color: colors[score] };
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}
