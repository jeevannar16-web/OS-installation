import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";
import type { OSConfig } from "../../data/types";

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

function getPartitionImg(osId: string): string {
  if (osId === "mint") return "/images/mint/22-mint-partition.webp";
  if (osId === "zorin") return "/images/zorin/11-installer.png";
  if (osId === "arch") return "/images/arch/08-disk-partitioning.png";
  if (osId === "windows") return "/images/win11-setup/07-partition-select.webp";
  return "/images/ubuntu/16-manual-partition.webp";
}

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
  const partImg = getPartitionImg(config.id);

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

  if (!diskShrunk) {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
          <img src={partImg} alt="Partition" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center space-y-4 bg-black/60 backdrop-blur-sm rounded-2xl p-8 border border-red-500/20">
              <div className="text-3xl">⚠️</div>
              <h2 className="text-lg font-bold text-red-400">No Unallocated Space</h2>
              <p className="text-xs text-white/50 max-w-sm mx-auto">Shrink your Windows partition first.</p>
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

  const hotspots = [
    { id: "add", x: 8, y: 8, w: 20, h: 10, onClick: () => { playClick(); setEditIdx(null); setForm({ sizeGB: Math.min(50, Math.floor(freeGB || 50)), fs: "ext4", mount: "/" }); setShowDialog(true); } },
    { id: "confirm", x: 72, y: 88, w: 18, h: 8, onClick: () => { if (canConfirm) { playClick(); onComplete(); } } },
    { id: "back", x: 8, y: 88, w: 14, h: 8, onClick: () => { playClick(); onRebootWindows(); } },
    { id: "edit-first", x: 8, y: 28, w: 60, h: 6, onClick: () => { const p = partitions[0]; playClick(); setForm({ sizeGB: p.sizeGB, fs: p.fs || "ext4", mount: p.mount || "/" }); setEditIdx(0); setShowDialog(true); } },
    { id: "edit-second", x: 8, y: 36, w: 60, h: 6, onClick: () => { const p = partitions[1] || partitions[0]; playClick(); setForm({ sizeGB: p.sizeGB, fs: p.fs || "ext4", mount: p.mount || "/" }); setEditIdx(partitions.length > 1 ? 1 : 0); setShowDialog(true); } },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <img src={partImg} alt="Manual partitioning"
          className="absolute inset-0 w-full h-full object-cover" />
        {hotspots.map(h => (
          <div key={h.id} onClick={h.onClick}
            className="absolute z-10"
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%`, cursor: "pointer" }} />
        ))}

        <AnimatePresence>
          {showDialog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center p-4">
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

        {/* Subtle disk used bar at bottom */}
        <div className="absolute bottom-0 inset-x-0 z-10 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            {partitions.map((p, i) => {
              const pct = (p.sizeGB / TOTAL_GB) * 100;
              const colors: Record<string, string> = {
                FAT32: "bg-blue-300", NTFS: "bg-blue-400", ext4: "bg-emerald-400",
                swap: "bg-amber-300", xfs: "bg-purple-300", btrfs: "bg-cyan-300",
              };
              return <div key={i} className={`${colors[p.fs] || "bg-white/20"}`} style={{ width: `${pct}%` }} />;
            })}
            {freeGB > 0 && <div className="bg-white/5" style={{ width: `${(freeGB / TOTAL_GB) * 100}%` }} />}
          </div>
        </div>
      </div>
    </div>
  );
}
