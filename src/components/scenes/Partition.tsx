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
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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
    setDeleteConfirm(null);
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
      <div className="mx-auto w-full max-w-xl border border-red-300 bg-red-50 p-6 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="text-4xl text-red-400">⚠</div>
        <h2 className="text-xl font-bold text-red-700">No Unallocated Space Found</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          The installer cannot find free space to partition. You must shrink your Windows partition in Disk Management before continuing.
        </p>
        <button
          onClick={() => { playClick(); onRebootWindows(); }}
          className="rounded-lg bg-red-600 hover:bg-red-700 px-6 py-3 text-sm font-semibold text-white transition-colors"
        >
          Reboot into Windows
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Manual partitioning</h2>
        <p className="text-sm text-gray-500 mt-1">
          Create or modify partitions for your Ubuntu installation.
        </p>
      </div>

      {/* Disk visual bar */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 mb-1">/dev/sda — {TOTAL_GB} GB</div>
        <div className="flex h-10 lg:h-12 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
          {partitions.map((p, i) => {
            const pct = (p.sizeGB / TOTAL_GB) * 100;
            const colors = {
              "FAT32": "bg-blue-200",
              "NTFS": "bg-blue-300",
              "ext4": "bg-emerald-300",
              "swap": "bg-amber-200",
              "xfs": "bg-purple-200",
              "btrfs": "bg-cyan-200",
              "f2fs": "bg-teal-200",
            };
            const bg = colors[p.fs as keyof typeof colors] || "bg-gray-200";
            return (
              <div
                key={i}
                className={`${bg} flex items-center justify-center text-[10px] font-medium text-gray-700 border-r border-white/50 overflow-hidden whitespace-nowrap`}
                style={{ width: `${pct}%` }}
                title={`${p.device} — ${p.fs} — ${p.sizeGB} GB — ${p.mount}`}
              >
                {pct > 5 && <span className="truncate px-1">{p.mount || p.fs}</span>}
              </div>
            );
          })}
          {freeGB > 0 && (
            <div
              className="flex items-center justify-center text-[10px] font-medium text-gray-400 border-r border-white/50 border-dashed"
              style={{ width: `${(freeGB / TOTAL_GB) * 100}%` }}
            >
              {freeGB > 10 && <span className="truncate px-1">Free ({freeGB} GB)</span>}
            </div>
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Used: {usedGB.toFixed(1)} GB</span>
          <span>Free: {freeGB.toFixed(1)} GB</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          disabled={!canAdd}
          onClick={() => { playClick(); setEditIdx(null); setForm({ sizeGB: Math.min(50, Math.floor(freeGB)), fs: "ext4", mount: "/" }); setShowDialog(true); }}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            canAdd
              ? "border-[#E95420]/30 bg-[#E95420]/5 text-[#E95420] hover:bg-[#E95420]/10"
              : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
          }`}
        >
          <span className="text-base leading-none">+</span> Add partition
        </button>
      </div>

      {/* Partition table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-2">Device</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Filesystem</th>
              <th className="px-4 py-2">Size</th>
              <th className="px-4 py-2">Mount Point</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {partitions.map((p, i) => (
              <tr key={i} className={`${p.mount === "/" ? "bg-emerald-50/50" : ""} hover:bg-gray-50/50 transition-colors`}>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{p.device}</td>
                <td className="px-4 py-2.5 text-gray-700">{p.type}</td>
                <td className="px-4 py-2.5">
                  {p.fs ? (
                    <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{p.fs}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-gray-600">{p.sizeGB} GB</td>
                <td className="px-4 py-2.5">
                  {p.mount ? (
                    <span className={`font-mono text-xs ${p.mount === "/" ? "text-emerald-600 font-semibold" : "text-gray-600"}`}>
                      {p.mount}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleEdit(i)}
                      className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                      Edit
                    </button>
                    {deleteConfirm === i ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(i)}
                          className="rounded px-2 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 transition-colors font-medium"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(i)}
                        className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {freeGB > 0 && (
              <tr className="bg-gray-50/50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">—</td>
                <td className="px-4 py-2.5 text-gray-400 italic text-xs">Free Space</td>
                <td className="px-4 py-2.5 text-gray-300">—</td>
                <td className="px-4 py-2.5 text-gray-400">{freeGB.toFixed(1)} GB</td>
                <td className="px-4 py-2.5 text-gray-300">—</td>
                <td className="px-4 py-2.5" />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        {[
          { fs: "FAT32", color: "bg-blue-200" },
          { fs: "NTFS", color: "bg-blue-300" },
          { fs: "ext4", color: "bg-emerald-300" },
          { fs: "swap", color: "bg-amber-200" },
        ].map((l) => (
          <div key={l.fs} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded ${l.color}`} />
            <span>{l.fs}</span>
          </div>
        ))}
      </div>

      {/* Create / Edit Dialog */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {editIdx !== null ? "Edit partition" : "Create partition"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Size (GB)</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.floor(freeGB + (editIdx !== null ? partitions[editIdx].sizeGB : 0))}
                    value={form.sizeGB}
                    onChange={(e) => setForm((p) => ({ ...p, sizeGB: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420]/30"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Max: {Math.floor(freeGB + (editIdx !== null ? partitions[editIdx].sizeGB : 0))} GB available
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Filesystem</label>
                  <select
                    value={form.fs}
                    onChange={(e) => setForm((p) => ({ ...p, fs: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420]/30 bg-white"
                  >
                    {FILESYSTEMS.map((fs) => (
                      <option key={fs} value={fs}>{fs}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mount point</label>
                  <select
                    value={form.mount}
                    onChange={(e) => setForm((p) => ({ ...p, mount: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420]/30 bg-white"
                  >
                    {MOUNT_POINTS.map((mp) => (
                      <option key={mp} value={mp}>{mp}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => { playClick(); setShowDialog(false); setEditIdx(null); }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={form.sizeGB < 1}
                  className="rounded-lg bg-[#E95420] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c7441a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editIdx !== null ? "Save" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm button */}
      <div className="flex flex-col items-center gap-2 pt-2">
        {!canConfirm && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            You must have an ext4 partition mounted at / to continue
          </div>
        )}
        <button
          disabled={!canConfirm}
          onClick={() => onComplete()}
          className="rounded-lg bg-[#E95420] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c7441a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Install now →
        </button>
      </div>
    </div>
  );
}
