import { useState } from "react";
import { motion } from "framer-motion";

type BiosTab = "Main" | "Advanced" | "Boot" | "Exit";

export default function BiosSetup({
  onComplete,
  secureBoot,
  setSecureBoot,
  osId,
}: {
  onComplete: () => void;
  secureBoot: boolean;
  setSecureBoot: (v: boolean) => void;
  osId?: string;
}) {
  const [tab, setTab] = useState<BiosTab>("Main");
  const [bootMode, setBootMode] = useState<"UEFI" | "Legacy">("UEFI");
  const [usbBoot, setUsbBoot] = useState(true);
  const [bootOrder, setBootOrder] = useState([
    { id: "hdd", label: osId === "windows" ? "Windows Boot Manager" : `UEFI: ${osId === "arch" ? "Arch Linux" : osId === "zorin" ? "Zorin OS" : osId === "mint" ? "Linux Mint" : "Ubuntu"} (nvme0n1p1)`, enabled: true },
    { id: "usb", label: "UEFI: SanDisk Ultra Flair 16GB", enabled: true },
    { id: "net", label: "Network Boot: Realtek PXE", enabled: false },
  ]);
  const [selectedBootIdx, setSelectedBootIdx] = useState(0);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const tabs: BiosTab[] = ["Main", "Advanced", "Boot", "Exit"];

  function moveBootItem(dir: -1 | 1) {
    const newIdx = selectedBootIdx + dir;
    if (newIdx < 0 || newIdx >= bootOrder.length) return;
    const copy = [...bootOrder];
    [copy[selectedBootIdx], copy[newIdx]] = [copy[newIdx], copy[selectedBootIdx]];
    setBootOrder(copy);
    setSelectedBootIdx(newIdx);
  }

  function handleSave() {
    setShowSaveConfirm(true);
    setTimeout(() => {
      setShowSaveConfirm(false);
      onComplete();
    }, 1500);
  }

  return (
    <div className="mx-auto w-full max-w-5xl relative" tabIndex={0} onKeyDown={(e) => {
      if (e.key === "F10") handleSave();
    }}>
      {/* BIOS Window */}
      <div className="rounded-xl overflow-hidden ring-2 ring-white/20 shadow-[0_0_60px_-15px_rgba(0,51,153,0.5)] font-mono text-sm">
        {/* Title bar */}
        <div className="bg-[#003399] px-6 py-3 text-white font-bold text-center tracking-wider text-base">
          BIOS Setup Utility — Aptio Setup Utility (AMIBIOS)
        </div>

        {/* Tab bar */}
        <div className="flex bg-[#003399] border-t border-[#0044cc]">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 text-sm font-bold tracking-wide transition-colors ${
                tab === t
                  ? "bg-[#cccccc] text-[#003399]"
                  : "text-[#cccccc] hover:bg-[#0044cc]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-[#cccccc] text-[#000000] min-h-[420px] p-6">
          {/* ── Main Tab ── */}
          {tab === "Main" && (
            <div className="space-y-1">
              <div className="text-[#003399] font-bold mb-3 border-b border-[#999999] pb-1">
                System Information
              </div>
              <Row label="BIOS Vendor" value="American Megatrends Inc." />
              <Row label="BIOS Version" value="2.40.1287" />
              <Row label="Build Date" value="03/15/2024" />
              <Row label="System Manufacturer" value="OS-Sim Virtual Machine" />
              <Row label="Product Name" value="SimBoard Pro" />
              <Row label="Serial Number" value="SIM-2024-00168" />
              <div className="mt-4 border-t border-[#999] pt-2">
                <Row label="Processor Type" value="Intel Core i7-14700K" />
                <Row label="Processor Speed" value="3400 MHz" />
                <Row label="Total Memory" value="32768 MB" />
              </div>
            </div>
          )}

          {/* ── Advanced Tab ── */}
          {tab === "Advanced" && (
            <div className="space-y-1">
              <div className="text-[#003399] font-bold mb-3 border-b border-[#999999] pb-1">
                Advanced Settings
              </div>
              <ToggleRow
                label="Secure Boot"
                value={secureBoot}
                onChange={setSecureBoot}
                hint="Verifies boot loader signature"
              />
              <ToggleRow
                label="Intel VT-x (Virtualization)"
                value={true}
                onChange={() => {}}
                hint="Required for virtual machines"
                locked
              />
              <ToggleRow
                label="Boot Mode"
                value={bootMode === "UEFI"}
                onChange={(v) => setBootMode(v ? "UEFI" : "Legacy")}
                hint={bootMode === "UEFI" ? "UEFI Mode (recommended)" : "Legacy BIOS Mode"}
              />
              <Row label="SATA Mode" value="AHCI" hint="Advanced Host Controller Interface" />
              <Row label="Hyper-Threading" value="Enabled" />
              <Row label="Execute Disable Bit" value="Enabled" />
            </div>
          )}

          {/* ── Boot Tab ── */}
          {tab === "Boot" && (
            <div className="space-y-3">
              <div className="text-[#003399] font-bold mb-3 border-b border-[#999999] pb-1">
                Boot Configuration
              </div>
              <ToggleRow
                label="USB Boot"
                value={usbBoot}
                onChange={setUsbBoot}
                hint="Allow booting from USB devices"
              />
              <ToggleRow
                label="Network Boot (PXE)"
                value={false}
                onChange={() => {}}
                hint="Boot from network"
              />

              <div className="mt-4 text-[#003399] font-bold border-b border-[#999999] pb-1">
                Boot Option Priorities
              </div>
              <div className="bg-white border border-[#999] rounded">
                {bootOrder.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedBootIdx(i)}
                    className={`flex items-center gap-3 px-3 py-1.5 text-xs cursor-pointer ${
                      selectedBootIdx === i
                        ? "bg-[#003399] text-white"
                        : item.enabled
                          ? "text-black hover:bg-[#ddd]"
                          : "text-[#999]"
                    } ${i < bootOrder.length - 1 ? "border-b border-[#ccc]" : ""}`}
                  >
                    <span className="w-6 text-right font-bold">
                      {i + 1}.
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {!item.enabled && <span className="text-[#999]">[Disabled]</span>}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-[#666] mt-1">
                Click to select • Use buttons to change order
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => moveBootItem(-1)}
                  disabled={selectedBootIdx === 0}
                  className="px-3 py-1 text-xs bg-[#003399] text-white rounded hover:bg-[#0044cc] disabled:bg-[#999] disabled:cursor-not-allowed"
                >
                  ↑ Up
                </button>
                <button
                  onClick={() => moveBootItem(1)}
                  disabled={selectedBootIdx === bootOrder.length - 1}
                  className="px-3 py-1 text-xs bg-[#003399] text-white rounded hover:bg-[#0044cc] disabled:bg-[#999] disabled:cursor-not-allowed"
                >
                  ↓ Down
                </button>
              </div>

              {usbBoot && (
                <div className="mt-2 text-[10px] text-[#006600] bg-[#eeffee] border border-[#00aa00] rounded px-2 py-1">
                  ✓ USB Boot enabled — USB devices will appear in boot menu
                </div>
              )}
              {!usbBoot && (
                <div className="mt-2 text-[10px] text-[#cc0000] bg-[#ffeeee] border border-[#cc0000] rounded px-2 py-1">
                  ✗ USB Boot disabled — USB devices cannot be used to boot
                </div>
              )}
            </div>
          )}

          {/* ── Exit Tab ── */}
          {tab === "Exit" && (
            <div className="space-y-2">
              <div className="text-[#003399] font-bold mb-3 border-b border-[#999999] pb-1">
                Exit Options
              </div>
<ExitOption label="Save Changes and Exit" shortcut="F10" onClick={handleSave} primary />
<ExitOption label="Discard Changes and Exit" onClick={onComplete} />
              <ExitOption label="Save Changes" />
              <ExitOption label="Discard Changes" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#003399] text-[#cccccc] text-[10px] px-4 py-1.5 flex justify-between">
          <span>← →: Select Tab &nbsp; ↑ ↓: Select Item &nbsp; Enter: Change</span>
          <span className="text-white font-bold">F10: Save & Exit</span>
        </div>
      </div>

      {/* Save confirmation overlay */}
      {showSaveConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 z-10"
        >
          <div className="bg-[#cccccc] text-[#000] rounded border-2 border-[#003399] p-4 text-center shadow-xl">
            <div className="font-bold text-[#003399] mb-2">Save configuration and reset?</div>
            <div className="text-xs text-[#333]">Saving BIOS settings...</div>
            <div className="mt-3 h-1.5 bg-[#999] rounded overflow-hidden">
              <motion.div
                className="h-full bg-[#003399]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2 }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Key hints */}
      <div className="mt-3 text-center text-xs text-white/30">
        Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">F10</kbd> to save and continue, or click Exit tab
      </div>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center gap-4 py-1 text-xs">
      <span className="w-48 text-[#333]">{label}</span>
      <span className="font-bold">{value}</span>
      {hint && <span className="text-[10px] text-[#666] ml-auto">{hint}</span>}
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  hint,
  locked,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-1.5 text-xs">
      <span className="w-48 text-[#333]">{label}</span>
      <button
        onClick={() => !locked && onChange(!value)}
        disabled={locked}
        className={`w-12 h-5 rounded-full transition-colors relative ${
          value ? "bg-[#006600]" : "bg-[#999]"
        } ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            value ? "left-7" : "left-0.5"
          }`}
        />
      </button>
      <span className="text-[10px]">{value ? "Enabled" : "Disabled"}</span>
      {hint && <span className="text-[10px] text-[#666] ml-auto">{hint}</span>}
    </div>
  );
}

function ExitOption({
  label,
  shortcut,
  onClick,
  primary,
}: {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
        primary
          ? "bg-[#003399] text-white font-bold hover:bg-[#0044cc]"
          : "hover:bg-[#bbb] text-[#333]"
      }`}
    >
      {label}
      {shortcut && <span className="ml-2 text-[10px] opacity-70">({shortcut})</span>}
    </button>
  );
}
