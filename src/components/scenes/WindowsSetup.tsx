import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  "English (United States)",
  "English (United Kingdom)",
  "Español (Estados Unidos)",
  "Français (France)",
  "Deutsch (Deutschland)",
  "Português (Brasil)",
  "日本語 (日本)",
  "中文(简体)",
  "한국어",
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

const EDITIONS = [
  { name: "Windows 11 Home", desc: "For personal and home use" },
  { name: "Windows 11 Pro", desc: "For professionals and small businesses" },
  { name: "Windows 11 Education", desc: "For students and educators" },
  { name: "Windows 11 Enterprise", desc: "For large organizations" },
];

interface PartitionEntry {
  id: string;
  label: string;
  size: string;
  type: string;
}

const INITIAL_PARTITIONS: PartitionEntry[] = [
  { id: "p1", label: "Drive 0 Partition 1", size: "100.0 MB", type: "System" },
  { id: "p2", label: "Drive 0 Partition 2", size: "16.0 GB", type: "MSR" },
  { id: "p3", label: "Drive 0 Partition 3", size: "237.8 GB", type: "Primary" },
  { id: "p4", label: "Drive 0 Partition 4", size: "512.0 MB", type: "Recovery" },
];

function WindowsLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      <div className="w-4 h-4 bg-[#0078d4]" />
      <div className="w-4 h-4 bg-[#0078d4]" />
      <div className="w-4 h-4 bg-[#0078d4]" />
      <div className="w-4 h-4 bg-[#0078d4]" />
    </div>
  );
}

export default function WindowsSetup({
  config,
  onComplete,
}: {
  config: OSConfig;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<SetupStep>("language");
  const [lang, setLang] = useState("English (United States)");
  const [keyboard, setKeyboard] = useState("US");
  const [keyInput, setKeyInput] = useState(["", "", "", "", ""]);
  const [acceptedLicense, setAcceptedLicense] = useState(false);
  const [agreedDelete, setAgreedDelete] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState(0);
  const [partitions, setPartitions] = useState(INITIAL_PARTITIONS);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState(0);
  const [installPhase, setInstallPhase] = useState("Copying files");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const go = useCallback((next: SetupStep) => setStep(next), []);

  function handleKeyInput(idx: number, val: string) {
    const clean = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5);
    const copy = [...keyInput];
    copy[idx] = clean;
    setKeyInput(copy);
  }

  function deletePartition() {
    if (!selectedPart) return;
    setConfirmDelete(true);
  }

  function confirmDeletePartition() {
    if (!selectedPart) return;
    setPartitions((p) => p.filter((x) => x.id !== selectedPart));
    setSelectedPart(null);
    setConfirmDelete(false);
  }

  function startInstall() {
    go("installing");
    const iv = setInterval(() => {
      setInstallProgress((p) => {
        const next = Math.min(100, p + 1);
        if (next < 25) setInstallPhase("Copying Windows files");
        else if (next < 50) setInstallPhase("Getting files ready for installation");
        else if (next < 75) setInstallPhase("Installing features");
        else if (next < 90) setInstallPhase("Installing updates");
        else setInstallPhase("Finishing up");
        if (next >= 100) {
          clearInterval(iv);
          setTimeout(onComplete, 1500);
        }
        return next;
      });
    }, 120);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10 relative">
        {/* Background screenshot */}
        <div className="relative min-h-[500px] lg:min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.img
              key={step}
              src={STEP_BG[step]}
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
              {/* ── Language ── */}
              {step === "language" && (
                <motion.div
                  key="lang"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6"
                >
                  <WindowsLogo className="mb-6" />
                  <h2 className="text-black text-xl font-light mb-1">Select language settings</h2>
                  <p className="text-gray-500 text-xs mb-5">Choose the language to install, time and currency format, and keyboard input method.</p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-gray-600 text-[11px] mb-1 block font-medium">Language to install</label>
                      <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className="w-full bg-white text-black px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
                      >
                        {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-600 text-[11px] mb-1 block font-medium">Time and currency format</label>
                      <select className="w-full bg-white text-black px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4]">
                        <option>{lang}</option>
                        <option>English (United Kingdom)</option>
                        <option>Deutsch (Deutschland)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button onClick={() => go("keyboard")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors">
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Keyboard ── */}
              {step === "keyboard" && (
                <motion.div
                  key="kb"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6"
                >
                  <WindowsLogo className="mb-6" />
                  <h2 className="text-black text-xl font-light mb-1">Select keyboard settings</h2>
                  <p className="text-gray-500 text-xs mb-5">Choose the keyboard layout or input method.</p>

                  <select
                    value={keyboard}
                    onChange={(e) => setKeyboard(e.target.value)}
                    className="w-full bg-white text-black px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4] mb-6"
                  >
                    {KEYBOARDS.map((k) => <option key={k}>{k}</option>)}
                  </select>

                  <div className="flex justify-between">
                    <button onClick={() => go("language")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                    <button onClick={() => go("setup_option")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors">Next</button>
                  </div>
                </motion.div>
              )}

              {/* ── Setup Option (24H2) ── */}
              {step === "setup_option" && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6"
                >
                  <WindowsLogo className="mb-6" />
                  <h2 className="text-black text-xl font-light mb-1">Select setup option</h2>
                  <p className="text-gray-500 text-xs mb-5">Choose the option that best suits your needs.</p>

                  <div className="space-y-2 mb-4">
                    <button
                      onClick={() => setAgreedDelete(true)}
                      className={`w-full text-left border-2 rounded-lg p-3 transition-all ${
                        agreedDelete ? "border-[#0078d4] bg-[#f0f7ff]" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${agreedDelete ? "border-[#0078d4]" : "border-gray-300"}`}>
                          {agreedDelete && <div className="w-2 h-2 rounded-full bg-[#0078d4]" />}
                        </div>
                        <div>
                          <div className="text-black font-medium text-sm">Install {config.branding.name}</div>
                          <div className="text-gray-500 text-xs">Install a fresh copy of the operating system</div>
                        </div>
                      </div>
                    </button>

                    <button className="w-full text-left border border-gray-200 hover:border-gray-300 rounded-lg p-3 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        <div>
                          <div className="text-black font-medium text-sm">Repair my computer</div>
                          <div className="text-gray-500 text-xs">Access advanced recovery tools</div>
                        </div>
                      </div>
                    </button>
                  </div>

                  <label className="flex items-start gap-2 text-black text-xs cursor-pointer mb-5">
                    <input type="checkbox" checked={agreedDelete} onChange={(e) => setAgreedDelete(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#0078d4]" />
                    <span>I agree that everything will be deleted including files, apps, and settings</span>
                  </label>

                  <div className="flex justify-between">
                    <button onClick={() => go("keyboard")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                    <button onClick={() => go("product_key")} disabled={!agreedDelete}
                      className={`px-8 py-2 text-sm font-semibold rounded-md transition-colors ${agreedDelete ? "bg-[#0078d4] text-white hover:bg-[#006cbd]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Product Key ── */}
              {step === "product_key" && (
                <motion.div
                  key="pk"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6"
                >
                  <WindowsLogo className="mb-6" />
                  <h2 className="text-black text-xl font-light mb-1">Product key</h2>
                  <p className="text-gray-500 text-xs mb-5">Enter the product key found on the box or inside the Windows 11 packaging.</p>

                  <div className="flex gap-2 justify-center mb-3">
                    {keyInput.map((val, i) => (
                      <input
                        key={i}
                        value={val}
                        onChange={(e) => handleKeyInput(i, e.target.value)}
                        maxLength={5}
                        placeholder="XXXXX"
                        className="w-[72px] bg-white text-black text-center text-sm font-mono px-2 py-2 border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
                      />
                    ))}
                  </div>

                  <div className="text-center text-gray-400 text-[10px] mb-6">
                    {keyInput.join("-").toUpperCase() || "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"}
                  </div>

                  <div className="flex justify-between items-center">
                    <button onClick={() => go("edition")} className="text-[#0078d4] text-sm hover:underline">I don't have a product key</button>
                    <button onClick={() => go("edition")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors">Next</button>
                  </div>
                </motion.div>
              )}

              {/* ── Edition ── */}
              {step === "edition" && (
                <motion.div
                  key="ed"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="w-full max-w-lg bg-white rounded-lg shadow-2xl p-6"
                >
                  <WindowsLogo className="mb-6" />
                  <h2 className="text-black text-xl font-light mb-1">Select the operating system you want to install</h2>
                  <p className="text-gray-500 text-xs mb-4">Choose the edition that matches your license.</p>

                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
                    <div className="grid grid-cols-2 gap-px bg-gray-200 text-[10px] font-medium text-gray-600">
                      <div className="bg-gray-50 px-3 py-1.5">Operating system</div>
                      <div className="bg-gray-50 px-3 py-1.5">Description</div>
                    </div>
                    {EDITIONS.map((ed, i) => (
                      <button
                        key={ed.name}
                        onClick={() => setSelectedEdition(i)}
                        className={`w-full grid grid-cols-2 gap-px text-left text-xs transition-colors ${
                          selectedEdition === i ? "bg-[#e8f0fe]" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="px-3 py-2.5 font-medium text-black">{ed.name}</div>
                        <div className="px-3 py-2.5 text-gray-500">{ed.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => go("product_key")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                    <button onClick={() => go("license")} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors">Next</button>
                  </div>
                </motion.div>
              )}

              {/* ── License ── */}
              {step === "license" && (
                <motion.div
                  key="lic"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-6"
                >
                  <WindowsLogo className="mb-6" />
                  <h2 className="text-black text-xl font-light mb-1">Notices and license terms</h2>
                  <p className="text-gray-500 text-xs mb-3">Please read the following license terms carefully.</p>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-[200px] overflow-y-auto text-[10px] text-gray-700 leading-relaxed mb-4">
                    <p className="font-bold mb-1">MICROSOFT SOFTWARE LICENSE TERMS</p>
                    <p className="mb-1">{EDITIONS[selectedEdition].name.toUpperCase()}</p>
                    <p className="mb-1">These license terms are an agreement between you and Microsoft Corporation (or one of its affiliates). They apply to the software named above and any Microsoft services or software updates.</p>
                    <p className="mb-1"><span className="font-bold">INSTALLATION AND USE RIGHTS.</span> You may install and run one instance of the software on your device.</p>
                    <p className="mb-1"><span className="font-bold">SCOPE OF LICENSE.</span> The software is licensed, not sold. This agreement only gives you some rights to use the software.</p>
                    <p className="mb-1"><span className="font-bold">AUTOMATIC UPDATES.</span> The software periodically checks for system and application updates, and downloads and installs them.</p>
                  </div>

                  <label className="flex items-center gap-2 text-black text-xs cursor-pointer mb-5">
                    <input type="checkbox" checked={acceptedLicense} onChange={(e) => setAcceptedLicense(e.target.checked)} className="w-4 h-4 accent-[#0078d4]" />
                    I accept the license terms
                  </label>

                  <div className="flex justify-between">
                    <button onClick={() => go("edition")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                    <button onClick={() => go("partition")} disabled={!acceptedLicense}
                      className={`px-8 py-2 text-sm font-semibold rounded-md transition-colors ${acceptedLicense ? "bg-[#0078d4] text-white hover:bg-[#006cbd]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Partition ── */}
              {step === "partition" && (
                <motion.div
                  key="part"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-6"
                >
                  <WindowsLogo className="mb-5" />
                  <h2 className="text-black text-xl font-light mb-1">Select location to install {config.branding.name}</h2>
                  <p className="text-gray-500 text-xs mb-3">Select a partition or delete to create unallocated space.</p>

                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                    <div className="grid grid-cols-3 gap-px bg-gray-200 text-[10px] font-medium text-gray-600">
                      <div className="bg-gray-50 px-3 py-1.5">Name</div>
                      <div className="bg-gray-50 px-3 py-1.5">Total size</div>
                      <div className="bg-gray-50 px-3 py-1.5">Type</div>
                    </div>
                    {partitions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPart(p.id === selectedPart ? null : p.id)}
                        className={`w-full grid grid-cols-3 gap-px text-left text-[11px] transition-colors ${
                          selectedPart === p.id ? "bg-[#fff0f0]" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="px-3 py-2 text-black">{p.label}</div>
                        <div className="px-3 py-2 text-gray-600">{p.size}</div>
                        <div className="px-3 py-2 text-gray-600">{p.type}</div>
                      </button>
                    ))}
                    {partitions.length === 0 && (
                      <div className="bg-white px-3 py-3 text-center text-gray-400 text-xs">
                        Drive 0 — 254.4 GB Unallocated Space
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mb-5">
                    <button onClick={deletePartition} disabled={!selectedPart}
                      className={`px-3 py-1.5 text-[11px] border rounded transition-colors ${selectedPart ? "border-gray-300 text-black hover:bg-gray-100" : "border-gray-200 text-gray-300 cursor-not-allowed"}`}>
                      Delete
                    </button>
                    <button className="px-3 py-1.5 text-[11px] border border-gray-300 text-black rounded hover:bg-gray-100">Format</button>
                    <button className="px-3 py-1.5 text-[11px] border border-gray-300 text-black rounded hover:bg-gray-100">New</button>
                    <button className="px-3 py-1.5 text-[11px] border border-gray-300 text-black rounded hover:bg-gray-100">Extend</button>
                  </div>

                  {/* Delete confirmation dialog */}
                  {confirmDelete && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                      <span className="text-red-700 text-xs">Are you sure you want to delete this partition? All data will be lost.</span>
                      <div className="flex gap-2 shrink-0 ml-3">
                        <button onClick={() => setConfirmDelete(false)} className="px-3 py-1 text-[11px] border border-gray-300 rounded hover:bg-gray-100">Cancel</button>
                        <button onClick={confirmDeletePartition} className="px-3 py-1 text-[11px] bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button onClick={() => go("license")} className="text-gray-500 text-sm hover:text-black">← Back</button>
                    <button onClick={startInstall} className="bg-[#0078d4] text-white px-8 py-2 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors">Install</button>
                  </div>
                </motion.div>
              )}

              {/* ── Installing ── */}
              {step === "installing" && (
                <motion.div
                  key="install"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full max-w-lg bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 text-center"
                >
                  <WindowsLogo className="mb-6 mx-auto justify-center" />
                  <h2 className="text-black text-xl font-light mb-1">Installing {config.branding.name}</h2>
                  <p className="text-gray-500 text-sm mb-6">{installPhase}… {installProgress}%</p>

                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <motion.div
                      className="h-full bg-[#0078d4] rounded-full"
                      style={{ width: `${installProgress}%` }}
                    />
                  </div>

                  <p className="text-gray-400 text-[11px]">
                    Your PC will restart several times. Sit back and relax.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
