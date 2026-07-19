import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";

type OobeStep =
  | "region"
  | "keyboard"
  | "second_keyboard"
  | "computer_name"
  | "setup_type"
  | "account"
  | "pin"
  | "privacy"
  | "backup"
  | "customize"
  | "phone_link"
  | "edge"
  | "loading";

const STEP_BG: Record<string, string> = {
  region: "/images/win11-setup/09-oobe-region.webp",
  keyboard: "/images/win11-setup/10-oobe-keyboard.webp",
  second_keyboard: "/images/win11-setup/10-oobe-keyboard.webp",
  computer_name: "/images/win11-setup/11-oobe-name-pc.webp",
  setup_type: "/images/win11-setup/12-oobe-personal-use.webp",
  account: "/images/win11-setup/13-oobe-account.webp",
  pin: "/images/win11-setup/14-oobe-pin.webp",
  privacy: "/images/win11-setup/15-oobe-privacy.webp",
  backup: "/images/win11-setup/16-oobe-backup.webp",
  customize: "/images/win11-setup/18-oobe-customize.webp",
  phone_link: "/images/win11-setup/17-oobe-new-pc.webp",
  edge: "/images/win11-setup/19-oobe-edge.webp",
};

const REGIONS = [
  "United States", "United Kingdom", "India", "Canada",
  "Australia", "Germany", "France", "Japan", "Brazil", "Nepal",
];

const KEYBOARDS = ["US", "UK", "US - International", "French", "German", "Japanese", "Korean"];

const PRIVACY_TOGGLES = [
  { id: "location", label: "Location", desc: "Let apps use your location", defaultOn: true },
  { id: "find", label: "Find my device", desc: "Help find your device if lost", defaultOn: true },
  { id: "inking", label: "Inking & typing", desc: "Improve inking and typing", defaultOn: true },
  { id: "diag", label: "Diagnostics", desc: "Send diagnostic data to Microsoft", defaultOn: true },
  { id: "ads", label: "Advertising ID", desc: "Let apps show personalized ads", defaultOn: false },
  { id: "speech", label: "Online speech recognition", desc: "Use online speech recognition", defaultOn: true },
];

const CUSTOMIZE_OPTIONS = [
  "Gaming", "School", "Creativity", "Business",
  "Family", "Entertainment", "Software development", "Health and fitness",
];

export default function WindowsOOBE({ osName: _osName, onComplete }: { osName: string; onComplete: () => void }) {
  const [step, setStep] = useState<OobeStep>("region");
  const [region, setRegion] = useState("United States");
  const [keyboard, setKeyboard] = useState("US");
  const [computerName, setComputerName] = useState("DESKTOP-SIM001");
  const [msEmail, setMsEmail] = useState("");
  const [msPassword, setMsPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [privacy, setPrivacy] = useState(Object.fromEntries(PRIVACY_TOGGLES.map((t) => [t.id, t.defaultOn])));
  const [customizeSelections, setCustomizeSelections] = useState<string[]>([]);
  const [loadingText, setLoadingText] = useState("Hi");
  const [loadingProgress, setLoadingProgress] = useState(0);
  useEffect(() => {
    if (step !== "loading") return;
    const texts = ["Hi", "Getting things ready for you", "This might take a few minutes", "Almost there"];
    let idx = 0;
    const iv = setInterval(() => { idx++; if (idx < texts.length) setLoadingText(texts[idx]); }, 2000);
    return () => clearInterval(iv);
  }, [step]);

  useEffect(() => {
    if (step !== "loading") return;
    const iv = setInterval(() => {
      setLoadingProgress((p) => {
        const next = Math.min(100, p + 1);
        if (next >= 100) { clearInterval(iv); setTimeout(onComplete, 1000); }
        return next;
      });
    }, 80);
    return () => clearInterval(iv);
  }, [step, onComplete]);

  const go = useCallback((next: OobeStep) => setStep(next), []);

  const steps: OobeStep[] = [
    "region", "keyboard", "second_keyboard", "computer_name", "setup_type",
    "account", "pin", "privacy", "backup", "customize", "phone_link", "edge", "loading",
  ];
  const currentIdx = steps.indexOf(step);

  function handleInteract() {
    playClick();
    switch (step) {
      case "region": {
        const idx = REGIONS.indexOf(region);
        setRegion(REGIONS[(idx + 1) % REGIONS.length]);
        break;
      }
      case "keyboard": {
        const idx = KEYBOARDS.indexOf(keyboard);
        setKeyboard(KEYBOARDS[(idx + 1) % KEYBOARDS.length]);
        break;
      }
      case "computer_name":
        setComputerName(computerName === "DESKTOP-SIM001" ? "DESKTOP-WIN11" : "DESKTOP-SIM001");
        break;
      case "account":
        if (!msEmail) setMsEmail("user@outlook.com");
        else if (!msPassword) setMsPassword("password123");
        else go("pin");
        break;
      case "pin":
        if (!pin) setPin("1234");
        else if (!pinConfirm) setPinConfirm("1234");
        else go("privacy");
        break;
      case "privacy": {
        const keys = Object.keys(privacy);
        const offIdx = keys.findIndex(k => !privacy[k]);
        if (offIdx >= 0) setPrivacy(p => ({ ...p, [keys[offIdx]]: true }));
        else go("backup");
        break;
      }
      case "backup":
        go("customize");
        break;
      case "customize":
        if (customizeSelections.length < CUSTOMIZE_OPTIONS.length) {
          setCustomizeSelections(prev => [...prev, CUSTOMIZE_OPTIONS[prev.length]]);
        } else go("phone_link");
        break;
      case "phone_link":
        go("edge");
        break;
      case "edge":
        go("loading");
        break;
    }
  }

  function handleNext() {
    playClick();
    const map: Partial<Record<OobeStep, OobeStep>> = {
      region: "keyboard", keyboard: "second_keyboard", second_keyboard: "computer_name",
      computer_name: "setup_type", setup_type: "account", account: "pin",
      pin: "privacy", privacy: "backup", backup: "customize", customize: "phone_link",
      phone_link: "edge", edge: "loading",
    };
    const next = map[step];
    if (next) go(next);
  }

  function handleBack() {
    const map: Partial<Record<OobeStep, OobeStep>> = {
      keyboard: "region", second_keyboard: "keyboard", computer_name: "second_keyboard",
      setup_type: "computer_name", account: "setup_type", pin: "account",
      privacy: "pin", backup: "privacy", customize: "backup", phone_link: "customize", edge: "phone_link",
    };
    const prev = map[step];
    if (prev) { playClick(); go(prev); }
  }

  if (step === "loading") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10"
          style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0d1117 40%, #0a0a0f 100%)" }}>
          <div className="absolute bottom-[35%] inset-x-0 text-center px-6">
            <div className="grid grid-cols-2 gap-0.5 mx-auto mb-6" style={{ width: 28 }}>
              <div className="w-3 h-3 bg-[#0078d4] rounded-sm" />
              <div className="w-3 h-3 bg-[#0078d4] rounded-sm" />
              <div className="w-3 h-3 bg-[#0078d4] rounded-sm" />
              <div className="w-3 h-3 bg-[#0078d4] rounded-sm" />
            </div>
            <p className="text-white/80 text-base font-light mb-1">{loadingText}</p>
            <p className="text-white/30 text-xs font-mono">Progress: {loadingProgress}%</p>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/5">
            <motion.div className="h-full bg-[#0078d4]" animate={{ width: `${loadingProgress}%` }} transition={{ duration: 0.1 }} />
          </div>
        </div>
      </div>
    );
  }

  const hotspots: { id: string; x: number; y: number; w: number; h: number; onClick: () => void }[] = [];
  hotspots.push(
    { id: "next", x: 70, y: 85, w: 20, h: 9, onClick: handleNext },
    { id: "interact", x: 10, y: 15, w: 80, h: 60, onClick: handleInteract }
  );
  if (["keyboard", "second_keyboard", "computer_name", "setup_type", "account", "pin", "privacy", "backup", "customize", "phone_link", "edge"].includes(step)) {
    hotspots.push({ id: "back", x: 10, y: 85, w: 18, h: 9, onClick: handleBack });
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <AnimatePresence mode="wait">
          <motion.img key={step} src={STEP_BG[step] || STEP_BG.region} alt=""
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-cover" />
        </AnimatePresence>

        {hotspots.map(h => (
          <div key={h.id} onClick={h.onClick}
            className="absolute z-10"
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%`, cursor: "pointer" }} />
        ))}

        {/* Invisible inputs for text fields */}
        {step === "computer_name" && (
          <input value={computerName} onChange={e => setComputerName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
            placeholder="DESKTOP-XXXXXXX" autoFocus
            className="absolute z-10 bg-transparent border-none outline-none cursor-text"
            style={{ left: "20%", top: "38%", width: "60%", height: "8%", color: "#000", fontSize: "15px", fontFamily: "Segoe UI, system-ui, sans-serif" }} />
        )}
        {step === "account" && (
          <>
            <input value={msEmail} onChange={e => setMsEmail(e.target.value)} placeholder="someone@example.com" autoFocus
              className="absolute z-10 bg-transparent border-none outline-none cursor-text"
              style={{ left: "20%", top: "38%", width: "60%", height: "7%", color: "#000", fontSize: "14px", fontFamily: "Segoe UI, system-ui, sans-serif" }} />
            {msEmail && (
              <input value={msPassword} onChange={e => setMsPassword(e.target.value)} type="password" placeholder="Password"
                className="absolute z-10 bg-transparent border-none outline-none cursor-text"
                style={{ left: "20%", top: "48%", width: "60%", height: "7%", color: "#000", fontSize: "14px", fontFamily: "Segoe UI, system-ui, sans-serif" }} />
            )}
          </>
        )}
        {step === "pin" && (
          <>
            <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter PIN" autoFocus maxLength={6}
              className="absolute z-10 bg-transparent border-none outline-none cursor-text"
              style={{ left: "20%", top: "38%", width: "45%", height: "7%", color: "#000", fontSize: "14px", fontFamily: "monospace" }} />
            <input value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Confirm PIN" maxLength={6}
              className="absolute z-10 bg-transparent border-none outline-none cursor-text"
              style={{ left: "20%", top: "48%", width: "45%", height: "7%", color: "#000", fontSize: "14px", fontFamily: "monospace" }} />
          </>
        )}

        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full">
          {steps.filter(s => s !== "loading").map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${i <= currentIdx ? "w-3" : "w-1.5"}`}
              style={{ background: i <= currentIdx ? "#0078d4" : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
