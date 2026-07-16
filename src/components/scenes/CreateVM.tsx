import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Step = "name" | "memory" | "efi" | "disk" | "summary";

function getSteps(config: OSConfig): { key: Step; label: string }[] {
  const steps: { key: Step; label: string }[] = [
    { key: "name", label: "Name and Operating System" },
    { key: "memory", label: "Memory Size" },
  ];
  if (config.vmConfig.hasEFIRequirement) {
    steps.push({ key: "efi", label: "System Settings" });
  }
  steps.push({ key: "disk", label: "Hard Disk" });
  steps.push({ key: "summary", label: "Summary" });
  return steps;
}

export default function CreateVM({
  config,
  onComplete,
}: {
  config: OSConfig;
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const STEPS = getSteps(config);
  const [step, setStep] = useState(0);
  const [vmName, setVmName] = useState(`${config.branding.shortName} VM`);
  const [memory, setMemory] = useState(config.vmConfig.defaultMemoryMB);
  const [diskSize, setDiskSize] = useState(config.vmConfig.defaultDiskGB);
  const [efiEnabled, setEfiEnabled] = useState(true);

  const current = STEPS[step];

  useEffect(() => {
    if (step === STEPS.length - 1) {
      registerAdvance(() => onComplete());
    }
  }, [step, STEPS.length, registerAdvance, onComplete]);

  function next() {
    playClick();
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  }

  function prev() {
    playClick();
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl space-y-4">
      {/* VirtualBox Manager chrome */}
      <div className="overflow-hidden rounded-xl bg-[#2a2a2b] shadow-2xl ring-1 ring-white/10">
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-[#3c3c3c] px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="mx-auto text-xs text-white/60">Oracle VM VirtualBox Manager</span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b border-white/10 bg-[#3c3c3c] px-2 py-1.5">
          {["New", "Settings", "Start", "Close"].map((btn) => (
            <button
              key={btn}
              onClick={btn === "New" ? undefined : undefined}
              className={`rounded px-3 py-1 text-xs transition-colors ${
                btn === "New"
                  ? "bg-accent/20 text-accent font-semibold"
                  : "text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {btn === "New" ? "⭐ New" : btn === "Start" ? "▶ Start" : btn === "Close" ? "✕ Close" : btn}
            </button>
          ))}
        </div>

        {/* Wizard body */}
        <div className="flex h-[420px] lg:h-[520px] xl:h-[600px]">
          {/* Left panel — list of VMs */}
          <div className="w-52 shrink-0 border-r border-white/10 bg-[#1e1e1e] p-3">
            <div className="mb-2 text-xs uppercase tracking-wide text-white/40">Tools</div>
            <div className="space-y-1 text-xs text-white/60">
              <div className="rounded bg-white/5 px-2 py-1.5">Welcome</div>
            </div>
            <div className="mt-4 mb-2 text-xs uppercase tracking-wide text-white/40">Preview</div>
            <div className="rounded border border-white/10 bg-[#2a2a2b] p-2 text-center">
              <div className="text-3xl">{config.branding.logo}</div>
              <div className="mt-1 text-[10px] sm:text-xs text-white/40">No preview</div>
            </div>
          </div>

          {/* Wizard content */}
          <div className="flex flex-1 flex-col p-6">
            <motion.div
              key={current.key}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              {/* Step indicator */}
              <div className="mb-4 flex items-center gap-2 text-xs text-white/40">
                {STEPS.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold ${
                        i === step
                          ? "bg-accent text-white"
                          : i < step
                            ? "bg-emerald-500/80 text-white"
                            : "bg-white/10 text-white/40"
                      }`}
                    >
                      {i < step ? "✓" : i + 1}
                    </span>
                    {i < STEPS.length - 1 && <div className="h-px w-6 bg-white/10" />}
                  </div>
                ))}
              </div>

              <h3 className="mb-4 text-lg font-semibold text-white/90">{current.label}</h3>

              {current.key === "name" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Name:</label>
                    <input
                      value={vmName}
                      onChange={(e) => setVmName(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-[#1e1e1e] px-3 py-2 text-sm text-white outline-none focus:border-accent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs text-white/50">Type:</label>
                      <select className="w-full rounded-lg border border-white/20 bg-[#1e1e1e] px-3 py-2 text-sm text-white outline-none">
                        <option>{config.vmConfig.osType}</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-white/50">Version:</label>
                      <select className="w-full rounded-lg border border-white/20 bg-[#1e1e1e] px-3 py-2 text-sm text-white outline-none">
                        <option>{config.vmConfig.osVersion}</option>
                      </select>
                    </div>
                  </div>
                  <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-xs text-accent-soft">
                    💡 VirtualBox will auto-detect optimal settings for {config.branding.name}.
                  </div>
                </div>
              )}

              {current.key === "efi" && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
                    ⚠️ {config.branding.name} requires TPM 2.0 and Secure Boot to install correctly.
                    Enable EFI below to emulate this.
                  </div>
                  <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/90 transition-colors hover:bg-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={efiEnabled}
                      onChange={(e) => setEfiEnabled(e.target.checked)}
                      className="accent-accent"
                    />
                    Enable EFI (special OSes only)
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/90 transition-colors hover:bg-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="accent-accent"
                    />
                    Enable Secure Boot
                  </label>
                </div>
              )}

              {current.key === "memory" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs text-white/50">
                      Base Memory (MB): <span className="text-white/80">{memory}</span>
                    </label>
                    <input
                      type="range"
                      min={512}
                      max={8192}
                      step={256}
                      value={memory}
                      onChange={(e) => setMemory(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                    <div className="flex justify-between text-xs sm:text-sm text-white/30 mt-1">
                      <span>512 MB</span>
                      <span className={`font-semibold ${memory >= 2048 ? "text-emerald-400" : "text-amber-400"}`}>
                        {memory >= 2048 ? "✓ Recommended" : "⚠ Below minimum"}
                      </span>
                      <span>8192 MB</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1024, 2048, 4096].map((v) => (
                      <button
                        key={v}
                        onClick={() => { setMemory(v); playClick(); }}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          memory === v
                            ? "border-accent bg-accent/20 text-white"
                            : "border-white/10 text-white/50 hover:text-white"
                        }`}
                      >
                        {v >= 1024 ? `${v / 1024} GB` : `${v} MB`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {current.key === "disk" && (
                <div className="space-y-4">
                  <div className="text-sm text-white/70">
                    Do you want to add a virtual hard disk now?
                  </div>
                  <div className="space-y-2">
                    {[
                      { id: "create", label: "Create a virtual hard disk now", default: true },
                      { id: "existing", label: "Use an existing virtual hard disk file", default: false },
                      { id: "none", label: "Do not add a virtual hard disk", default: false },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80 transition-colors hover:bg-white/10 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="disk"
                          defaultChecked={opt.default}
                          className="accent-accent"
                          readOnly
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">
                      Disk size: <span className="text-white/80">{diskSize} GB</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={diskSize}
                      onChange={(e) => setDiskSize(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                    <div className="flex justify-between text-xs sm:text-sm text-white/30 mt-1">
                      <span>10 GB</span>
                      <span className={diskSize >= 25 ? "text-emerald-400" : "text-amber-400"}>
                        {diskSize >= 25 ? "✓ Good for most installs" : "⚠ Might be tight"}
                      </span>
                      <span>100 GB</span>
                    </div>
                  </div>
                </div>
              )}

              {current.key === "summary" && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-white/50">Name:</div>
                      <div className="text-white/90">{vmName}</div>
                      <div className="text-white/50">OS Type:</div>
                      <div className="text-white/90">
                        {config.vmConfig.osType} / {config.vmConfig.osVersion}
                      </div>
                      <div className="text-white/50">Memory:</div>
                      <div className="text-white/90">{memory} MB ({(memory / 1024).toFixed(1)} GB)</div>
                      <div className="text-white/50">Hard Disk:</div>
                      <div className="text-white/90">Create {diskSize} GB VDI</div>
                      {config.vmConfig.hasEFIRequirement && (
                        <>
                          <div className="text-white/50">EFI:</div>
                          <div className="text-white/90">{efiEnabled ? "Enabled" : "Disabled"}</div>
                        </>
                      )}
                      <div className="text-white/50">Graphics:</div>
                      <div className="text-white/90">VMSVGA with 128 MB VRAM</div>
                      <div className="text-white/50">Network:</div>
                      <div className="text-white/90">NAT (adapter 1)</div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300">
                    ✓ Virtual machine is ready to be created. Click <strong>Finish</strong> to create it.
                  </div>
                </div>
              )}
            </motion.div>

            {/* Bottom navigation */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
              <button
                onClick={prev}
                disabled={step === 0}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 transition-colors hover:text-white disabled:opacity-30"
              >
                ‹ Back
              </button>
              <div className="text-xs text-white/30">
                Step {step + 1} of {STEPS.length}
              </div>
              <button onClick={next} className="btn-primary px-6 py-2 text-sm">
                {step === STEPS.length - 1 ? "Finish" : "Next ›"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-white/50">
        Create a new virtual machine in VirtualBox to install {config.branding.name}.
      </div>
    </div>
  );
}
