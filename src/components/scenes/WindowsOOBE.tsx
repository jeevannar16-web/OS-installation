import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function WindowsOOBE({
  osName: _osName,
  onComplete,
}: {
  osName: string;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<OobeStep>("region");
  const [region, setRegion] = useState("United States");
  const [keyboard, setKeyboard] = useState("US");
  const [computerName, setComputerName] = useState("DESKTOP-SIM001");
  const [msEmail, setMsEmail] = useState("");
  const [msPassword, setMsPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [privacy, setPrivacy] = useState(
    Object.fromEntries(PRIVACY_TOGGLES.map((t) => [t.id, t.defaultOn]))
  );
  const [customizeSelections, setCustomizeSelections] = useState<string[]>([]);
  const [loadingText, setLoadingText] = useState("Hi");
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (step !== "loading") return;
    const texts = ["Hi", "Getting things ready for you", "This might take a few minutes", "Almost there"];
    let idx = 0;
    const iv = setInterval(() => {
      idx++;
      if (idx < texts.length) setLoadingText(texts[idx]);
    }, 2000);
    return () => clearInterval(iv);
  }, [step]);

  useEffect(() => {
    if (step !== "loading") return;
    const iv = setInterval(() => {
      setLoadingProgress((p) => {
        const next = Math.min(100, p + 1);
        if (next >= 100) {
          clearInterval(iv);
          setTimeout(onComplete, 1000);
        }
        return next;
      });
    }, 80);
    return () => clearInterval(iv);
  }, [step, onComplete]);

  function toggleCustomize(option: string) {
    setCustomizeSelections((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  const go = useCallback((next: OobeStep) => setStep(next), []);

  return (
    <div className="mx-auto w-full max-w-5xl rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10 relative">
      {/* Background screenshot */}
      <div className="relative min-h-[500px] lg:min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.img
            key={step}
            src={STEP_BG[step] || STEP_BG.region}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Interactive overlay */}
        <div className="relative z-10 min-h-[500px] lg:min-h-[600px] flex items-center justify-center p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {/* ── Region ── */}
            {step === "region" && (
              <motion.div key="region" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6">
                <h2 className="text-black text-xl font-light mb-1">Is this the right country or region?</h2>
                <p className="text-gray-500 text-xs mb-4">{region} is the best match based on your location.</p>
                <div className="bg-white border border-gray-200 rounded-lg max-h-[240px] overflow-y-auto mb-5">
                  {REGIONS.map((r) => (
                    <button key={r} onClick={() => setRegion(r)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${region === r ? "bg-[#e8f0fe] text-black font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button className="text-gray-400 text-[11px]">See more regions</button>
                  <button onClick={() => go("keyboard")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Yes</button>
                </div>
              </motion.div>
            )}

            {/* ── Keyboard ── */}
            {step === "keyboard" && (
              <motion.div key="kb" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6">
                <h2 className="text-black text-xl font-light mb-1">Is this the right keyboard layout or input method?</h2>
                <p className="text-gray-500 text-xs mb-4">Selected: {keyboard}</p>
                <div className="bg-white border border-gray-200 rounded-lg max-h-[180px] overflow-y-auto mb-5">
                  {KEYBOARDS.map((k) => (
                    <button key={k} onClick={() => setKeyboard(k)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${keyboard === k ? "bg-[#e8f0fe] text-black font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                      {k}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button onClick={() => go("region")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                  <button onClick={() => go("second_keyboard")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Yes</button>
                </div>
              </motion.div>
            )}

            {/* ── Second Keyboard ── */}
            {step === "second_keyboard" && (
              <motion.div key="skb" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6">
                <h2 className="text-black text-xl font-light mb-1">Want to add a second keyboard layout?</h2>
                <p className="text-gray-500 text-xs mb-6">You can add additional keyboard layouts after setup.</p>
                <div className="flex justify-between">
                  <button onClick={() => go("computer_name")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Skip</button>
                  <button onClick={() => go("computer_name")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Add layout</button>
                </div>
              </motion.div>
            )}

            {/* ── Computer Name ── */}
            {step === "computer_name" && (
              <motion.div key="name" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6">
                <h2 className="text-black text-xl font-light mb-1">Let's name your device</h2>
                <p className="text-gray-500 text-xs mb-4">This is how your device will appear on the network.</p>
                <div className="mb-5">
                  <label className="text-gray-600 text-[11px] mb-1 block font-medium">Device name</label>
                  <input
                    value={computerName}
                    onChange={(e) => setComputerName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                    placeholder="DESKTOP-XXXXXXX"
                    className="w-full bg-white text-black px-3 py-2 text-sm border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
                  />
                  <p className="text-gray-400 text-[10px] mt-1">Your device will restart after this step.</p>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => go("second_keyboard")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                  <button onClick={() => go("setup_type")} disabled={!computerName.trim()}
                    className={`px-8 py-2 text-sm font-semibold rounded-md transition-colors ${computerName.trim() ? "bg-[#0078d4] text-white hover:bg-[#006cbd]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Setup Type ── */}
            {step === "setup_type" && (
              <motion.div key="type" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6">
                <h2 className="text-black text-xl font-light mb-1">How would you like to set up {computerName}?</h2>
                <p className="text-gray-500 text-xs mb-4">Choose the option that best describes your intended use.</p>
                <div className="space-y-2 mb-5">
                  <button onClick={() => go("account")}
                    className="w-full text-left border-2 border-[#0078d4] bg-[#f0f7ff] rounded-lg p-3 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-[#0078d4] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#0078d4]" />
                      </div>
                      <div>
                        <div className="text-black font-medium text-sm">Set up for personal use</div>
                        <div className="text-gray-500 text-xs">For home, school, or personal projects</div>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => go("account")}
                    className="w-full text-left border border-gray-200 hover:border-gray-300 rounded-lg p-3 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      <div>
                        <div className="text-black font-medium text-sm">Set up for work or school</div>
                        <div className="text-gray-500 text-xs">Join an organization or use a work account</div>
                      </div>
                    </div>
                  </button>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => go("computer_name")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                  <button onClick={() => go("account")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Next</button>
                </div>
              </motion.div>
            )}

            {/* ── Account ── */}
            {step === "account" && (
              <motion.div key="acct" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6">
                <h2 className="text-black text-xl font-light mb-1">Let's add your account</h2>
                <p className="text-gray-500 text-xs mb-4">Sign in with your Microsoft account to access your apps, settings, and files.</p>
                <div className="mb-3">
                  <label className="text-gray-600 text-[11px] mb-1 block font-medium">Email, phone, or Skype</label>
                  <input type="email" value={msEmail} onChange={(e) => setMsEmail(e.target.value)}
                    placeholder="someone@example.com" autoFocus
                    className="w-full bg-white text-black px-3 py-2 text-sm border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4]" />
                </div>
                {msEmail && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-3">
                    <label className="text-gray-600 text-[11px] mb-1 block font-medium">Password</label>
                    <input type="password" value={msPassword} onChange={(e) => setMsPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-white text-black px-3 py-2 text-sm border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4]" />
                  </motion.div>
                )}
                <div className="flex justify-between">
                  <button onClick={() => go("setup_type")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                  <button onClick={() => go("pin")} disabled={!msEmail.trim()}
                    className={`px-8 py-2 text-sm font-semibold rounded-md transition-colors ${msEmail.trim() ? "bg-[#0078d4] text-white hover:bg-[#006cbd]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── PIN ── */}
            {step === "pin" && (
              <motion.div key="pin" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6">
                <h2 className="text-black text-xl font-light mb-1">Create a PIN</h2>
                <p className="text-gray-500 text-xs mb-4">A PIN is different from your Microsoft account password. It's used to sign in to your device.</p>
                <div className="mb-3">
                  <label className="text-gray-600 text-[11px] mb-1 block font-medium">New PIN</label>
                  <input type="password" value={pin} maxLength={6}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter PIN (4-6 digits)"
                    className="w-full bg-white text-black px-3 py-2 text-sm border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4] font-mono" />
                </div>
                <div className="mb-4">
                  <label className="text-gray-600 text-[11px] mb-1 block font-medium">Confirm PIN</label>
                  <input type="password" value={pinConfirm} maxLength={6}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Confirm PIN"
                    className="w-full bg-white text-black px-3 py-2 text-sm border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4] font-mono" />
                </div>
                {pin && pinConfirm && pin !== pinConfirm && (
                  <div className="text-red-600 text-xs mb-3">PINs don't match. Please try again.</div>
                )}
                <div className="flex justify-between">
                  <button onClick={() => go("account")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                  <button onClick={() => { if (pin.length >= 4 && pin === pinConfirm) go("privacy"); }}
                    disabled={pin.length < 4 || pin !== pinConfirm}
                    className={`px-8 py-2 text-sm font-semibold rounded-md transition-colors ${pin.length >= 4 && pin === pinConfirm ? "bg-[#0078d4] text-white hover:bg-[#006cbd]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                    OK
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Privacy ── */}
            {step === "privacy" && (
              <motion.div key="priv" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6">
                <h2 className="text-black text-xl font-light mb-1">Choose privacy settings for your device</h2>
                <p className="text-gray-500 text-xs mb-4">Each setting lets you control data sent to Microsoft.</p>
                <div className="space-y-2 mb-5">
                  {PRIVACY_TOGGLES.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                      <div>
                        <div className="text-black text-sm font-medium">{t.label}</div>
                        <div className="text-gray-500 text-[11px]">{t.desc}</div>
                      </div>
                      <button onClick={() => setPrivacy((p) => ({ ...p, [t.id]: !p[t.id] }))}
                        className={`w-10 h-5 rounded-full transition-colors relative ${privacy[t.id] ? "bg-[#0078d4]" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform shadow ${privacy[t.id] ? "left-5 bg-white" : "left-0.5 bg-white"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button onClick={() => go("pin")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                  <button onClick={() => go("backup")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Accept</button>
                </div>
              </motion.div>
            )}

            {/* ── Backup ── */}
            {step === "backup" && (
              <motion.div key="back" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6">
                <h2 className="text-black text-xl font-light mb-1">Welcome back!</h2>
                <p className="text-gray-500 text-xs mb-4">We found a backup from a previous device. Would you like to restore, or set up as new?</p>
                <div className="space-y-2 mb-5">
                  <button onClick={() => go("customize")}
                    className="w-full text-left border border-gray-200 hover:border-gray-300 rounded-lg p-3 transition-all">
                    <div className="text-black font-medium text-sm">Restore from this PC</div>
                    <div className="text-gray-500 text-xs">Restore files, apps, settings from your OneDrive backup</div>
                  </button>
                  <button onClick={() => go("customize")}
                    className="w-full text-left border-2 border-[#0078d4] bg-[#f0f7ff] rounded-lg p-3 transition-all">
                    <div className="text-black font-medium text-sm">Set up as a new PC</div>
                    <div className="text-gray-500 text-xs">Start fresh with a clean installation</div>
                  </button>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => go("privacy")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                  <button onClick={() => go("customize")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Next</button>
                </div>
              </motion.div>
            )}

            {/* ── Customize ── */}
            {step === "customize" && (
              <motion.div key="cust" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6">
                <h2 className="text-black text-xl font-light mb-1">Let's customize your experience</h2>
                <p className="text-gray-500 text-xs mb-4">Select how you plan to use your device.</p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {CUSTOMIZE_OPTIONS.map((option) => (
                    <button key={option} onClick={() => toggleCustomize(option)}
                      className={`text-left border rounded-lg p-2.5 text-sm transition-all ${customizeSelections.includes(option) ? "border-[#0078d4] bg-[#f0f7ff] text-black font-medium" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}>
                      {option}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button onClick={() => go("backup")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                  <div className="flex gap-2">
                    <button onClick={() => go("phone_link")} className="text-gray-500 text-xs hover:text-black">Skip</button>
                    <button onClick={() => go("phone_link")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Accept</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Phone Link ── */}
            {step === "phone_link" && (
              <motion.div key="phone" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6 text-center">
                <h2 className="text-black text-xl font-light mb-1">Use your Android phone from your PC</h2>
                <p className="text-gray-500 text-xs mb-5">Link your phone to access messages, photos, and more.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => go("edge")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Get started</button>
                  <button onClick={() => go("edge")} className="text-gray-500 text-sm hover:text-black">Skip</button>
                </div>
              </motion.div>
            )}

            {/* ── Edge ── */}
            {step === "edge" && (
              <motion.div key="edge" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6 text-center">
                <h2 className="text-black text-xl font-light mb-1">Stay up to date with Microsoft Edge</h2>
                <p className="text-gray-500 text-xs mb-5">Microsoft Edge is built-in and ready to go.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => go("loading")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]">Get started</button>
                  <button onClick={() => go("loading")} className="text-gray-500 text-sm hover:text-black">Not now</button>
                </div>
              </motion.div>
            )}

            {/* ── Loading ── */}
            {step === "loading" && (
              <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full max-w-lg text-center bg-[#0078d4]/90 backdrop-blur-sm rounded-lg shadow-2xl p-8">
                <motion.h2 key={loadingText} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="text-white text-2xl font-light mb-4">{loadingText}</motion.h2>
                <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mx-auto">
                  <motion.div className="h-full bg-white rounded-full" style={{ width: `${loadingProgress}%` }} />
                </div>
                <p className="text-white/40 text-[11px] mt-3">Getting {computerName} ready for the first time. This might take a few minutes.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
