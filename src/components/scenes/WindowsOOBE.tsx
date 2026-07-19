import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";

type OobeStep =
  | "region" | "keyboard" | "second_keyboard" | "computer_name" | "setup_type"
  | "account" | "pin" | "privacy" | "backup" | "customize" | "phone_link" | "edge" | "loading";

const REGIONS = ["United States", "United Kingdom", "India", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "Nepal"];
const KEYBOARDS = ["US", "UK", "US International", "Canadian French", "German", "French", "Japanese", "Korean"];

export default function WindowsOOBE({ onComplete }: { osName: string; onComplete: () => void }) {
  const [step, setStep] = useState<OobeStep>("region");
  const [region, setRegion] = useState("United States");
  const [kbLayout, setKbLayout] = useState("US");
  const [computerName, setComputerName] = useState("DESKTOP-SIM001");
  const [msEmail, setMsEmail] = useState("");
  const [msPassword, setMsPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [privacyToggles, setPrivacyToggles] = useState({
    location: true, diagnostics: true, speech: false, ads: false,
  });
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

  const steps: OobeStep[] = [
    "region", "keyboard", "second_keyboard", "computer_name", "setup_type",
    "account", "pin", "privacy", "backup", "customize", "phone_link", "edge", "loading",
  ];
  const currentIdx = steps.indexOf(step);

  const nextMap: Partial<Record<OobeStep, OobeStep>> = {
    region: "keyboard", keyboard: "second_keyboard", second_keyboard: "computer_name",
    computer_name: "setup_type", setup_type: "account", account: "pin",
    pin: "privacy", privacy: "backup", backup: "customize", customize: "phone_link",
    phone_link: "edge", edge: "loading",
  };

  const prevMap: Partial<Record<OobeStep, OobeStep>> = {
    keyboard: "region", second_keyboard: "keyboard", computer_name: "second_keyboard",
    setup_type: "computer_name", account: "setup_type", pin: "account",
    privacy: "pin", backup: "privacy", customize: "backup", phone_link: "customize", edge: "phone_link",
  };

  function handleNext() {
    playClick();
    const next = nextMap[step];
    if (next) setStep(next);
  }

  function handleBack() {
    const prev = prevMap[step];
    if (prev) { playClick(); setStep(prev); }
  }

  function canAdvance(): boolean {
    switch (step) {
      case "account": return !!msEmail && !!msPassword;
      case "pin": return pin.length >= 4 && pin === pinConfirm;
      default: return true;
    }
  }

  if (step === "loading") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10"
          style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0d1117 40%, #0a0a0f 100%)" }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="grid grid-cols-2 gap-0.5 mb-6">
              {[0, 1, 2, 3].map(i => <div key={i} className="w-3.5 h-3.5 bg-[#0078d4] rounded-sm" />)}
            </div>
            <p className="text-white/80 text-lg font-light mb-1">{loadingText}</p>
            <p className="text-white/30 text-xs font-mono">{loadingProgress}%</p>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/5">
            <motion.div className="h-full bg-[#0078d4]" animate={{ width: `${loadingProgress}%` }} transition={{ duration: 0.1 }} />
          </div>
        </div>
      </div>
    );
  }

  const stepDots = steps.filter(s => s !== "loading");

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10"
        style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0d1117 40%, #0a0a0f 100%)" }}>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {stepDots.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${i <= currentIdx ? "w-3" : "w-1.5"}`}
              style={{ background: i <= currentIdx ? "#0078d4" : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {step === "region" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">Is this the right region?</h2>
                    <p className="text-white/40 text-xs">Region & language:</p>
                    <select value={region} onChange={e => setRegion(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4]">
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {step === "keyboard" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">Keyboard layout</h2>
                    <select value={kbLayout} onChange={e => setKbLayout(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4]">
                      {KEYBOARDS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                )}

                {step === "second_keyboard" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">Second keyboard layout?</h2>
                    <p className="text-white/40 text-xs">You can add another keyboard layout.</p>
                    <select className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4]">
                      <option value="">Skip — don't add another</option>
                      {KEYBOARDS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                )}

                {step === "computer_name" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">Name your PC</h2>
                    <p className="text-white/40 text-xs">Give your PC a name.</p>
                    <input type="text" value={computerName} onChange={e => setComputerName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4] placeholder-white/30"
                      placeholder="DESKTOP-NAME" />
                  </div>
                )}

                {step === "setup_type" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">How would you like to set up?</h2>
                    {[
                      { id: "personal", label: "Set up for personal use", desc: "For home or personal projects" },
                      { id: "org", label: "Set up for work or school", desc: "Managed by an organization" },
                    ].map(opt => (
                      <button key={opt.id} onClick={handleNext}
                        className="w-full text-left border border-white/20 hover:border-white/40 rounded-lg p-3 transition-all bg-white/5 hover:bg-white/10">
                        <div className="text-sm font-medium text-white/90">{opt.label}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                )}

                {step === "account" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">Sign in with Microsoft</h2>
                    <p className="text-white/40 text-xs">Use your Microsoft account to sign in.</p>
                    <input type="email" value={msEmail} onChange={e => setMsEmail(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4] placeholder-white/30"
                      placeholder="someone@outlook.com" />
                    <input type="password" value={msPassword} onChange={e => setMsPassword(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4] placeholder-white/30"
                      placeholder="Password" />
                    <button className="text-xs text-white/40 hover:text-white/70">Create account</button>
                  </div>
                )}

                {step === "pin" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">Create a PIN</h2>
                    <p className="text-white/40 text-xs">Use this PIN to sign in quickly.</p>
                    <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4] placeholder-white/30 text-center tracking-widest"
                      placeholder="••••" maxLength={6} />
                    <input type="password" value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4] placeholder-white/30 text-center tracking-widest"
                      placeholder="Confirm PIN" maxLength={6} />
                    {pin && pinConfirm && pin !== pinConfirm && (
                      <p className="text-red-400 text-[10px]">PINs don't match</p>
                    )}
                  </div>
                )}

                {step === "privacy" && (
                  <div className="space-y-4">
                    <h2 className="text-white/90 text-lg font-medium text-center">Privacy settings</h2>
                    <p className="text-white/40 text-xs text-center mb-2">Choose privacy settings for your device.</p>
                    <div className="space-y-2">
                      {[
                        { id: "location" as const, label: "Location", desc: "Let apps access your location" },
                        { id: "diagnostics" as const, label: "Diagnostic data", desc: "Send diagnostic data to Microsoft" },
                        { id: "speech" as const, label: "Speech recognition", desc: "Online speech recognition" },
                        { id: "ads" as const, label: "Tailored experiences", desc: "Let Microsoft show you ads" },
                      ].map(t => (
                        <label key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                          <div>
                            <div className="text-xs font-medium text-white/80">{t.label}</div>
                            <div className="text-[9px] text-white/40">{t.desc}</div>
                          </div>
                          <div onClick={() => setPrivacyToggles(p => ({...p, [t.id]: !p[t.id]}))}
                            className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${
                              privacyToggles[t.id] ? "bg-[#0078d4]" : "bg-white/20"
                            }`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                              privacyToggles[t.id] ? "left-5" : "left-0.5"
                            }`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {step === "backup" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">Back up your files</h2>
                    <p className="text-white/40 text-xs">Let Windows automatically back up your files to OneDrive.</p>
                    <div className="flex flex-col gap-2">
                      <button onClick={handleNext}
                        className="w-full bg-[#0078d4] text-white rounded-lg py-2.5 text-sm font-semibold hover:brightness-110 transition-all">
                        Set up OneDrive backup
                      </button>
                      <button onClick={handleNext}
                        className="w-full border border-white/20 text-white/70 rounded-lg py-2.5 text-sm hover:bg-white/5 transition-all">
                        Skip for now
                      </button>
                    </div>
                  </div>
                )}

                {step === "customize" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">Customize your experience</h2>
                    <p className="text-white/40 text-xs">Choose your device personalization options.</p>
                    <div className="flex flex-col gap-2">
                      {["Set up for gaming", "Productivity & development", "Family & education"].map(opt => (
                        <button key={opt} onClick={handleNext}
                          className="w-full border border-white/20 hover:border-white/40 rounded-lg p-3 text-left bg-white/5 hover:bg-white/10 transition-all">
                          <div className="text-sm font-medium text-white/90">{opt}</div>
                        </button>
                      ))}
                      <button onClick={handleNext}
                        className="text-xs text-white/40 hover:text-white/70 mt-1">Skip customization</button>
                    </div>
                  </div>
                )}

                {step === "phone_link" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">Link your phone</h2>
                    <p className="text-white/40 text-xs">Use your phone right from your PC with Phone Link.</p>
                    <div className="flex flex-col gap-2">
                      <button onClick={handleNext}
                        className="w-full bg-[#0078d4] text-white rounded-lg py-2.5 text-sm font-semibold hover:brightness-110 transition-all">
                        Link phone
                      </button>
                      <button onClick={handleNext}
                        className="w-full border border-white/20 text-white/70 rounded-lg py-2.5 text-sm hover:bg-white/5 transition-all">
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                {step === "edge" && (
                  <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-0.5 mx-auto mb-4" style={{ width: 28 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-[#0078d4] rounded-sm" />)}
                    </div>
                    <h2 className="text-white/90 text-lg font-medium">Welcome to Microsoft Edge</h2>
                    <p className="text-white/40 text-xs">Your browser, your way. Choose your browser settings.</p>
                    <div className="flex flex-col gap-2">
                      <button onClick={handleNext}
                        className="w-full bg-[#0078d4] text-white rounded-lg py-2.5 text-sm font-semibold hover:brightness-110 transition-all">
                        Accept and continue
                      </button>
                      <button onClick={handleNext}
                        className="w-full border border-white/20 text-white/70 rounded-lg py-2.5 text-sm hover:bg-white/5 transition-all">
                        Skip for now
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <button onClick={handleBack} disabled={!prevMap[step]}
                className="text-xs font-medium px-4 py-1.5 rounded text-white/40 hover:text-white/70 disabled:opacity-30 transition-all">
                Back
              </button>
              <button onClick={handleNext} disabled={!canAdvance()}
                className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-40"
                style={{ background: "#0078d4" }}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
