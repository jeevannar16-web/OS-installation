import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";
import type { OSConfig } from "../../data/types";

type SetupStep =
  | "language"
  | "keyboard"
  | "setup_option"
  | "product_key"
  | "edition"
  | "license"
  | "partition"
  | "installing";

const STEP_BG: Record<SetupStep, string> = {
  language: "/images/win11-setup/01-setup-language.webp",
  keyboard: "/images/win11-setup/02-setup-keyboard.webp",
  setup_option: "/images/win11-setup/03-install-option.webp",
  product_key: "/images/win11-setup/04-product-key.webp",
  edition: "/images/win11-setup/05-choose-edition.webp",
  license: "/images/win11-setup/05-choose-edition.webp",
  partition: "/images/win11-setup/07-partition-select.webp",
  installing: "/images/win11-setup/08-clean-install.webp",
};

const LANGUAGES = [
  "English (United States)", "English (United Kingdom)", "Español (Estados Unidos)",
  "Français (France)", "Deutsch (Deutschland)", "Português (Brasil)", "日本語 (日本)", "中文(简体)", "한국어",
];

const KEYBOARDS = ["US", "UK", "US - International", "Canadian Multilingual", "French", "German", "Japanese", "Korean"];

const EDITIONS = [
  { name: "Windows 11 Home", desc: "For personal and home use" },
  { name: "Windows 11 Pro", desc: "For business and advanced users" },
  { name: "Windows 11 Education", desc: "For educational environments" },
];

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
  const [keyInput, setKeyInput] = useState(["", "", "", "", ""]);
  const [acceptedLicense, setAcceptedLicense] = useState(false);
  const [agreedDelete, setAgreedDelete] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState(0);
  const [partitions, setPartitions] = useState(INITIAL_PARTITIONS);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [popup, setPopup] = useState<string | null>(null);

  const steps: SetupStep[] = ["language", "keyboard", "setup_option", "product_key", "edition", "license", "partition", "installing"];
  const currentIdx = steps.indexOf(step);

  function handleNext() {
    playClick();
    const nextIdx = currentIdx + 1;
    if (nextIdx >= steps.length) { onComplete(); return; }
    if (steps[nextIdx] === "installing") { setStep("installing"); setTimeout(onComplete, 3000); return; }
    setStep(steps[nextIdx]);
  }

  function handleBack() {
    if (currentIdx <= 0) return;
    playClick();
    setStep(steps[currentIdx - 1]);
  }

  function handleInteract() {
    playClick();
    switch (step) {
      case "language": {
        const idx = LANGUAGES.indexOf(lang);
        setLang(LANGUAGES[(idx + 1) % LANGUAGES.length]);
        break;
      }
      case "keyboard": {
        const idx = KEYBOARDS.indexOf(keyboard);
        setKeyboard(KEYBOARDS[(idx + 1) % KEYBOARDS.length]);
        break;
      }
      case "setup_option":
        setAgreedDelete(!agreedDelete);
        break;
      case "product_key":
        setPopup("enter-key");
        break;
      case "edition":
        setSelectedEdition((selectedEdition + 1) % EDITIONS.length);
        break;
      case "license":
        setAcceptedLicense(!acceptedLicense);
        break;
      case "partition": {
        const unalloc = partitions.find(p => p.type === "Free");
        if (unalloc && !selectedPart) setSelectedPart(unalloc.id);
        else if (selectedPart) { setPartitions(prev => prev.filter(p => p.id !== selectedPart)); setSelectedPart(null); setConfirmDelete(false); }
        break;
      }
    }
  }

  const hotspots = [];
  if (step !== "installing") {
    hotspots.push(
      { id: "next", x: 70, y: 85, w: 20, h: 9, onClick: handleNext },
      { id: "interact", x: 10, y: 15, w: 80, h: 60, onClick: handleInteract }
    );
    if (currentIdx > 0) {
      hotspots.push({ id: "back", x: 10, y: 85, w: 18, h: 9, onClick: handleBack });
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <AnimatePresence mode="wait">
          <motion.img key={step} src={STEP_BG[step]} alt=""
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-cover" />
        </AnimatePresence>

        {hotspots.map(h => (
          <div key={h.id} onClick={h.onClick}
            className="absolute z-10"
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%`, cursor: "pointer" }} />
        ))}

        {/* Step indicator dots */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full">
          {steps.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${i <= currentIdx ? "w-3" : "w-1.5"}`}
              style={{ background: i <= currentIdx ? "#0078d4" : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>

        {step === "installing" && (
          <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="grid grid-cols-2 gap-px">
                <div className="w-4 h-4 bg-[#0078d4] rounded-sm" />
                <div className="w-4 h-4 bg-[#0078d4] rounded-sm" />
                <div className="w-4 h-4 bg-[#0078d4] rounded-sm" />
                <div className="w-4 h-4 bg-[#0078d4] rounded-sm" />
              </div>
              <div className="text-xs text-white/60 font-mono">Installing Windows…</div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {popup === "enter-key" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full">
                <h3 className="text-black text-base font-medium mb-1">Enter product key</h3>
                <p className="text-gray-500 text-xs mb-4">If you have one, enter it now. You can also skip and do this later.</p>
                <div className="flex gap-1 justify-center mb-5">
                  {keyInput.map((v, i) => (
                    <input key={i} value={v} onChange={e => { const c = [...keyInput]; c[i] = e.target.value.replace(/[^A-Z0-9]/g, "").toUpperCase().slice(0, 5); setKeyInput(c); }}
                      maxLength={5} placeholder="XXXXX"
                      className="w-14 h-10 text-center border border-gray-300 rounded text-sm text-black font-mono uppercase outline-none focus:border-[#0078d4]" />
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { playClick(); setPopup(null); }} className="px-4 py-2 text-sm text-gray-600 hover:text-black">Skip</button>
                  <button onClick={() => { playClick(); setPopup(null); setStep("edition"); }} className="bg-[#0078d4] text-white px-5 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Next</button>
                </div>
              </div>
            </motion.div>
          )}
          {confirmDelete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full">
                <h3 className="text-black text-base font-medium mb-1">Delete partition?</h3>
                <p className="text-gray-500 text-xs mb-5">This will delete all data on this partition.</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { playClick(); setConfirmDelete(false); }} className="px-4 py-2 text-sm text-gray-600 hover:text-black">Cancel</button>
                  <button onClick={() => { playClick(); setPartitions(prev => prev.filter(p => p.id !== selectedPart)); setSelectedPart(null); setConfirmDelete(false); }}
                    className="bg-red-600 text-white px-5 py-2 text-sm font-semibold rounded-md hover:bg-red-700">Delete</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
