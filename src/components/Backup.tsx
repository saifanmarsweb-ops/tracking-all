import { useRef, useState } from "react";
import { useStore } from "../state/store";
import { todayISO } from "../lib/utils";
import { Modal } from "./ui";
import { IconAlert, IconDownload, IconRefresh, IconUpload } from "./icons";

export function BackupControls({ compact = false }: { compact?: boolean }) {
  const { state, replaceState, resetToSeed, toast } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeos-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Backup downloaded — keep it somewhere safe");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text()) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tasks)) {
        toast("That file doesn't look like a LifeOS backup", "err");
        return;
      }
      replaceState(parsed);
      toast("Backup restored — all data imported");
    } catch {
      toast("Couldn't read that file", "err");
    }
  };

  const btnCls = compact
    ? "chip hover:border-mint/40 hover:text-mint"
    : "btn btn-ghost flex-1 px-2 py-1.5 text-[11px]";

  return (
    <>
      <div className={compact ? "flex items-center gap-2" : "mt-3 flex gap-1.5"}>
        <button className={btnCls} onClick={exportJson} title="Download all data as JSON">
          <IconDownload size={compact ? 11 : 13} />
          {compact ? "Export" : "Backup"}
        </button>
        <button
          className={btnCls}
          onClick={() => fileRef.current?.click()}
          title="Restore from a LifeOS JSON backup"
        >
          <IconUpload size={compact ? 11 : 13} />
          {compact ? "Import" : "Restore"}
        </button>
        {!compact && (
          <button
            className="btn btn-ghost flex-1 px-2 py-1.5 text-[11px] hover:border-coral/40 hover:text-coral"
            onClick={() => setConfirmOpen(true)}
            title="Wipe everything and reload demo data"
          >
            <IconRefresh size={13} />
            Reset
          </button>
        )}
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
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
                toast("Everything reset to the demo dataset", "warn");
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
            This wipes <b className="text-fog">every task, transaction, ticket, password and note</b> in this
            browser and reloads the demo dataset. Export a backup first if anything here matters to you.
          </p>
        </div>
      </Modal>
    </>
  );
}
