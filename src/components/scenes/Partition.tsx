import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";
import type { OSConfig } from "../../data/types";

type PartitionEntry = {
  device: string; type: string; fs: string; sizeGB: number; mount: string; flags: string[];
};

const TOTAL_GB = 500;
const FILESYSTEMS = ["ext4", "xfs", "btrfs", "f2fs", "swap", "FAT32", "NTFS"];
const MOUNT_POINTS = ["/", "/boot", "/boot/efi", "/home", "/var", "/tmp", "[swap]", "none"];

const DEFAULT_PARTITIONS: PartitionEntry[] = [
  { device: "/dev/sda1", type: "EFI System", fs: "FAT32", sizeGB: 0.5, mount: "/boot/efi", flags: ["boot", "esp"] },
  { device: "/dev/sda2", type: "Microsoft reserved", fs: "", sizeGB: 0.1, mount: "", flags: [] },
  { device: "/dev/sda3", type: "Basic Data", fs: "NTFS", sizeGB: 450, mount: "/mnt/windows", flags: [] },
  { device: "/dev/sda4", type: "Linux swap", fs: "swap", sizeGB: 8, mount: "[swap]", flags: [] },
];

export default function Partition({
  config, onComplete, diskShrunk, onRebootWindows,
}: {
  config: OSConfig; onComplete: () => void; diskShrunk: boolean; onRebootWindows: () => void;
}) {
  const [partitions, setPartitions] = useState<PartitionEntry[]>(DEFAULT_PARTITIONS);
  const [showDialog, setShowDialog] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ sizeGB: 50, fs: "ext4", mount: "/" });
  const accent = config.branding.accent;

  const usedGB = partitions.reduce((sum, p) => sum + p.sizeGB, 0);
  const freeGB = Math.max(0, TOTAL_GB - usedGB);
  const canConfirm = partitions.some((p) => p.fs === "ext4" && p.mount === "/");

  const handleSubmit = useCallback(() => {
    playClick();
    const newPart: PartitionEntry = {
      device: `/dev/sda${partitions.length + 1}`,
      type: form.mount === "/" ? "Linux filesystem" : form.mount === "[swap]" ? "Linux swap" : "Linux filesystem",
      fs: form.fs, sizeGB: form.sizeGB, mount: form.mount,
      flags: form.mount === "/" ? ["root"] : form.mount === "/boot" ? ["boot"] : [],
    };
    if (editIdx !== null) {
      setPartitions((prev) => prev.map((p, i) => (i === editIdx ? newPart : p)));
    } else {
      setPartitions((prev) => [...prev, newPart]);
    }
    setShowDialog(false);
    setEditIdx(null);
    setForm({ sizeGB: 50, fs: "ext4", mount: "/" });
  }, [form, editIdx, partitions.length]);

  const diskBarPct = (gb: number) => (gb / TOTAL_GB) * 100;

  if (!diskShrunk) {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #000)` }}>
          <div className="text-center space-y-4">
            <div className="text-sm text-white/40 font-mono">Waiting for disk shrink to complete…</div>
            <button onClick={() => { playClick(); onRebootWindows(); }}
              className="text-xs text-white/50 hover:text-white/80 underline transition-colors">
              Reboot into Windows to shrink disk
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
      <div className="flex-1 flex flex-col rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "#0d0d14" }}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/90">Edit partition table — /dev/sda</h2>
          <div className="flex gap-2">
            <button onClick={() => { playClick(); setEditIdx(null); setForm({ sizeGB: Math.min(50, Math.floor(freeGB || 50)), fs: "ext4", mount: "/" }); setShowDialog(true); }}
              className="text-[10px] font-medium px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 hover:text-white transition-all">
              + New
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="h-8 rounded-lg overflow-hidden flex border border-white/10">
            {partitions.map((p, i) => (
              <div key={i} className="h-full flex items-center justify-center text-[8px] text-white/70 font-medium border-r border-black/20 last:border-r-0 cursor-pointer hover:brightness-110 transition-all"
                style={{ width: `${diskBarPct(p.sizeGB)}%`, background: partitionColor(p.type) }}
                title={`${p.device}: ${p.sizeGB} GB`}>
                {diskBarPct(p.sizeGB) > 8 && <span className="truncate px-1">{p.fs || "free"}</span>}
              </div>
            ))}
            {freeGB > 0 && (
              <div className="h-full flex items-center justify-center text-[8px] text-white/30 bg-white/5 flex-1">
                {freeGB.toFixed(0)} GB free
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-white/40 text-[8px] uppercase tracking-wider">
                  <th className="text-left px-2 py-1.5 font-medium">Device</th>
                  <th className="text-left px-2 py-1.5 font-medium">Type</th>
                  <th className="text-left px-2 py-1.5 font-medium">Filesystem</th>
                  <th className="text-right px-2 py-1.5 font-medium">Size</th>
                  <th className="text-left px-2 py-1.5 font-medium">Mount point</th>
                  <th className="text-left px-2 py-1.5 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {partitions.map((p, i) => (
                  <tr key={i}
                    onClick={() => { playClick(); setEditIdx(i); setForm({ sizeGB: p.sizeGB, fs: p.fs, mount: p.mount }); setShowDialog(true); }}
                    className="text-white/80 hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="px-2 py-2 font-mono text-white/90">{p.device}</td>
                    <td className="px-2 py-2 text-white/60">{p.type}</td>
                    <td className="px-2 py-2 text-white/60">{p.fs || "—"}</td>
                    <td className="px-2 py-2 text-right text-white/90">{p.sizeGB} GB</td>
                    <td className="px-2 py-2 font-mono text-white/80">{p.mount || "—"}</td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        {p.flags.map(f => (
                          <span key={f} className="text-[7px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 uppercase">{f}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[9px] text-white/30 text-right pt-1">
            Total: {usedGB.toFixed(1)} GB / {TOTAL_GB} GB used ({freeGB.toFixed(1)} GB free)
          </div>
        </div>

        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <button onClick={() => { playClick(); onRebootWindows(); }}
            className="text-[10px] text-white/40 hover:text-white/70 transition-colors">
            Back
          </button>
          <button onClick={() => { if (canConfirm) { playClick(); onComplete(); } }}
            disabled={!canConfirm}
            className="text-[10px] font-semibold px-5 py-1.5 rounded-lg text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
            style={{ background: accent }}>
            Install Now
          </button>
        </div>

        <AnimatePresence>
          {showDialog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center p-4"
              style={{ borderRadius: "inherit" }}>
              <div className="bg-[#12121a] border border-white/15 rounded-xl p-5 max-w-sm w-full shadow-2xl">
                <h3 className="text-sm font-bold text-white/90 mb-3">{editIdx !== null ? "Edit partition" : "Create partition"}</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-[10px] font-medium text-white/60 mb-1">Size (GB)</label>
                    <input type="number" min={1} max={Math.floor(freeGB + (editIdx !== null ? partitions[editIdx].sizeGB : 0))}
                      value={form.sizeGB} onChange={(e) => setForm((p) => ({ ...p, sizeGB: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-white/15 px-2 py-1.5 text-xs text-white/90 outline-none bg-[#1a1a24]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-white/60 mb-1">FS</label>
                    <select value={form.fs} onChange={(e) => setForm((p) => ({ ...p, fs: e.target.value }))}
                      className="w-full rounded-lg border border-white/15 px-2 py-1.5 text-xs text-white/90 outline-none bg-[#1a1a24]">
                      {FILESYSTEMS.map((fs) => <option key={fs} value={fs}>{fs}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-white/60 mb-1">Mount</label>
                    <select value={form.mount} onChange={(e) => setForm((p) => ({ ...p, mount: e.target.value }))}
                      className="w-full rounded-lg border border-white/15 px-2 py-1.5 text-xs text-white/90 outline-none bg-[#1a1a24]">
                      {MOUNT_POINTS.map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { playClick(); setShowDialog(false); }}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/[0.03]">Cancel</button>
                  <button onClick={handleSubmit} disabled={form.sizeGB < 1}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    style={{ background: accent }}>{editIdx !== null ? "Save" : "Create"}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function partitionColor(type: string): string {
  if (type === "EFI System") return "linear-gradient(135deg, #6366f1, #4f46e5)";
  if (type === "Microsoft reserved") return "linear-gradient(135deg, #f59e0b, #d97706)";
  if (type === "Basic Data") return "linear-gradient(135deg, #3b82f6, #2563eb)";
  if (type === "Linux swap") return "linear-gradient(135deg, #ef4444, #dc2626)";
  if (type === "Linux filesystem") return "linear-gradient(135deg, #22c55e, #16a34a)";
  return "linear-gradient(135deg, #6b7280, #4b5563)";
}
