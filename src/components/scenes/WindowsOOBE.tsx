import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "../shared/sounds";

type OobeStep =
  | "region" | "keyboard" | "second_keyboard" | "update_check" | "setup_type"
  | "account" | "pin" | "privacy" | "customize" | "phone_link" | "edge" | "loading";

const REGIONS = ["United States", "United Kingdom", "India", "Canada", "Australia", "Germany", "France", "Japan", "Brazil"];
const KEYBOARDS = ["US", "UK", "US International", "Canadian French", "German", "French", "Japanese", "Korean"];
const WINDOWS_BLUE = "#0078d4";

const LOADING_TEXTS = [
  "Hi, let's get things set up for you",
  "Getting things ready for you",
  "This might take a few minutes",
  "Almost there",
  "Welcome to Windows 11",
];

export default function WindowsOOBE({ onComplete }: { osName: string; onComplete: () => void }) {
  const [step, setStep] = useState<OobeStep>("region");
  const [region, setRegion] = useState("United States");
  const [kbLayout, setKbLayout] = useState("US");
  const [msEmail, setMsEmail] = useState("");
  const [msPassword, setMsPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [privacyToggles, setPrivacyToggles] = useState({
    location: true, diagnostics: true, speech: false, ads: false,
  });
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (step !== "loading") return;
    let idx = 0;
    const iv = setInterval(() => { idx++; if (idx < LOADING_TEXTS.length) setLoadingText(LOADING_TEXTS[idx]); }, 2500);
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
    "region", "keyboard", "second_keyboard", "update_check", "setup_type",
    "account", "pin", "privacy", "customize", "phone_link", "edge", "loading",
  ];
  const currentIdx = steps.indexOf(step);

  const nextMap: Partial<Record<OobeStep, OobeStep>> = {
    region: "keyboard", keyboard: "second_keyboard", second_keyboard: "update_check",
    update_check: "setup_type", setup_type: "account", account: "pin",
    pin: "privacy", privacy: "customize", customize: "phone_link",
    phone_link: "edge", edge: "loading",
  };

  const prevMap: Partial<Record<OobeStep, OobeStep>> = {
    keyboard: "region", second_keyboard: "keyboard", update_check: "second_keyboard",
    setup_type: "update_check", account: "setup_type", pin: "account",
    privacy: "pin", customize: "privacy", phone_link: "customize", edge: "phone_link",
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
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10"
          style={{ background: "linear-gradient(135deg, #0a0a16 0%, #002040 50%, #0a0a16 100%)" }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="mb-8 opacity-20">
              <svg viewBox="0 0 20 20" width="56" height="56"><rect x="0" y="0" width="9" height="9" fill={WINDOWS_BLUE} rx="1.5"/><rect x="11" y="0" width="9" height="9" fill={WINDOWS_BLUE} rx="1.5"/><rect x="0" y="11" width="9" height="9" fill={WINDOWS_BLUE} rx="1.5"/><rect x="11" y="11" width="9" height="9" fill={WINDOWS_BLUE} rx="1.5"/></svg>
            </div>
            <motion.p key={loadingText} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="text-white/70 text-lg font-light text-center">{loadingText}</motion.p>
            <div className="absolute bottom-10 inset-x-10">
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full" style={{ background: WINDOWS_BLUE }}
                  animate={{ width: `${loadingProgress}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visibleSteps = steps.filter(s => s !== "loading");

  return (
    <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10"
        style={{ background: "linear-gradient(135deg, #0a0a16 0%, #002040 50%, #0a0a16 100%)" }}>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {visibleSteps.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${i <= currentIdx ? "w-3" : "w-1.5"}`}
              style={{ background: i <= currentIdx ? WINDOWS_BLUE : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {step === "region" && (
                  <div className="space-y-5 text-center">
                    <WindowsLogoOOBE size="small" />
                    <h2 className="text-white/90 text-xl font-medium">Is this the right country or region?</h2>
                    <p className="text-white/40 text-xs">This helps us give you the right content and language settings.</p>
                    <select value={region} onChange={e => setRegion(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4]">
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button onClick={handleNext}
                      className="w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                      style={{ background: WINDOWS_BLUE }}>Yes</button>
                  </div>
                )}

                {step === "keyboard" && (
                  <div className="space-y-5 text-center">
                    <WindowsLogoOOBE size="small" />
                    <h2 className="text-white/90 text-xl font-medium">Is this the right keyboard layout?</h2>
                    <p className="text-white/40 text-xs">You can change this later in Settings.</p>
                    <select value={kbLayout} onChange={e => setKbLayout(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4]">
                      {KEYBOARDS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <button onClick={handleNext}
                      className="w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                      style={{ background: WINDOWS_BLUE }}>Yes</button>
                  </div>
                )}

                {step === "second_keyboard" && (
                  <div className="space-y-5 text-center">
                    <WindowsLogoOOBE size="small" />
                    <h2 className="text-white/90 text-xl font-medium">Want to add a second keyboard layout?</h2>
                    <p className="text-white/40 text-xs">You can type in multiple languages by adding another layout.</p>
                    <select className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#0078d4]">
                      <option value="">Don't add another layout</option>
                      {KEYBOARDS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <button onClick={handleNext}
                      className="w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                      style={{ background: WINDOWS_BLUE }}>Skip</button>
                  </div>
                )}

                {step === "update_check" && (
                  <div className="space-y-5 text-center">
                    <WindowsLogoOOBE size="small" />
                    <h2 className="text-white/90 text-xl font-medium">Checking for updates</h2>
                    <p className="text-white/40 text-xs">Windows will check for important updates.</p>
                    <div className="flex justify-center gap-1">
                      {[0, 1, 2, 3, 4].map(i => (
                        <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-white/40"
                          animate={{ opacity: [0.2, 0.8, 0.2] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }} />
                      ))}
                    </div>
                    <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3 }}
                      className="h-0.5 bg-white/20 rounded-full mx-auto max-w-[200px] overflow-hidden">
                      <motion.div className="h-full" style={{ background: WINDOWS_BLUE }}
                        animate={{ width: ["0%", "100%"] }} transition={{ duration: 3 }} />
                    </motion.div>
                    <button onClick={handleNext}
                      className="text-xs text-white/40 hover:text-white/70 font-medium">Skip for now</button>
                  </div>
                )}

                {step === "setup_type" && (
                  <div className="space-y-5 text-center">
                    <WindowsLogoOOBE size="small" />
                    <h2 className="text-white/90 text-xl font-medium">How would you like to set up this device?</h2>
                    <div className="space-y-3">
                      <button onClick={handleNext}
                        className="w-full text-left border border-white/20 hover:border-white/40 rounded-xl p-4 transition-all bg-white/5 hover:bg-white/10">
                        <div className="text-sm font-semibold text-white/90">Set up for personal use</div>
                        <div className="text-[10px] text-white/40 mt-1">For home or personal projects</div>
                      </button>
                      <button onClick={handleNext}
                        className="w-full text-left border border-white/20 hover:border-white/40 rounded-xl p-4 transition-all bg-white/5 hover:bg-white/10">
                        <div className="text-sm font-semibold text-white/90">Set up for work or school</div>
                        <div className="text-[10px] text-white/40 mt-1">Managed by an organization</div>
                      </button>
                    </div>
                  </div>
                )}

                {step === "account" && (
                  <div className="space-y-5 text-center">
                    <WindowsLogoOOBE size="small" />
                    <h2 className="text-white/90 text-xl font-medium">Sign in with your Microsoft account</h2>
                    <p className="text-white/40 text-xs">Your account settings and files will sync across devices.</p>
                    <input type="email" value={msEmail} onChange={e => setMsEmail(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0078d4] placeholder-white/30"
                      placeholder="someone@outlook.com" />
                    <input type="password" value={msPassword} onChange={e => setMsPassword(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0078d4] placeholder-white/30"
                      placeholder="Password" />
                    <button onClick={handleNext} disabled={!canAdvance()}
                      className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
                      style={{ background: WINDOWS_BLUE }}>Sign in</button>
                    <button className="text-xs text-white/40 hover:text-white/70 font-medium">Create a Microsoft account</button>
                    <button onClick={handleNext} className="text-[10px] text-white/30 hover:text-white/50">Domain join instead</button>
                  </div>
                )}

                {step === "pin" && (
                  <div className="space-y-5 text-center">
                    <WindowsLogoOOBE size="small" />
                    <h2 className="text-white/90 text-xl font-medium">Set up a PIN</h2>
                    <p className="text-white/40 text-xs">A PIN is a quick and secure way to sign in to your device.</p>
                    <div className="max-w-[200px] mx-auto space-y-3">
                      <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0078d4] placeholder-white/30 text-center tracking-[0.3em]"
                        placeholder="••••" maxLength={6} autoFocus />
                      <input type="password" value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0078d4] placeholder-white/30 text-center tracking-[0.3em]"
                        placeholder="Confirm PIN" maxLength={6} />
                    </div>
                    {pin && pinConfirm && pin !== pinConfirm && (
                      <p className="text-red-400 text-[10px]">Those PINs don't match. Try again.</p>
                    )}
                    {pin && pin === pinConfirm && pin.length >= 4 && (
                      <button onClick={handleNext}
                        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                        style={{ background: WINDOWS_BLUE }}>OK</button>
                    )}
                    <button onClick={handleNext} className="text-xs text-white/40 hover:text-white/70 font-medium">Skip for now</button>
                  </div>
                )}

                {step === "privacy" && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <WindowsLogoOOBE size="small" />
                      <h2 className="text-white/90 text-xl font-medium">Privacy settings for your device</h2>
                      <p className="text-white/40 text-xs mt-1">Choose privacy settings for Microsoft services.</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { id: "location" as const, label: "Location", desc: "Let apps access your location" },
                        { id: "diagnostics" as const, label: "Diagnostic data", desc: "Send optional diagnostic data to Microsoft" },
                        { id: "speech" as const, label: "Speech recognition", desc: "Online speech recognition" },
                        { id: "ads" as const, label: "Tailored experiences", desc: "Let Microsoft show you personalized ads" },
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
                    <button onClick={handleNext}
                      className="w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                      style={{ background: WINDOWS_BLUE }}>Accept</button>
                  </div>
                )}

                {step === "customize" && (
                  <div className="space-y-5 text-center">
                    <WindowsLogoOOBE size="small" />
                    <h2 className="text-white/90 text-xl font-medium">Let's customize your experience</h2>
                    <p className="text-white/40 text-xs">Pick how you plan to use this device.</p>
                    <div className="space-y-2">
                      {[
                        { id: "gaming", label: "Gaming", icon: "🎮" },
                        { id: "productivity", label: "Productivity & development", icon: "💻" },
                        { id: "family", label: "Family & education", icon: "👨‍👩‍👧‍👦" },
                        { id: "entertainment", label: "Entertainment", icon: "🎬" },
                        { id: "creativity", label: "Creativity", icon: "🎨" },
                      ].map(opt => (
                        <label key={opt.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
                          <input type="checkbox" className="accent-[#0078d4] w-4 h-4" />
                          <span className="text-xs text-white/80">{opt.icon} {opt.label}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={handleNext}
                      className="w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                      style={{ background: WINDOWS_BLUE }}>Accept</button>
                    <button onClick={handleNext} className="text-xs text-white/40 hover:text-white/70 font-medium">Skip</button>
                  </div>
                )}

                {step === "phone_link" && (
                  <div className="space-y-5 text-center">
                    <WindowsLogoOOBE size="small" />
                    <h2 className="text-white/90 text-xl font-medium">Link your phone and PC</h2>
                    <p className="text-white/40 text-xs">Use Phone Link to access calls, messages, and photos from your phone.</p>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center gap-3">
                      <span className="text-3xl">📱</span>
                      <p className="text-[10px] text-white/40">Scan the QR code with your phone to get started.</p>
                      <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                        <div className="grid grid-cols-5 gap-0.5">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div key={i} className={`w-2 h-2 ${[0, 1, 4, 5, 7, 9, 10, 14, 15, 19, 20, 21, 24].includes(i) ? "bg-black" : "bg-white"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={handleNext}
                      className="w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                      style={{ background: WINDOWS_BLUE }}>Link phone</button>
                    <button onClick={handleNext} className="text-xs text-white/40 hover:text-white/70 font-medium">Skip</button>
                  </div>
                )}

                {step === "edge" && (
                  <div className="space-y-5 text-center">
                    <div className="flex justify-center text-2xl">🌐</div>
                    <h2 className="text-white/90 text-xl font-medium">Make Microsoft Edge yours</h2>
                    <p className="text-white/40 text-xs">Personalize your browsing experience with extensions, themes, and more.</p>
                    <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
                      <button onClick={handleNext}
                        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                        style={{ background: WINDOWS_BLUE }}>
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
              {!["account", "pin", "privacy", "region", "keyboard", "second_keyboard", "update_check"].includes(step) && (
                <button onClick={handleNext} disabled={!canAdvance()}
                  className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-40"
                  style={{ background: WINDOWS_BLUE }}>
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WindowsLogoOOBE({ size }: { size: "small" | "large" }) {
  const dim = size === "large" ? 64 : 36;
  return (
    <div className="flex justify-center mb-2">
      <svg viewBox="0 0 20 20" width={dim} height={dim}>
        <rect x="0" y="0" width="9" height="9" fill={WINDOWS_BLUE} rx="1.5" />
        <rect x="11" y="0" width="9" height="9" fill={WINDOWS_BLUE} rx="1.5" />
        <rect x="0" y="11" width="9" height="9" fill={WINDOWS_BLUE} rx="1.5" />
        <rect x="11" y="11" width="9" height="9" fill={WINDOWS_BLUE} rx="1.5" />
      </svg>
    </div>
  );
}
