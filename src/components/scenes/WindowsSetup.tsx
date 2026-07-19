import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";
import type { OSConfig } from "../../data/types";

type SetupStep = "language" | "keyboard" | "setup_option" | "product_key" | "edition" | "license" | "partition" | "installing";

const LANGUAGES = [
  "English (United States)", "English (United Kingdom)", "Español (Estados Unidos)",
  "Français (France)", "Deutsch (Deutschland)", "Português (Brasil)", "日本語", "中文(简体)", "한국어",
];

const KEYBOARDS = ["US", "UK", "US - International", "Canadian Multilingual", "French", "German", "Japanese", "Korean"];

const INITIAL_PARTITIONS = [
  { id: "p1", label: "Drive 0 Partition 1: EFI System Partition", size: "100 MB", type: "EFI" },
  { id: "p2", label: "Drive 0 Partition 2: Microsoft Reserved", size: "16 MB", type: "MSR" },
  { id: "p3", label: "Drive 0 Partition 3: Primary", size: "237.2 GB", type: "Primary" },
  { id: "p4", label: "Drive 0 Unallocated Space", size: "262.6 GB", type: "Free" },
];

export default function WindowsSetup({ onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [step, setStep] = useState<SetupStep>("language");
  const [lang, setLang] = useState("English (United States)");
  const [keyboard, setKeyboard] = useState("US");
  const [agreedDelete, setAgreedDelete] = useState(false);
  const [partitions] = useState(INITIAL_PARTITIONS);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [keyInput, setKeyInput] = useState(["", "", "", "", ""]);
  const [installProgress, setInstallProgress] = useState(0);
  const installRef = useRef(0);

  const steps: SetupStep[] = ["language", "keyboard", "setup_option", "product_key", "edition", "license", "partition", "installing"];
  const currentIdx = steps.indexOf(step);

  useEffect(() => {
    if (step !== "installing") return;
    installRef.current = 0;
    const iv = setInterval(() => {
      installRef.current += 1;
      setInstallProgress(installRef.current);
      if (installRef.current >= 100) {
        clearInterval(iv);
        setTimeout(onComplete, 500);
      }
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

  const stepDots = steps.filter(s => s !== "installing");

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10"
        style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0d1117 40%, #0a0a0f 100%)" }}>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {stepDots.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${i <= currentIdx ? "w-3" : "w-1.5"}`}
              style={{ background: i <= currentIdx ? "#0078d4" : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>

        {step === "installing" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="grid grid-cols-2 gap-0.5 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-3.5 h-3.5 bg-[#0078d4] rounded-sm" />
              ))}
            </div>
            <p className="text-white/80 text-sm font-light mb-1">Installing Windows 11</p>
            <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden mb-2">
              <motion.div className="h-full bg-[#0078d4]" animate={{ width: `${installProgress}%` }} transition={{ duration: 0.1 }} />
            </div>
            <p className="text-white/30 text-xs font-mono">{installProgress}%</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
            <div className="w-full max-w-md">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  {step === "language" && (
                    <div className="space-y-4 text-center">
                      <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 36 }}>
                        {[0, 1, 2, 3].map(i => <div key={i} className="w-4 h-4 bg-[#0078d4] rounded-sm" />)}
                      </div>
                      <h2 className="text-white/90 text-base font-medium">Windows Setup</h2>
                      <p className="text-white/40 text-xs">Select language to install:</p>
                      <select value={lang} onChange={e => { setLang(e.target.value); }}
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4] transition-colors">
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  )}

                  {step === "keyboard" && (
                    <div className="space-y-4 text-center">
                      <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 36 }}>
                        {[0, 1, 2, 3].map(i => <div key={i} className="w-4 h-4 bg-[#0078d4] rounded-sm" />)}
                      </div>
                      <h2 className="text-white/90 text-base font-medium">Keyboard layout</h2>
                      <p className="text-white/40 text-xs">Select your keyboard layout:</p>
                      <select value={keyboard} onChange={e => { setKeyboard(e.target.value); }}
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4] transition-colors">
                        {KEYBOARDS.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                  )}

                  {step === "setup_option" && (
                    <div className="space-y-4 text-center">
                      <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 36 }}>
                        {[0, 1, 2, 3].map(i => <div key={i} className="w-4 h-4 bg-[#0078d4] rounded-sm" />)}
                      </div>
                      <h2 className="text-white/90 text-base font-medium">Windows Setup</h2>
                      <p className="text-white/40 text-xs mb-3">Choose installation type:</p>
                      {[
                        { id: "upgrade", label: "Upgrade: Install Windows and keep files", desc: "Keeps your personal files, apps, and settings" },
                        { id: "custom", label: "Custom: Install Windows only (advanced)", desc: "Select a partition and install fresh" },
                      ].map(opt => (
                        <button key={opt.id} onClick={() => { if (opt.id === "custom") handleNext(); }}
                          className="w-full text-left border border-white/20 hover:border-white/40 rounded-lg p-3 transition-all bg-white/5 hover:bg-white/10">
                          <div className="text-sm font-medium text-white/90">{opt.label}</div>
                          <div className="text-[10px] text-white/40 mt-0.5">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {step === "product_key" && (
                    <div className="space-y-4 text-center">
                      <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 36 }}>
                        {[0, 1, 2, 3].map(i => <div key={i} className="w-4 h-4 bg-[#0078d4] rounded-sm" />)}
                      </div>
                      <h2 className="text-white/90 text-base font-medium">Product key</h2>
                      <p className="text-white/40 text-xs">Enter your product key (XXXXX-XXXXX-XXXXX-XXXXX-XXXXX):</p>
                      <div className="flex gap-2 justify-center">
                        {keyInput.map((chunk, i) => (
                          <input key={i} type="text" maxLength={5} value={chunk}
                            onChange={e => {
                              const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
                              const next = [...keyInput];
                              next[i] = val;
                              setKeyInput(next);
                              if (val.length === 5 && i < 4) {
                                (document.querySelectorAll("input[maxlength='5']")[i + 1] as HTMLElement)?.focus();
                              }
                            }}
                            className="w-14 h-10 text-center text-xs bg-white/10 border border-white/20 rounded text-white outline-none focus:border-[#0078d4] font-mono" />
                        ))}
                      </div>
                      <button onClick={handleNext}
                        className="text-xs text-[#0078d4] hover:underline font-medium">I don't have a product key</button>
                    </div>
                  )}

                  {step === "edition" && (
                    <div className="space-y-4 text-center">
                      <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 36 }}>
                        {[0, 1, 2, 3].map(i => <div key={i} className="w-4 h-4 bg-[#0078d4] rounded-sm" />)}
                      </div>
                      <h2 className="text-white/90 text-base font-medium">Select edition</h2>
                      <p className="text-white/40 text-xs">Choose the Windows edition to install:</p>
                      {["Windows 11 Home", "Windows 11 Pro", "Windows 11 Education"].map(ed => (
                        <button key={ed} onClick={handleNext}
                          className="w-full border border-white/20 hover:border-white/40 rounded-lg p-3 transition-all bg-white/5 hover:bg-white/10">
                          <div className="text-sm font-medium text-white/90">{ed}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {step === "license" && (
                    <div className="space-y-4 text-center">
                      <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 36 }}>
                        {[0, 1, 2, 3].map(i => <div key={i} className="w-4 h-4 bg-[#0078d4] rounded-sm" />)}
                      </div>
                      <h2 className="text-white/90 text-base font-medium">License terms</h2>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-[10px] text-white/50 text-left h-24 overflow-y-auto mb-3 leading-relaxed">
                        MICROSOFT SOFTWARE LICENSE TERMS<br /><br />
                        WINDOWS 11 OPERATING SYSTEM<br /><br />
                        These license terms are an agreement between you and Microsoft Corporation.
                        Please read them carefully. They apply to the software named above.
                        By installing the software, you accept these terms.
                      </div>
                      <label className="flex items-center justify-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={agreedDelete} onChange={() => { playClick(); setAgreedDelete(!agreedDelete); }}
                          className="w-4 h-4 accent-[#0078d4] cursor-pointer" />
                        <span className="text-xs text-white/70">I accept the license terms</span>
                      </label>
                    </div>
                  )}

                  {step === "partition" && (
                    <div className="space-y-3">
                      <h2 className="text-white/90 text-base font-medium text-center">Where to install Windows?</h2>
                      <p className="text-white/40 text-xs text-center mb-2">Select a partition to install Windows.</p>
                      <div className="space-y-1.5">
                        {partitions.map(p => (
                          <button key={p.id} onClick={() => { playClick(); setSelectedPart(p.id); }}
                            className={`w-full text-left border rounded-lg p-3 transition-all ${
                              selectedPart === p.id
                                ? "border-[#0078d4] bg-[#0078d4]/10"
                                : "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
                            }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-white/90">{p.label}</span>
                              <span className="text-[10px] text-white/40">{p.size}</span>
                            </div>
                            <span className="text-[9px] text-white/30">{p.type}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button className="text-[10px] text-white/40 hover:text-white/70 border border-white/20 rounded px-2.5 py-1 hover:bg-white/5 transition-all">Load driver</button>
                        <button className="text-[10px] text-white/40 hover:text-white/70 border border-white/20 rounded px-2.5 py-1 hover:bg-white/5 transition-all">Format</button>
                        <button className="text-[10px] text-white/40 hover:text-white/70 border border-white/20 rounded px-2.5 py-1 hover:bg-white/5 transition-all">New</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                  <button onClick={handleBack} disabled={currentIdx === 0}
                    className="text-xs font-medium px-4 py-1.5 rounded text-white/40 hover:text-white/70 disabled:opacity-30 transition-all">
                    Back
                  </button>
                  <button onClick={step === "license" ? (agreedDelete ? handleNext : undefined) : step === "partition" ? (selectedPart ? () => { playClick(); setConfirmDelete(true); } : undefined) : handleNext}
                    disabled={step === "license" && !agreedDelete}
                    className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-40"
                    style={{ background: "#0078d4" }}>
                    {step === "product_key" ? "Skip" : "Next"}
                  </button>
                </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {confirmDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-[#1a1a2e] border border-white/15 rounded-xl p-5 max-w-sm w-full shadow-2xl">
                <h3 className="text-sm font-bold text-white/90 mb-1">Delete partition?</h3>
                <p className="text-xs text-white/50 mb-4">This will delete all data on this partition. Are you sure?</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { playClick(); setConfirmDelete(false); }}
                    className="px-3 py-1.5 text-xs text-white/60 hover:text-white/90 border border-white/15 rounded-lg transition-all">Cancel</button>
                  <button onClick={() => { playClick(); setConfirmDelete(false); setSelectedPart(null); handleNext(); }}
                    className="bg-red-600 text-white px-4 py-1.5 text-xs font-semibold rounded-lg hover:bg-red-700 transition-all">Delete</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
