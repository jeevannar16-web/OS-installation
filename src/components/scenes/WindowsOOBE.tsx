import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";
import SceneShell from "../shared/SceneShell";

type OobeStep =
  | "region" | "keyboard" | "second_keyboard" | "computer_name" | "setup_type"
  | "account" | "pin" | "privacy" | "backup" | "customize" | "phone_link" | "edge" | "loading";

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

const REGIONS = ["United States", "United Kingdom", "India", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "Nepal"];

export default function WindowsOOBE({ onComplete }: { osName: string; onComplete: () => void }) {
  const [step, setStep] = useState<OobeStep>("region");
  const [region, setRegion] = useState("United States");
  const [computerName, setComputerName] = useState("DESKTOP-SIM001");
  const [msEmail, setMsEmail] = useState("");
  const [msPassword, setMsPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
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

  function handleInteract() {
    playClick();
    switch (step) {
      case "region": {
        const idx = REGIONS.indexOf(region);
        setRegion(REGIONS[(idx + 1) % REGIONS.length]);
        break;
      }
      case "keyboard":
      case "second_keyboard":
        handleNext();
        break;
      case "computer_name":
        setComputerName(computerName === "DESKTOP-SIM001" ? "DESKTOP-PC" : "DESKTOP-SIM001");
        break;
      case "account":
        if (!msEmail) setMsEmail("user@outlook.com");
        else if (!msPassword) setMsPassword("pass123");
        else handleNext();
        break;
      case "pin":
        if (!pin) setPin("1234");
        else if (!pinConfirm) setPinConfirm("1234");
        else handleNext();
        break;
      case "backup":
        handleNext();
        break;
      case "customize":
        handleNext();
        break;
      case "phone_link":
        handleNext();
        break;
      case "edge":
        handleNext();
        break;
    }
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
            <p className="text-white/30 text-xs font-mono">Loading: {loadingProgress}%</p>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/5">
            <motion.div className="h-full bg-[#0078d4]" animate={{ width: `${loadingProgress}%` }} transition={{ duration: 0.1 }} />
          </div>
        </div>
      </div>
    );
  }

  const zones = [
    { id: "next", x: 60, y: 78, w: 32, h: 16, onClick: handleNext },
    { id: "interact", x: 5, y: 5, w: 60, h: 68, onClick: handleInteract },
    ...(["keyboard", "second_keyboard", "computer_name", "setup_type", "account", "pin", "privacy", "backup", "customize", "phone_link", "edge"].includes(step)
      ? [{ id: "back", x: 5, y: 78, w: 25, h: 16, onClick: handleBack }] : []),
  ];

  const globalInput = step === "computer_name" ? {
    value: computerName,
    onChange: (v: string) => setComputerName(v.replace(/[^a-zA-Z0-9-]/g, "")),
    placeholder: "Device name",
  } : step === "account" ? {
    value: msEmail,
    onChange: setMsEmail,
    placeholder: "someone@example.com",
  } : step === "pin" ? {
    value: pin,
    onChange: (v: string) => setPin(v.replace(/\D/g, "").slice(0, 6)),
    placeholder: "PIN",
    type: "password",
  } : undefined;

  const stepDots = steps.filter(s => s !== "loading");

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }} className="absolute inset-0">
            <SceneShell src={STEP_BG[step] || STEP_BG.region} alt={step} zones={zones} globalInput={globalInput} />
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full pointer-events-none">
          {stepDots.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${i <= currentIdx ? "w-3" : "w-1.5"}`}
              style={{ background: i <= currentIdx ? "#0078d4" : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
