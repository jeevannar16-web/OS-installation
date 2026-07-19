import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";
import SceneShell from "../shared/SceneShell";
import type { OSConfig } from "../../data/types";

type PartitionEntry = {
  device: string; type: string; fs: string; sizeGB: number; mount: string; flags: string[];
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
          <SceneShell src={partImg} alt="Partition" zones={[
            { id: "back", x: 0, y: 0, w: 100, h: 100, onClick: () => { playClick(); onRebootWindows(); } },
          ]} />
        </div>
      </div>
    );
  }

  const zones = [
    { id: "add", x: 5, y: 5, w: 25, h: 15, onClick: () => { playClick(); setEditIdx(null); setForm({ sizeGB: Math.min(50, Math.floor(freeGB || 50)), fs: "ext4", mount: "/" }); setShowDialog(true); } },
    { id: "confirm", x: 65, y: 80, w: 28, h: 15, onClick: () => { if (canConfirm) { playClick(); onComplete(); } } },
    { id: "back", x: 5, y: 80, w: 25, h: 15, onClick: () => { playClick(); onRebootWindows(); } },
    { id: "interact", x: 5, y: 22, w: 70, h: 50, onClick: () => { playClick(); if (partitions.length > 0) { const p = partitions[0]; setForm({ sizeGB: p.sizeGB, fs: p.fs || "ext4", mount: p.mount || "/" }); setEditIdx(0); setShowDialog(true); } } },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <SceneShell src={partImg} alt="Manual partitioning" zones={zones} />

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
      </div>
    </div>
  );
}
