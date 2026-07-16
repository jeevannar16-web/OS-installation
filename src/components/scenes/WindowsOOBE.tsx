import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type OobeStep =
  | "region"
  | "keyboard"
  | "second_keyboard"
  | "network"
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

const REGIONS = [
  "United States",
  "United Kingdom",
  "India",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Brazil",
  "Nepal",
  "China",
  "South Korea",
];

const KEYBOARDS = [
  "US",
  "UK",
  "US - International",
  "Canadian Multilingual",
  "French",
  "German",
  "Japanese",
  "Korean",
];

const WIFI_NETWORKS = [
  { name: "HomeNetwork_5G", signal: 4, secured: true },
  { name: "HomeNetwork_2.4G", signal: 3, secured: true },
  { name: "Neighbor_Network", signal: 2, secured: true },
  { name: "CoffeeShop_Free", signal: 2, secured: false },
  { name: "Hidden Network", signal: 0, secured: true },
];

const PRIVACY_TOGGLES = [
  { id: "location", label: "Location", desc: "Let apps use your location", defaultOn: true },
  { id: "find", label: "Find my device", desc: "Help find your device if lost", defaultOn: true },
  { id: "inking", label: "Inking & typing", desc: "Improve inking and typing", defaultOn: true },
  { id: "diag", label: "Diagnostics", desc: "Send diagnostic data to Microsoft", defaultOn: true },
  { id: "ads", label: "Advertising ID", desc: "Let apps show personalized ads", defaultOn: false },
  { id: "speech", label: "Online speech recognition", desc: "Use online speech recognition", defaultOn: true },
];

const CUSTOMIZE_OPTIONS = [
  "Gaming",
  "School",
  "Creativity",
  "Business",
  "Family",
  "Entertainment",
  "Software development",
  "Health and fitness",
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
  const [selectedWifi, setSelectedWifi] = useState<string | null>(null);
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

  // Loading dots animation
  useEffect(() => {
    if (step !== "loading") return;
    const dots = ["", ".", "..", "..."];
    let idx = 0;
    const iv = setInterval(() => {
      idx = (idx + 1) % dots.length;
    }, 600);
    return () => clearInterval(iv);
  }, [step]);

  // Loading text progression
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

  // Loading progress
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

  return (
    <div className="mx-auto w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white">
      <AnimatePresence mode="wait">
        {/* ── Region ── */}
        {step === "region" && (
          <motion.div
            key="region"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                Is this the right country or region?
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                {region} is the best match based on your location.
              </p>

              <div className="bg-white border border-gray-200 rounded-lg max-h-[280px] overflow-y-auto mb-6">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegion(r)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      region === r
                        ? "bg-[#e8f0fe] text-black font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <button className="text-gray-400 text-xs">
                  See more regions
                </button>
                <button
                  onClick={() => setStep("keyboard")}
                  className="bg-[#0078d4] text-white px-10 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]"
                >
                  Yes
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Keyboard ── */}
        {step === "keyboard" && (
          <motion.div
            key="keyboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                Is this the right keyboard layout or input method?
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Selected: {keyboard}
              </p>

              <div className="bg-white border border-gray-200 rounded-lg max-h-[200px] overflow-y-auto mb-6">
                {KEYBOARDS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setKeyboard(k)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      keyboard === k
                        ? "bg-[#e8f0fe] text-black font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("region")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep("second_keyboard")}
                  className="bg-[#0078d4] text-white px-10 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]"
                >
                  Yes
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Second Keyboard ── */}
        {step === "second_keyboard" && (
          <motion.div
            key="second_keyboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                Want to add a second keyboard layout?
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                You can add additional keyboard layouts after setup if you need them.
              </p>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("network")}
                  className="bg-[#0078d4] text-white px-10 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep("network")}
                  className="bg-[#0078d4] text-white px-10 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]"
                >
                  Add layout
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Network ── */}
        {step === "network" && (
          <motion.div
            key="network"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                Let's connect you to a network
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                You'll need an internet connection to finish setup.
              </p>

              <div className="space-y-1 mb-6">
                {WIFI_NETWORKS.map((wifi) => (
                  <button
                    key={wifi.name}
                    onClick={() => setSelectedWifi(wifi.name)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                      selectedWifi === wifi.name
                        ? "bg-[#e8f0fe] text-black"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg text-gray-600">
                      {wifi.signal >= 3 ? "▂▄▆█" : wifi.signal >= 2 ? "▂▄▆░" : "▂▄░░"}
                    </span>
                    <span className="flex-1 text-left">{wifi.name}</span>
                    {wifi.secured && (
                      <span className="text-gray-400 text-xs">🔒</span>
                    )}
                    {selectedWifi === wifi.name && (
                      <span className="text-[#0078d4] text-xs font-medium">Connected</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("second_keyboard")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  ← Back
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("computer_name")}
                    className="text-gray-500 text-xs hover:text-black"
                  >
                    I don't have internet
                  </button>
                  <button
                    onClick={() => {
                      if (selectedWifi) setStep("computer_name");
                    }}
                    disabled={!selectedWifi}
                    className={`px-8 py-2 text-sm font-semibold rounded-md transition-colors ${
                      selectedWifi
                        ? "bg-[#0078d4] text-white hover:bg-[#006cbd]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Computer Name ── */}
        {step === "computer_name" && (
          <motion.div
            key="computer_name"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                Let's name your device
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                This is how your device will appear on the network.
              </p>

              <div className="mb-6">
                <label className="text-gray-600 text-xs mb-1 block font-medium">
                  Device name
                </label>
                <input
                  value={computerName}
                  onChange={(e) => setComputerName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                  placeholder="DESKTOP-XXXXXXX"
                  className="w-full bg-white text-black px-4 py-2.5 text-sm border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-[#0078d4]"
                />
                <p className="text-gray-400 text-[10px] mt-1">
                  Your device will restart after this step to apply the name.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("network")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep("setup_type")}
                  disabled={!computerName.trim()}
                  className={`px-8 py-2 text-sm font-semibold rounded-md transition-colors ${
                    computerName.trim()
                      ? "bg-[#0078d4] text-white hover:bg-[#006cbd]"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Setup Type ── */}
        {step === "setup_type" && (
          <motion.div
            key="setup_type"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                How would you like to set up {computerName}?
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Choose the option that best describes your intended use.
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setStep("account")}
                  className="w-full text-left border-2 border-[#0078d4] bg-[#f0f7ff] rounded-lg p-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[#0078d4] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0078d4]" />
                    </div>
                    <div>
                      <div className="text-black font-medium text-sm">
                        Set up for personal use
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        For home, school, or personal projects
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setStep("account")}
                  className="w-full text-left border border-gray-200 bg-white hover:border-gray-300 rounded-lg p-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    <div>
                      <div className="text-black font-medium text-sm">
                        Set up for work or school
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        Join an organization or use a work account
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("computer_name")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep("account")}
                  className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Microsoft Account ── */}
        {step === "account" && (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                Let's add your account
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Sign in with your Microsoft account to access your apps, settings, and files across devices.
              </p>

              <div className="mb-4">
                <label className="text-gray-600 text-xs mb-1 block font-medium">
                  Email, phone, or Skype
                </label>
                <input
                  type="email"
                  value={msEmail}
                  onChange={(e) => setMsEmail(e.target.value)}
                  placeholder="someone@example.com"
                  className="w-full bg-white text-black px-4 py-2.5 text-sm border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-[#0078d4]"
                  autoFocus
                />
              </div>

              {msEmail && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4"
                >
                  <label className="text-gray-600 text-xs mb-1 block font-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    value={msPassword}
                    onChange={(e) => setMsPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-white text-black px-4 py-2.5 text-sm border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-[#0078d4]"
                  />
                </motion.div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("setup_type")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep("pin")}
                  disabled={!msEmail.trim()}
                  className={`px-8 py-2 text-sm font-semibold rounded-md transition-colors ${
                    msEmail.trim()
                      ? "bg-[#0078d4] text-white hover:bg-[#006cbd]"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PIN ── */}
        {step === "pin" && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                Create a PIN
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                A PIN is different from your Microsoft account password. It's used to sign in to your device, apps, and services.
              </p>

              <div className="mb-4">
                <label className="text-gray-600 text-xs mb-1 block font-medium">
                  New PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter PIN (4-6 digits)"
                  className="w-full bg-white text-black px-4 py-2.5 text-sm border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-[#0078d4] font-mono"
                  maxLength={6}
                />
              </div>

              <div className="mb-6">
                <label className="text-gray-600 text-xs mb-1 block font-medium">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Confirm PIN"
                  className="w-full bg-white text-black px-4 py-2.5 text-sm border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-[#0078d4] font-mono"
                  maxLength={6}
                />
              </div>

              {pin && pinConfirm && pin !== pinConfirm && (
                <div className="text-red-600 text-xs mb-4">
                  PINs don't match. Please try again.
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("account")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (pin.length >= 4 && pin === pinConfirm) setStep("privacy");
                  }}
                  disabled={pin.length < 4 || pin !== pinConfirm}
                  className={`px-8 py-2 text-sm font-semibold rounded-md transition-colors ${
                    pin.length >= 4 && pin === pinConfirm
                      ? "bg-[#0078d4] text-white hover:bg-[#006cbd]"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Privacy ── */}
        {step === "privacy" && (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                Choose privacy settings for your device
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Each setting lets you control data sent to Microsoft.
              </p>

              <div className="space-y-3 mb-6">
                {PRIVACY_TOGGLES.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <div>
                      <div className="text-black text-sm font-medium">
                        {t.label}
                      </div>
                      <div className="text-gray-500 text-xs">{t.desc}</div>
                    </div>
                    <button
                      onClick={() =>
                        setPrivacy((p) => ({ ...p, [t.id]: !p[t.id] }))
                      }
                      className={`w-11 h-5 rounded-full transition-colors relative ${
                        privacy[t.id] ? "bg-[#0078d4]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform shadow ${
                          privacy[t.id]
                            ? "left-6 bg-white"
                            : "left-0.5 bg-white"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("pin")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep("backup")}
                  className="bg-[#0078d4] text-white px-10 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]"
                >
                  Accept
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Backup/Restore ── */}
        {step === "backup" && (
          <motion.div
            key="backup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                Welcome back!
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                We found a backup from a previous device. Would you like to restore from it, or set up as a new PC?
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setStep("customize")}
                  className="w-full text-left border border-gray-200 bg-white hover:border-gray-300 rounded-lg p-4 transition-all"
                >
                  <div className="text-black font-medium text-sm">
                    Restore from this PC
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    Restore your files, apps, settings, and credentials from your OneDrive backup
                  </div>
                </button>

                <button
                  onClick={() => setStep("customize")}
                  className="w-full text-left border-2 border-[#0078d4] bg-[#f0f7ff] rounded-lg p-4 transition-all"
                >
                  <div className="text-black font-medium text-sm">
                    Set up as a new PC
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    Start fresh with a clean installation
                  </div>
                </button>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("privacy")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep("customize")}
                  className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Customize Experience ── */}
        {step === "customize" && (
          <motion.div
            key="customize"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg">
              <h1 className="text-black text-2xl font-light mb-2">
                Let's customize your experience
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Select how you plan to use your device so we can suggest tools and services.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {CUSTOMIZE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggleCustomize(option)}
                    className={`text-left border rounded-lg p-3 text-sm transition-all ${
                      customizeSelections.includes(option)
                        ? "border-[#0078d4] bg-[#f0f7ff] text-black font-medium"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep("backup")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  ← Back
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("phone_link")}
                    className="text-gray-500 text-xs hover:text-black"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => setStep("phone_link")}
                    className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Phone Link ── */}
        {step === "phone_link" && (
          <motion.div
            key="phone_link"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg text-center">
              <div className="text-6xl mb-4">📱</div>
              <h1 className="text-black text-2xl font-light mb-2">
                Use your Android phone from your PC
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Link your phone to your PC to access messages, photos, and more — right from your computer.
              </p>

              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={() => setStep("edge")}
                  className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]"
                >
                  Get started
                </button>
                <button
                  onClick={() => setStep("edge")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Edge Browser ── */}
        {step === "edge" && (
          <motion.div
            key="edge"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[500px] flex items-center justify-center p-8"
          >
            <div className="w-full max-w-lg text-center">
              <div className="text-6xl mb-4">🌐</div>
              <h1 className="text-black text-2xl font-light mb-2">
                Stay up to date with Microsoft Edge
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Microsoft Edge is built-in and ready to go. It's fast, secure, and works best with Windows.
              </p>

              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={() => setStep("loading")}
                  className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd]"
                >
                  Get started
                </button>
                <button
                  onClick={() => setStep("loading")}
                  className="text-gray-500 text-sm hover:text-black"
                >
                  Not now
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Final Loading ── */}
        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-[500px] flex flex-col items-center justify-center p-8"
            style={{
              background: "linear-gradient(180deg, #0078d4 0%, #005a9e 100%)",
            }}
          >
            <motion.h1
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-2xl font-light mb-4"
            >
              {loadingText}
            </motion.h1>

            <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            <p className="text-white/40 text-xs mt-4">
              Getting {computerName} ready for the first time. This might take a
              few minutes.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
