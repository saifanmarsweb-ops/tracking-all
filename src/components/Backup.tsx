import { useRef, useState } from "react";
import { useStore } from "../state/store";
import { todayISO } from "../lib/utils";
import { Modal } from "./ui";
import { IconAlert, IconDownload, IconRefresh, IconUpload } from "./icons";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BackupControls({ compact = false }: { compact?: boolean }) {
  const { state, db, exportDb, importDbFile, replaceState, resetToSeed, toast } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const stamp = todayISO();

  const exportSQLite = () => {
    const bytes = exportDb();
    if (!bytes) {
      toast("Database isn't ready yet", "err");
      return;
    }
    download(new Blob([bytes as BlobPart], { type: "application/octet-stream" }), `lifeos-${stamp}.db`);
    toast("SQLite database downloaded — open it with any SQLite tool");
  };

  const exportJson = () => {
    download(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
      `lifeos-${stamp}.json`
    );
    toast("JSON backup downloaded");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const isDb = /\.db$|\.sqlite$|\.sqlite3$/i.test(f.name) || !/\.json$/i.test(f.name);
    try {
      if (isDb) {
        await importDbFile(f);
        toast("SQLite database imported — all data restored");
        return;
      }
      const parsed = JSON.parse(await f.text()) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tasks)) {
        throw new Error("not a lifeos backup");
      }
      replaceState(parsed);
      toast("JSON backup imported — data written into the database");
    } catch {
      toast("Couldn't read that file — is it a LifeOS backup?", "err");
    }
  };

  const chipCls = "chip hover:border-mint/40 hover:text-mint";
  const btnCls = "btn btn-ghost flex-1 px-2 py-1.5 text-[11px]";

  return (
    <>
      <div className={compact ? "flex items-center gap-2" : "mt-3 flex gap-1.5"}>
        <button className={compact ? chipCls : btnCls} onClick={exportSQLite} title="Download the real SQLite .db file">
          <IconDownload size={compact ? 11 : 13} />
          {compact ? ".db" : "Export .db"}
        </button>
        <button className={compact ? chipCls : btnCls} onClick={() => fileRef.current?.click()} title="Restore from a .db or .json backup">
          <IconUpload size={compact ? 11 : 13} />
          {compact ? "Restore" : "Restore"}
        </button>
        {!compact && (
          <>
            <button className={btnCls} onClick={exportJson} title="Download data as JSON">
              JSON
            </button>
            <button
              className="btn btn-ghost flex-1 px-2 py-1.5 text-[11px] hover:border-coral/40 hover:text-coral"
              onClick={() => setConfirmOpen(true)}
              title="Wipe everything and reload demo data"
            >
              <IconRefresh size={13} />
              Reset
            </button>
          </>
        )}
        <input ref={fileRef} type="file" accept=".db,.sqlite,.sqlite3,.json" className="hidden" onChange={onFile} />
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Reset all data?"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)}>
              Keep my data
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                resetToSeed();
                setConfirmOpen(false);
                toast("Database reset to the demo dataset", "warn");
              }}
            >
              <IconRefresh size={14} /> Yes, reset it
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-coral/25 bg-coral/[0.06] px-4 py-3.5">
          <IconAlert size={17} className="mt-0.5 flex-none text-coral" />
          <p className="text-sm leading-relaxed text-mist">
            This wipes <b className="text-fog">every table in your SQLite database</b> — tasks, transactions,
            tickets, passwords and notes — and reseeds it. Grab an <b className="text-fog">.db export</b> first
            if anything matters.
          </p>
          <p className="mt-2 font-mono text-[10.5px] text-dim">
            current file: {(db.bytes / 1024).toFixed(1)} KB
          </p>
        </div>
      </Modal>
    </>
  );
}
