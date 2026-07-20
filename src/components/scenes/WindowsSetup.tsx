import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";
import type { OSConfig } from "../../data/types";

type SetupStep = "language" | "keyboard" | "option" | "product_key" | "edition" | "license" | "drive" | "summary" | "installing";

const LANGUAGES = [
  "English (United States)", "English (United Kingdom)", "Español (Estados Unidos)",
  "Français (France)", "Deutsch (Deutschland)", "Português (Brasil)", "日本語", "中文(简体)", "한국어",
];

const KEYBOARDS = ["US", "UK", "US - International", "Canadian Multilingual", "French", "German", "Japanese", "Korean"];

const EDITIONS = ["Windows 11 Home", "Windows 11 Pro", "Windows 11 Education"];

const INITIAL_PARTITIONS = [
  { id: "p1", label: "Drive 0 Partition 1: EFI System Partition", size: "100 MB", type: "System" },
  { id: "p2", label: "Drive 0 Partition 2: Microsoft Reserved", size: "16 MB", type: "Reserved" },
  { id: "p3", label: "Drive 0 Partition 3: Primary", size: "237.2 GB", type: "Primary" },
  { id: "p4", label: "Drive 0 Unallocated Space", size: "262.6 GB", type: "Free" },
];

const WINDOWS_BLUE = "#0078d4";

function StepDots({ count, current }: { count: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all ${i <= current ? "w-3" : "w-1.5"}`}
          style={{ background: i <= current ? WINDOWS_BLUE : "rgba(255,255,255,0.15)" }} />
      ))}
    </div>
  );
}

export default function WindowsSetup({ onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [step, setStep] = useState<SetupStep>("language");
  const [lang, setLang] = useState("English (United States)");
  const [keyboard, setKeyboard] = useState("US");
  const [edition, setEdition] = useState("Windows 11 Pro");
  const [accepted, setAccepted] = useState(false);
  const [partitions] = useState(INITIAL_PARTITIONS);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [keyInput, setKeyInput] = useState(["", "", "", "", ""]);
  const [installProgress, setInstallProgress] = useState(0);
  const installRef = useRef(0);

  const steps: SetupStep[] = ["language", "keyboard", "option", "product_key", "edition", "license", "drive", "summary", "installing"];
  const currentIdx = steps.indexOf(step);
  const visibleSteps = steps.filter(s => s !== "installing");

  useEffect(() => {
    if (step !== "installing") return;
    installRef.current = 0;
    const iv = setInterval(() => {
      installRef.current += 1;
      setInstallProgress(installRef.current);
      if (installRef.current >= 100) { clearInterval(iv); setTimeout(onComplete, 500); }
    }, 40);
    return () => clearInterval(iv);
  }, [step, onComplete]);

  function handleNext() {
    playClick();
    const nextIdx = currentIdx + 1;
    if (nextIdx >= steps.length) { onComplete(); return; }
    setStep(steps[nextIdx]);
  }

  function handleBack() {
    if (currentIdx <= 0) return;
    playClick();
    setStep(steps[currentIdx - 1]);
  }

  function canAdvance(): boolean {
    if (step === "license") return accepted;
    if (step === "drive") return !!selectedPart;
    if (step === "product_key") return true;
    return true;
  }

  function renderStep() {
    switch (step) {
      case "language":
        return (
          <div className="space-y-5 text-center">
            <WindowsLogo />
            <div>
              <h2 className="text-white/90 text-base font-medium mb-1">Windows Setup</h2>
              <p className="text-white/40 text-xs">Language to install:</p>
            </div>
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4] transition-colors">
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className="flex items-center gap-2 text-[10px] text-white/30 justify-center">
              <span>Time and currency format:</span><span className="text-white/50">{lang === "English (United States)" ? "English (United States)" : lang}</span>
            </div>
          </div>
        );

      case "keyboard":
        return (
          <div className="space-y-5 text-center">
            <WindowsLogo />
            <div>
              <h2 className="text-white/90 text-base font-medium mb-1">Keyboard layout</h2>
              <p className="text-white/40 text-xs">Input method:</p>
            </div>
            <select value={keyboard} onChange={e => setKeyboard(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4] transition-colors">
              {KEYBOARDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        );

      case "option":
        return (
          <div className="space-y-5">
            <WindowsLogo />
            <div className="text-center">
              <h2 className="text-white/90 text-base font-medium mb-1">Windows Setup</h2>
            </div>
            <div className="space-y-3">
              <button onClick={handleNext}
                className="w-full text-left border border-white/20 hover:border-white/40 rounded-lg p-4 transition-all bg-white/5 hover:bg-white/10">
                <div className="text-sm font-semibold text-white/90">Install Windows 11</div>
                <div className="text-[10px] text-white/40 mt-1">Performs a clean installation or upgrades the current setup.</div>
              </button>
              <button onClick={handleNext}
                className="w-full text-left border border-white/20 hover:border-white/40 rounded-lg p-4 transition-all bg-white/5 hover:bg-white/10">
                <div className="text-sm font-semibold text-white/90">Repair your computer</div>
                <div className="text-[10px] text-white/40 mt-1">Troubleshoot and repair Windows startup issues.</div>
              </button>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-[10px] text-yellow-400/70 leading-relaxed">
              If you choose "Install Windows 11", all files and data on the selected drive will be deleted.
            </div>
          </div>
        );

      case "product_key":
        return (
          <div className="space-y-5 text-center">
            <WindowsLogo />
            <div>
              <h2 className="text-white/90 text-base font-medium mb-1">Product key</h2>
              <p className="text-white/40 text-xs mb-3">Enter your product key (XXXXX-XXXXX-XXXXX-XXXXX-XXXXX):</p>
            </div>
            <div className="flex gap-2 justify-center">
              {keyInput.map((chunk, i) => (
                <input key={i} type="text" maxLength={5} value={chunk}
                  onChange={e => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
                    const next = [...keyInput]; next[i] = val; setKeyInput(next);
                    if (val.length === 5 && i < 4) {
                      (document.querySelectorAll("input[maxlength='5']")[i + 1] as HTMLElement)?.focus();
                    }
                  }}
                  className="w-14 h-10 text-center text-xs bg-white/10 border border-white/20 rounded text-white outline-none focus:border-[#0078d4] font-mono" />
              ))}
            </div>
            <button onClick={handleNext} className="text-xs text-[#0078d4] hover:underline font-medium">I don't have a product key</button>
          </div>
        );

      case "edition":
        return (
          <div className="space-y-4 text-center">
            <WindowsLogo />
            <div>
              <h2 className="text-white/90 text-base font-medium mb-1">Select operating system to install</h2>
              <p className="text-white/40 text-xs">Choose the edition you want:</p>
            </div>
            <div className="space-y-2">
              {EDITIONS.map(ed => (
                <button key={ed} onClick={() => { setEdition(ed); handleNext(); }}
                  className={`w-full text-left border rounded-lg p-3 transition-all ${
                    edition === ed ? "border-[#0078d4] bg-[#0078d4]/10" : "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
                  }`}>
                  <div className="text-sm font-medium text-white/90">{ed}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    {ed === "Windows 11 Home" ? "Best for home use. Includes basic features." :
                     ed === "Windows 11 Pro" ? "For power users and businesses." :
                     "For educational environments."}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "license":
        return (
          <div className="space-y-4 text-center">
            <WindowsLogo />
            <div>
              <h2 className="text-white/90 text-base font-medium mb-1">License terms</h2>
              <p className="text-white/40 text-xs">This applies to: {edition}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-[10px] text-white/50 text-left h-28 overflow-y-auto leading-relaxed">
              <strong>MICROSOFT SOFTWARE LICENSE TERMS</strong><br /><br />
              WINDOWS 11 OPERATING SYSTEM<br /><br />
              These license terms are an agreement between you and Microsoft Corporation.
              Please read them carefully. They apply to the software named above.
              By installing, copying, or using the software, you accept these terms.<br /><br />
              <strong>1. Installation and Use.</strong> You may install and use one copy of the software on a device.
              <br /><br />
              <strong>2. Scope of License.</strong> The software is licensed, not sold.
              Microsoft reserves all rights not expressly granted.
            </div>
            <label className="flex items-center justify-center gap-2 cursor-pointer">
              <input type="checkbox" checked={accepted} onChange={() => { playClick(); setAccepted(!accepted); }}
                className="w-4 h-4 accent-[#0078d4] cursor-pointer" />
              <span className="text-xs text-white/70">I accept the license terms</span>
            </label>
          </div>
        );

      case "drive":
        return (
          <div className="space-y-4">
            <WindowsLogo />
            <div className="text-center">
              <h2 className="text-white/90 text-base font-medium mb-1">Where to install Windows?</h2>
              <p className="text-white/40 text-xs">Select a drive to install Windows 11.</p>
            </div>
            <div className="flex gap-2">
              <button className="text-[10px] text-white/40 hover:text-white/70 border border-white/20 rounded px-2.5 py-1 hover:bg-white/5 transition-all">Load driver</button>
              <button className="text-[10px] text-white/40 hover:text-white/70 border border-white/20 rounded px-2.5 py-1 hover:bg-white/5 transition-all">Format</button>
              <button className="text-[10px] text-white/40 hover:text-white/70 border border-white/20 rounded px-2.5 py-1 hover:bg-white/5 transition-all">New</button>
              <button className="text-[10px] text-white/40 hover:text-white/70 border border-white/20 rounded px-2.5 py-1 hover:bg-white/5 transition-all">Delete</button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {partitions.map(p => (
                <button key={p.id} onClick={() => { playClick(); setSelectedPart(p.id); }}
                  className={`w-full text-left border rounded-lg p-3 transition-all flex items-center gap-3 ${
                    selectedPart === p.id
                      ? "border-[#0078d4] bg-[#0078d4]/10"
                      : "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
                  }`}>
                  <div className="w-6 h-6 rounded border border-white/20 flex items-center justify-center text-[9px] text-white/40 font-mono">
                    {p.type === "System" ? "EFI" : p.type === "Reserved" ? "MSR" : p.type === "Free" ? "~" : "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white/90 truncate">{p.label}</div>
                    <div className="text-[9px] text-white/30">{p.type} • {p.size}</div>
                  </div>
                  <div className="text-[10px] text-white/40">{p.size}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="space-y-5 text-center">
            <WindowsLogo />
            <h2 className="text-white/90 text-base font-medium">Ready to install</h2>
            <p className="text-white/40 text-xs">Windows 11 will be installed on the selected drive.</p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-left space-y-2">
              {[
                ["Edition", edition],
                ["Drive", partitions.find(p => p.id === selectedPart)?.label || "Drive 0"],
                ["Keyboard", keyboard],
                ["Language", lang],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-[11px]">
                  <span className="text-white/40">{l}</span>
                  <span className="text-white/80 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-white/30 leading-relaxed">
              Parts of the operating system require specific hardware. Some features may not be available on your device.
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10"
        style={{ background: "linear-gradient(180deg, #0a0a16 0%, #0d1117 40%, #0a0a16 100%)" }}>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <StepDots count={visibleSteps.length} current={currentIdx} />
        </div>

        {step === "installing" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
            style={{ background: "linear-gradient(135deg, #0a0a16, #002040)" }}>
            <div className="mb-6 opacity-20">
              <svg viewBox="0 0 20 20" width="48" height="48"><rect x="0" y="0" width="9" height="9" fill="#0078d4" rx="1"/><rect x="11" y="0" width="9" height="9" fill="#0078d4" rx="1"/><rect x="0" y="11" width="9" height="9" fill="#0078d4" rx="1"/><rect x="11" y="11" width="9" height="9" fill="#0078d4" rx="1"/></svg>
            </div>
            <p className="text-white/80 text-lg font-light mb-1">Installing Windows 11</p>
            <div className="flex gap-2 mb-4">
              <span className="text-white/40 text-[10px]">{installProgress}%</span>
            </div>
            <div className="w-72 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full" style={{ background: WINDOWS_BLUE }}
                animate={{ width: `${installProgress}%` }} transition={{ duration: 0.1 }} />
            </div>
            <p className="text-white/20 text-[10px] mt-4 font-mono">{[
              "Copying Windows files…",
              "Expanding Windows files…",
              "Installing features…",
              "Installing updates…",
              "Getting devices ready…",
              "Finishing up…",
            ][Math.min(5, Math.floor(installProgress / 17))]}</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-lg">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <button onClick={handleBack} disabled={currentIdx === 0}
                  className="text-xs font-medium px-4 py-1.5 rounded text-white/40 hover:text-white/70 disabled:opacity-30 transition-all">
                  Back
                </button>
                <button onClick={canAdvance() ? (step === "drive" ? () => setConfirmDelete(true) : handleNext) : undefined}
                  disabled={!canAdvance()}
                  className="rounded-lg px-6 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-40"
                  style={{ background: WINDOWS_BLUE }}>
                  {step === "product_key" ? "I don't have a product key" : step === "summary" ? "Install" : "Next"}
                </button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {confirmDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-[#1e1e28] border border-white/15 rounded-xl p-5 max-w-sm w-full shadow-2xl">
                <h3 className="text-sm font-bold text-white/90 mb-1">Install</h3>
                <p className="text-xs text-white/50 mb-4">All data on the selected drive will be deleted. Are you sure you want to continue?</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { playClick(); setConfirmDelete(false); }}
                    className="px-3 py-1.5 text-xs text-white/60 hover:text-white/90 border border-white/15 rounded-lg transition-all">Cancel</button>
                  <button onClick={() => { playClick(); setConfirmDelete(false); setSelectedPart(null); handleNext(); }}
                    className="bg-red-600 text-white px-4 py-1.5 text-xs font-semibold rounded-lg hover:bg-red-700 transition-all">OK</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WindowsLogo() {
  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 20 20" width="36" height="36">
        <rect x="0" y="0" width="9" height="9" fill="#0078d4" rx="1.5" />
        <rect x="11" y="0" width="9" height="9" fill="#0078d4" rx="1.5" />
        <rect x="0" y="11" width="9" height="9" fill="#0078d4" rx="1.5" />
        <rect x="11" y="11" width="9" height="9" fill="#0078d4" rx="1.5" />
      </svg>
    </div>
  );
}
