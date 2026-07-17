import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";

type PartitionEntry = {
  device: string;
  type: string;
  fs: string;
  sizeGB: number;
  mount: string;
  flags: string[];
};

const TOTAL_GB = 500;
const FILESYSTEMS = ["ext4", "xfs", "btrfs", "f2fs", "swap", "FAT32", "NTFS"];
const MOUNT_POINTS = ["/", "/boot", "/boot/efi", "/home", "/var", "/tmp", "[swap]", "none"];

const PARTITION_IMG: Record<string, string> = {
  manual: "/images/ubuntu/16-manual-partition.webp",
  boot: "/images/ubuntu/17-boot-partition.png",
  root: "/images/ubuntu/18-root-partition.webp",
  home: "/images/ubuntu/19-home-partition.webp",
  swap: "/images/ubuntu/20-swap-partition.webp",
};

const DEFAULT_PARTITIONS: PartitionEntry[] = [
  { device: "/dev/sda1", type: "EFI System", fs: "FAT32", sizeGB: 0.5, mount: "/boot/efi", flags: ["boot", "esp"] },
  { device: "/dev/sda2", type: "Microsoft reserved", fs: "", sizeGB: 0.1, mount: "", flags: [] },
  { device: "/dev/sda3", type: "Basic Data", fs: "NTFS", sizeGB: 450, mount: "/mnt/windows", flags: [] },
  { device: "/dev/sda4", type: "Linux swap", fs: "swap", sizeGB: 8, mount: "[swap]", flags: [] },
];

export default function Partition({
  onComplete,
  diskShrunk,
  onRebootWindows,
}: {
  onComplete: () => void;
  diskShrunk: boolean;
  onRebootWindows: () => void;
}) {
  const [partitions, setPartitions] = useState<PartitionEntry[]>(DEFAULT_PARTITIONS);
  const [showDialog, setShowDialog] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ sizeGB: 50, fs: "ext4", mount: "/" });

  const usedGB = partitions.reduce((sum, p) => sum + p.sizeGB, 0);
  const freeGB = Math.max(0, TOTAL_GB - usedGB);

  const canAdd = freeGB >= 1;
  const canConfirm = partitions.some((p) => p.fs === "ext4" && p.mount === "/");

  const handleSubmit = useCallback(() => {
    playClick();
    const newPart: PartitionEntry = {
      device: `/dev/sda${partitions.length + 1}`,
      type: form.mount === "/" ? "Linux filesystem" : form.mount === "[swap]" ? "Linux swap" : "Linux filesystem",
      fs: form.fs,
      sizeGB: form.sizeGB,
      mount: form.mount,
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

  const handleDelete = useCallback((idx: number) => {
    playClick();
    setPartitions((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleEdit = useCallback((idx: number) => {
    playClick();
    const p = partitions[idx];
    setForm({ sizeGB: p.sizeGB, fs: p.fs || "ext4", mount: p.mount || "/" });
    setEditIdx(idx);
    setShowDialog(true);
  }, [partitions]);

  if (!diskShrunk) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
          <img src={PARTITION_IMG.manual} alt="Manual partitioning" className="w-full h-auto" />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center space-y-4 bg-black/60 backdrop-blur-sm rounded-2xl p-8 border border-red-500/20">
              <div className="text-3xl">⚠️</div>
              <h2 className="text-lg font-bold text-red-400">No Unallocated Space Found</h2>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                Shrink your Windows partition in Disk Management before continuing.
              </p>
              <button onClick={() => { playClick(); onRebootWindows(); }}
                className="rounded-lg bg-red-600 hover:bg-red-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors">
                Reboot into Windows
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-[#1a1a24]">

        {/* Full background screenshot */}
        <img src={PARTITION_IMG.manual} alt="Manual partitioning"
          className="absolute inset-0 w-full h-full object-contain" />

        {/* Interactive overlay — partition table + controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/50 to-transparent">
          <div className="absolute inset-x-0 bottom-0 pt-20 pb-4 px-4 overflow-y-auto max-h-full">

            {/* Disk visual bar */}
            <div className="max-w-3xl mx-auto space-y-2 mb-3">
              <div className="text-[10px] font-medium text-white/50">/dev/sda — {TOTAL_GB} GB</div>
              <div className="flex h-8 w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]">
                {partitions.map((p, i) => {
                  const pct = (p.sizeGB / TOTAL_GB) * 100;
                  const colors: Record<string, string> = {
                    FAT32: "bg-blue-200", NTFS: "bg-blue-300", ext4: "bg-emerald-300",
                    swap: "bg-amber-200", xfs: "bg-purple-200", btrfs: "bg-cyan-200", f2fs: "bg-teal-200",
                  };
                  return (
                    <div key={i} className={`${colors[p.fs] || "bg-white/10"} flex items-center justify-center text-[9px] font-medium text-white/80 border-r border-white/50 overflow-hidden`}
                      style={{ width: `${pct}%` }} title={`${p.device} — ${p.fs} — ${p.sizeGB} GB — ${p.mount}`}>
                      {pct > 5 && <span className="truncate px-1">{p.mount || p.fs}</span>}
                    </div>
                  );
                })}
                {freeGB > 0 && (
                  <div className="flex items-center justify-center text-[9px] font-medium text-white/40 border-r border-white/50 border-dashed"
                    style={{ width: `${(freeGB / TOTAL_GB) * 100}%` }}>
                    {freeGB > 10 && <span className="truncate px-1">Free ({freeGB} GB)</span>}
                  </div>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-white/40">
                <span>Used: {usedGB.toFixed(1)} GB</span>
                <span>Free: {freeGB.toFixed(1)} GB</span>
              </div>
            </div>

            {/* Add partition button */}
            <div className="max-w-3xl mx-auto mb-2">
              <button disabled={!canAdd} onClick={() => { playClick(); setEditIdx(null); setForm({ sizeGB: Math.min(50, Math.floor(freeGB)), fs: "ext4", mount: "/" }); setShowDialog(true); }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  canAdd ? "border-[#E95420]/30 bg-[#E95420]/5 text-[#E95420] hover:bg-[#E95420]/10" : "border-white/10 bg-white/[0.03] text-white/30 cursor-not-allowed"
                }`}>
                + Add partition
              </button>
            </div>

            {/* Partition table */}
            <div className="max-w-3xl mx-auto rounded-xl border border-white/10 overflow-hidden bg-[#12121a]/80 backdrop-blur-sm">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/10 text-left text-[10px] font-medium text-white/50 uppercase tracking-wider">
                    <th className="px-3 py-1.5">Device</th>
                    <th className="px-3 py-1.5">Type</th>
                    <th className="px-3 py-1.5">Filesystem</th>
                    <th className="px-3 py-1.5">Size</th>
                    <th className="px-3 py-1.5">Mount Point</th>
                    <th className="px-3 py-1.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {partitions.map((p, i) => (
                    <tr key={i} className={`${p.mount === "/" ? "bg-emerald-500/5" : ""} hover:bg-white/[0.05] transition-colors`}>
                      <td className="px-3 py-1.5 font-mono text-[10px] text-white/60">{p.device}</td>
                      <td className="px-3 py-1.5 text-white/80">{p.type}</td>
                      <td className="px-3 py-1.5">
                        {p.fs ? <span className="inline-block rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-white/60">{p.fs}</span> : <span className="text-white/30">—</span>}
                      </td>
                      <td className="px-3 py-1.5 text-white/60">{p.sizeGB} GB</td>
                      <td className="px-3 py-1.5">
                        {p.mount ? <span className={`font-mono text-[10px] ${p.mount === "/" ? "text-emerald-400 font-semibold" : "text-white/60"}`}>{p.mount}</span> : <span className="text-white/30">—</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(i)} className="rounded px-1.5 py-0.5 text-[10px] text-white/50 hover:bg-white/[0.06] hover:text-white/80 transition-colors">Edit</button>
                          <button onClick={() => handleDelete(i)} className="rounded px-1.5 py-0.5 text-[10px] text-white/40 hover:bg-red-500/5 hover:text-red-500 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {freeGB > 0 && (
                    <tr className="bg-white/[0.03]">
                      <td className="px-3 py-1.5 font-mono text-[10px] text-white/40">—</td>
                      <td className="px-3 py-1.5 text-white/40 italic text-[10px]">Free Space</td>
                      <td className="px-3 py-1.5 text-white/30">—</td>
                      <td className="px-3 py-1.5 text-white/40">{freeGB.toFixed(1)} GB</td>
                      <td className="px-3 py-1.5 text-white/30">—</td>
                      <td className="px-3 py-1.5" />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend + confirm */}
            <div className="max-w-3xl mx-auto mt-2 space-y-2">
              <div className="flex flex-wrap gap-3 text-[10px] text-white/40">
                {[{ fs: "FAT32", color: "bg-blue-200" }, { fs: "NTFS", color: "bg-blue-300" }, { fs: "ext4", color: "bg-emerald-300" }, { fs: "swap", color: "bg-amber-200" }].map((l) => (
                  <div key={l.fs} className="flex items-center gap-1"><div className={`h-2.5 w-2.5 rounded ${l.color}`} /><span>{l.fs}</span></div>
                ))}
              </div>
              {!canConfirm && (
                <div className="text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-1 text-center">
                  You must have an ext4 partition mounted at / to continue
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between border-t border-white/10 bg-[#1a1a24] px-4 py-2 rounded-b-2xl shrink-0">
        <button onClick={() => { playClick(); onRebootWindows(); }}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium text-white/60 hover:bg-white/10 transition-colors">
          ← Back
        </button>
        <button disabled={!canConfirm} onClick={() => { playClick(); onComplete(); }}
          className={`rounded-lg px-5 py-2 text-[11px] font-semibold transition-colors ${
            canConfirm ? "bg-[#E95420] text-white hover:bg-[#c7441a]" : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}>Install now →</button>
      </div>

      {/* Create / Edit Dialog */}
      <AnimatePresence>
        {showDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDialog(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-white/10 bg-[#12121a] p-5 shadow-2xl">

              {/* Show relevant partition screenshot as header */}
              <div className="rounded-lg overflow-hidden mb-4 border border-white/10">
                <img src={PARTITION_IMG[form.mount === "/boot" ? "boot" : form.mount === "/home" ? "home" : form.mount === "[swap]" ? "swap" : "root"]}
                  alt="Partition type" className="w-full h-28 object-cover" />
              </div>

              <h3 className="text-sm font-bold text-white/90 mb-3">{editIdx !== null ? "Edit partition" : "Create partition"}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-white/60 mb-1">Size (GB)</label>
                  <input type="number" min={1} max={Math.floor(freeGB + (editIdx !== null ? partitions[editIdx].sizeGB : 0))}
                    value={form.sizeGB} onChange={(e) => setForm((p) => ({ ...p, sizeGB: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/90 outline-none focus:border-[#E95420] bg-[#1a1a24]" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-white/60 mb-1">Filesystem</label>
                  <select value={form.fs} onChange={(e) => setForm((p) => ({ ...p, fs: e.target.value }))}
                    className="w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/90 outline-none focus:border-[#E95420] bg-[#1a1a24]">
                    {FILESYSTEMS.map((fs) => <option key={fs} value={fs}>{fs}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-white/60 mb-1">Mount point</label>
                  <select value={form.mount} onChange={(e) => setForm((p) => ({ ...p, mount: e.target.value }))}
                    className="w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/90 outline-none focus:border-[#E95420] bg-[#1a1a24]">
                    {MOUNT_POINTS.map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { playClick(); setShowDialog(false); setEditIdx(null); }}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/[0.03] transition-colors">Cancel</button>
                <button onClick={handleSubmit} disabled={form.sizeGB < 1}
                  className="rounded-lg bg-[#E95420] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#c7441a] transition-colors disabled:opacity-40">
                  {editIdx !== null ? "Save" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
