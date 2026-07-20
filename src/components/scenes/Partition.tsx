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
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
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

  const diskBarPct = (gb: number) => Math.max(0.5, (gb / TOTAL_GB) * 100);

  if (!diskShrunk) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #000)` }}>
          <div className="text-center space-y-5">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto"
              style={{ borderColor: `${accent}40`, borderTopColor: accent }} />
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
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "#0d0d14" }}>
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="text-lg">💾</div>
            <div>
              <h2 className="text-sm font-semibold text-white/90">Edit partition table</h2>
              <p className="text-[10px] text-white/40 font-mono">/dev/sda — {TOTAL_GB} GB</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { playClick(); setEditIdx(null); setForm({ sizeGB: Math.min(50, Math.floor(freeGB || 50)), fs: "ext4", mount: "/" }); setShowDialog(true); }}
              className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: accent, color: "#fff" }}>
              + New Partition
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Disk visualization — GParted-style bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-white/40 mb-2">
              <span>/dev/sda</span>
              <span>{TOTAL_GB} GB</span>
            </div>
            <div className="h-10 rounded-xl overflow-hidden flex border border-white/10 shadow-inner bg-black/30">
              {partitions.map((p, i) => (
                <div key={i}
                  onClick={() => { playClick(); setSelectedRow(i); }}
                  className={`h-full flex items-center justify-center text-[9px] text-white font-medium border-r border-black/30 last:border-r-0 cursor-pointer hover:brightness-110 transition-all relative ${
                    selectedRow === i ? "ring-2 ring-inset ring-white/40 z-10" : ""
                  }`}
                  style={{ width: `${diskBarPct(p.sizeGB)}%` }}
                  title={`${p.device}: ${p.sizeGB} GB - ${p.type}`}>
                  {diskBarPct(p.sizeGB) > 6 && (
                    <span className="bg-gradient-to-b {partitionColor(p.type)} px-1 py-0.5 rounded truncate max-w-full text-center"
                      style={{ background: `linear-gradient(135deg, ${p.type.includes("EFI") ? "#818cf8" : p.type.includes("swap") ? "#f87171" : p.type.includes("Data") ? "#60a5fa" : "#4ade80"}, ${p.type.includes("EFI") ? "#6366f1" : p.type.includes("swap") ? "#ef4444" : p.type.includes("Data") ? "#3b82f6" : "#22c55e"})` }}>
                      {p.fs || "free"}
                    </span>
                  )}
                </div>
              ))}
              {freeGB > 0 && (
                <div className="h-full flex items-center justify-center text-[9px] text-white/30 bg-white/5 flex-1 cursor-default border-l border-dashed border-white/10">
                  {freeGB.toFixed(0)} GB free
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2 text-[9px] text-white/40">
              {partitions.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: `linear-gradient(135deg, ${p.type.includes("EFI") ? "#818cf8" : p.type.includes("swap") ? "#f87171" : p.type.includes("Data") ? "#60a5fa" : "#4ade80"}, ${p.type.includes("EFI") ? "#6366f1" : p.type.includes("swap") ? "#ef4444" : p.type.includes("Data") ? "#3b82f6" : "#22c55e"})` }} />
                  <span>{p.device.split("/").pop()} ({p.sizeGB} GB)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Partition table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-white/40 text-[9px] uppercase tracking-wider bg-white/5">
                  <th className="text-left px-3 py-2 font-semibold">Device</th>
                  <th className="text-left px-3 py-2 font-semibold">Type</th>
                  <th className="text-left px-3 py-2 font-semibold">Filesystem</th>
                  <th className="text-right px-3 py-2 font-semibold">Size</th>
                  <th className="text-left px-3 py-2 font-semibold">Mount point</th>
                  <th className="text-left px-3 py-2 font-semibold">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {partitions.map((p, i) => (
                  <tr key={i}
                    onClick={() => { playClick(); setSelectedRow(i); setEditIdx(i); setForm({ sizeGB: p.sizeGB, fs: p.fs || "ext4", mount: p.mount }); setShowDialog(true); }}
                    className={`text-white/80 hover:bg-white/5 cursor-pointer transition-colors ${
                      selectedRow === i ? "bg-white/8" : ""
                    }`}
                    style={selectedRow === i ? { background: `${accent}10` } : {}}>
                    <td className="px-3 py-2.5 font-mono text-white/90 font-medium">{p.device}</td>
                    <td className="px-3 py-2.5 text-white/50">{p.type}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                        p.fs === "swap" ? "text-red-300 bg-red-500/10" :
                        p.fs === "FAT32" ? "text-yellow-300 bg-yellow-500/10" :
                        p.fs === "NTFS" ? "text-blue-300 bg-blue-500/10" :
                        p.fs ? "text-green-300 bg-green-500/10" : "text-white/30 bg-white/10"
                      }`}>{p.fs || "—"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-white/90 font-mono font-medium">{p.sizeGB} GB</td>
                    <td className="px-3 py-2.5 font-mono text-white/70">{p.mount || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        {p.flags.map(f => (
                          <span key={f} className="text-[7px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50 uppercase font-semibold">{f}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <div className="text-white/40">
              <span className="text-white/60 font-medium">{usedGB.toFixed(1)} GB</span> used of {TOTAL_GB} GB
            </div>
            <div className="text-white/40">
              <span className="text-green-400 font-medium">{freeGB.toFixed(1)} GB</span> free
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
          <button onClick={() => { playClick(); onRebootWindows(); }}
            className="text-[10px] text-white/40 hover:text-white/70 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-white/5">
            ← Back
          </button>
          <button onClick={() => { if (canConfirm) { playClick(); onComplete(); } }}
            disabled={!canConfirm}
            className="text-[10px] font-bold px-6 py-2 rounded-lg text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
            style={{ background: accent }}>
            Install Now
          </button>
        </div>

        {/* Edit/Create dialog */}
        <AnimatePresence>
          {showDialog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
              style={{ borderRadius: "inherit" }}>
              <div className="bg-[#12121a] border border-white/15 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{editIdx !== null ? "✏️" : "➕"}</span>
                  <h3 className="text-sm font-bold text-white/90">{editIdx !== null ? "Edit partition" : "Create new partition"}</h3>
                </div>
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Size (GB)</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={1} max={Math.floor(freeGB + (editIdx !== null ? partitions[editIdx].sizeGB : 0))}
                        value={form.sizeGB} onChange={(e) => setForm(p => ({ ...p, sizeGB: Number(e.target.value) }))}
                        className="flex-1 accent-[#22c55e] h-1.5" />
                      <span className="text-sm font-mono font-bold text-white min-w-[50px] text-right">{form.sizeGB} GB</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase tracking-wider">Filesystem</label>
                      <select value={form.fs} onChange={(e) => setForm(p => ({ ...p, fs: e.target.value }))}
                        className="w-full rounded-lg border border-white/15 px-3 py-2 text-xs text-white/90 outline-none bg-[#1a1a24] cursor-pointer">
                        {FILESYSTEMS.map((fs) => <option key={fs} value={fs}>{fs}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase tracking-wider">Mount point</label>
                      <select value={form.mount} onChange={(e) => setForm(p => ({ ...p, mount: e.target.value }))}
                        className="w-full rounded-lg border border-white/15 px-3 py-2 text-xs text-white/90 outline-none bg-[#1a1a24] cursor-pointer">
                        {MOUNT_POINTS.map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { playClick(); setShowDialog(false); }}
                    className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.03] transition-all">Cancel</button>
                  <button onClick={handleSubmit} disabled={form.sizeGB < 1}
                    className="rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
                    style={{ background: accent }}>{editIdx !== null ? "Save Changes" : "Create"}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
