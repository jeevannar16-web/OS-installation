import { useState } from "react";
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
  | "ready"
  | "installing";

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
  { name: "Windows 11 Home", description: "For personal and home use" },
  { name: "Windows 11 Pro", description: "For professionals and small businesses" },
  { name: "Windows 11 Education", description: "For students and educators" },
  { name: "Windows 11 Enterprise", description: "For large organizations" },
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

  function formatKey(groups: string[]) {
    return groups.join("-").toUpperCase();
  }

  function handleKeyInput(idx: number, val: string) {
    const clean = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5);
    const copy = [...keyInput];
    copy[idx] = clean;
    setKeyInput(copy);
  }

  function deletePartition() {
    if (!selectedPart) return;
    setPartitions((p) => p.filter((x) => x.id !== selectedPart));
    setSelectedPart(null);
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10">
        {/* New Windows 11 24H2 white background */}
        <div className="bg-white min-h-[500px] lg:min-h-[600px] relative">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Language ── */}
            {step === "language" && (
              <motion.div
                key="language"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex items-center justify-center p-8"
              >
                <div className="w-full max-w-lg">
                  {/* Windows logo - blue */}
                  <div className="flex gap-0.5 mb-8">
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                  </div>

                  <h1 className="text-black text-2xl font-light mb-2">
                    Select language settings
                  </h1>
                  <p className="text-gray-500 text-sm mb-6">
                    Choose the language to install, time and currency format, and keyboard input method.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-600 text-xs mb-1 block font-medium">
                        Language to install
                      </label>
                      <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className="w-full bg-white text-black px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-[#0078d4]"
                      >
                        {LANGUAGES.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-600 text-xs mb-1 block font-medium">
                        Time and currency format
                      </label>
                      <select
                        className="w-full bg-white text-black px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-[#0078d4]"
                      >
                        <option>{lang}</option>
                        <option>English (United Kingdom)</option>
                        <option>Deutsch (Deutschland)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={() => setStep("keyboard")}
                      className="bg-[#0078d4] text-white px-10 py-2.5 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors"
                    >
                      Next
                    </button>
                  </div>

                  <div className="mt-4 text-gray-400 text-[10px] text-center">
                    © Microsoft Corporation. All rights reserved.
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Keyboard ── */}
            {step === "keyboard" && (
              <motion.div
                key="keyboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex items-center justify-center p-8"
              >
                <div className="w-full max-w-lg">
                  <div className="flex gap-0.5 mb-8">
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                  </div>

                  <h1 className="text-black text-2xl font-light mb-2">
                    Select keyboard settings
                  </h1>
                  <p className="text-gray-500 text-sm mb-6">
                    Choose the keyboard layout or input method.
                  </p>

                  <div>
                    <label className="text-gray-600 text-xs mb-1 block font-medium">
                      Keyboard or input method
                    </label>
                    <select
                      value={keyboard}
                      onChange={(e) => setKeyboard(e.target.value)}
                      className="w-full bg-white text-black px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-[#0078d4]"
                    >
                      {KEYBOARDS.map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={() => setStep("language")}
                      className="text-gray-500 text-sm hover:text-black transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep("setup_option")}
                      className="bg-[#0078d4] text-white px-10 py-2.5 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Setup Option (new in 24H2) ── */}
            {step === "setup_option" && (
              <motion.div
                key="setup_option"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex items-center justify-center p-8"
              >
                <div className="w-full max-w-lg">
                  <div className="flex gap-0.5 mb-8">
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                  </div>

                  <h1 className="text-black text-2xl font-light mb-2">
                    Select setup option
                  </h1>
                  <p className="text-gray-500 text-sm mb-6">
                    Choose the option that best suits your needs.
                  </p>

                  <div className="space-y-3 mb-6">
                    <button
                      onClick={() => setStep("product_key")}
                      className={`w-full text-left border-2 rounded-lg p-4 transition-all ${
                        agreedDelete
                          ? "border-[#0078d4] bg-[#f0f7ff]"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-[#0078d4] flex items-center justify-center">
                          {agreedDelete && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#0078d4]" />
                          )}
                        </div>
                        <div>
                          <div className="text-black font-medium text-sm">
                            Install {config.branding.name}
                          </div>
                          <div className="text-gray-500 text-xs mt-0.5">
                            Install a fresh copy of the operating system
                          </div>
                        </div>
                      </div>
                    </button>

                    <button className="w-full text-left border border-gray-200 bg-white hover:border-gray-300 rounded-lg p-4 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        <div>
                          <div className="text-black font-medium text-sm">
                            Repair my computer
                          </div>
                          <div className="text-gray-500 text-xs mt-0.5">
                            Access advanced recovery tools
                          </div>
                        </div>
                      </div>
                    </button>

                    <button className="w-full text-left border border-gray-200 bg-white hover:border-gray-300 rounded-lg p-4 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        <div>
                          <div className="text-black font-medium text-sm">
                            Launch the legacy experience
                          </div>
                          <div className="text-gray-500 text-xs mt-0.5">
                            Use the classic Windows Setup wizard
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  <label className="flex items-start gap-2 text-black text-xs cursor-pointer mb-6">
                    <input
                      type="checkbox"
                      checked={agreedDelete}
                      onChange={(e) => setAgreedDelete(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-[#0078d4]"
                    />
                    <span>
                      I agree that everything will be deleted including files, apps, and settings
                    </span>
                  </label>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep("keyboard")}
                      className="text-gray-500 text-sm hover:text-black transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep("product_key")}
                      disabled={!agreedDelete}
                      className={`px-8 py-2.5 text-sm font-semibold rounded-md transition-colors ${
                        agreedDelete
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

            {/* ── Step 4: Product Key ── */}
            {step === "product_key" && (
              <motion.div
                key="product_key"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex items-center justify-center p-8"
              >
                <div className="w-full max-w-lg">
                  <div className="flex gap-0.5 mb-8">
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                  </div>

                  <h1 className="text-black text-2xl font-light mb-2">
                    Product key
                  </h1>
                  <p className="text-gray-500 text-sm mb-6">
                    Enter the product key found on the box or inside the {config.branding.name} packaging,
                    or in the email sent by Microsoft or retailer.
                  </p>

                  <div className="flex gap-2 justify-center mb-4">
                    {keyInput.map((val, i) => (
                      <input
                        key={i}
                        value={val}
                        onChange={(e) => handleKeyInput(i, e.target.value)}
                        maxLength={5}
                        placeholder="XXXXX"
                        className="w-20 bg-white text-black text-center text-sm font-mono px-2 py-2.5 border border-gray-300 rounded-md placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-[#0078d4]"
                      />
                    ))}
                  </div>

                  <div className="text-center text-gray-400 text-[10px] mb-8">
                    {formatKey(keyInput)}
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setStep("edition")}
                      className="text-[#0078d4] text-sm hover:underline transition-colors"
                    >
                      I don't have a product key
                    </button>
                    <button
                      onClick={() => setStep("edition")}
                      className="bg-[#0078d4] text-white px-8 py-2.5 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 5: Edition Selection ── */}
            {step === "edition" && (
              <motion.div
                key="edition"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex items-center justify-center p-8"
              >
                <div className="w-full max-w-lg">
                  <div className="flex gap-0.5 mb-8">
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                  </div>

                  <h1 className="text-black text-2xl font-light mb-2">
                    Select the operating system you want to install
                  </h1>
                  <p className="text-gray-500 text-sm mb-6">
                    Choose the edition that matches your license.
                  </p>

                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                    <div className="grid grid-cols-2 gap-px bg-gray-200 text-xs font-medium text-gray-600">
                      <div className="bg-gray-50 px-4 py-2">Operating system</div>
                      <div className="bg-gray-50 px-4 py-2">Description</div>
                    </div>
                    {EDITIONS.map((ed, i) => (
                      <button
                        key={ed.name}
                        onClick={() => setSelectedEdition(i)}
                        className={`w-full grid grid-cols-2 gap-px text-left text-sm transition-colors ${
                          selectedEdition === i
                            ? "bg-[#e8f0fe]"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="px-4 py-3 font-medium text-black">{ed.name}</div>
                        <div className="px-4 py-3 text-gray-500">{ed.description}</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep("product_key")}
                      className="text-gray-500 text-sm hover:text-black transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep("license")}
                      className="bg-[#0078d4] text-white px-8 py-2.5 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 6: License Terms ── */}
            {step === "license" && (
              <motion.div
                key="license"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex items-center justify-center p-8"
              >
                <div className="w-full max-w-2xl">
                  <div className="flex gap-0.5 mb-8">
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                  </div>

                  <h1 className="text-black text-2xl font-light mb-2">
                    Notices and license terms
                  </h1>
                  <p className="text-gray-500 text-sm mb-4">
                    Please read the following license terms carefully.
                  </p>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-[250px] overflow-y-auto text-[11px] text-gray-700 leading-relaxed mb-4">
                    <p className="font-bold mb-2">
                      MICROSOFT SOFTWARE LICENSE TERMS
                    </p>
                    <p className="mb-2">
                      {EDITIONS[selectedEdition].name.toUpperCase()}
                    </p>
                    <p className="mb-2">
                      These license terms are an agreement between you and
                      Microsoft Corporation (or one of its affiliates). They apply
                      to the software named above and any Microsoft services or
                      software updates.
                    </p>
                    <p className="mb-2">
                      <span className="font-bold">INSTALLATION AND USE RIGHTS.</span>{" "}
                      You may install and run one instance of the software on your
                      device. You may use the software on up to 10 virtual machines.
                    </p>
                    <p className="mb-2">
                      <span className="font-bold">SCOPE OF LICENSE.</span> The
                      software is licensed, not sold. This agreement only gives you
                      some rights to use the software.
                    </p>
                    <p className="mb-2">
                      <span className="font-bold">AUTOMATIC UPDATES.</span> The
                      software periodically checks for system and application
                      updates, and downloads and installs them.
                    </p>
                    <p className="text-[10px] text-gray-400 mt-4">
                      Last updated: September 2024. This is a simulation.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-black text-sm cursor-pointer mb-6">
                    <input
                      type="checkbox"
                      checked={acceptedLicense}
                      onChange={(e) => setAcceptedLicense(e.target.checked)}
                      className="w-4 h-4 accent-[#0078d4]"
                    />
                    I accept the license terms
                  </label>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep("edition")}
                      className="text-gray-500 text-sm hover:text-black transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep("partition")}
                      disabled={!acceptedLicense}
                      className={`px-8 py-2.5 text-sm font-semibold rounded-md transition-colors ${
                        acceptedLicense
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

            {/* ── Step 7: Partition Management ── */}
            {step === "partition" && (
              <motion.div
                key="partition"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex items-center justify-center p-8"
              >
                <div className="w-full max-w-2xl">
                  <div className="flex gap-0.5 mb-6">
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                  </div>

                  <h1 className="text-black text-2xl font-light mb-2">
                    Select location to install {config.branding.name}
                  </h1>
                  <p className="text-gray-500 text-sm mb-4">
                    Select a partition to install the operating system, or delete a partition to create unallocated space.
                  </p>

                  {/* Partition table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <div className="grid grid-cols-3 gap-px bg-gray-200 text-[10px] font-medium text-gray-600">
                      <div className="bg-gray-50 px-3 py-1.5">Name</div>
                      <div className="bg-gray-50 px-3 py-1.5">Total size</div>
                      <div className="bg-gray-50 px-3 py-1.5">Type</div>
                    </div>
                    {partitions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPart(p.id === selectedPart ? null : p.id)}
                        className={`w-full grid grid-cols-3 gap-px text-left text-xs transition-colors ${
                          selectedPart === p.id
                            ? "bg-[#fff0f0]"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="px-3 py-2 text-black">{p.label}</div>
                        <div className="px-3 py-2 text-gray-600">{p.size}</div>
                        <div className="px-3 py-2 text-gray-600">{p.type}</div>
                      </button>
                    ))}
                    {partitions.length === 0 && (
                      <div className="bg-white px-3 py-4 text-center text-gray-400 text-xs">
                        Drive 0 — 254.4 GB Unallocated Space
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={deletePartition}
                      disabled={!selectedPart}
                      className={`px-3 py-1.5 text-xs border rounded transition-colors ${
                        selectedPart
                          ? "border-gray-300 text-black hover:bg-gray-100"
                          : "border-gray-200 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Delete
                    </button>
                    <button className="px-3 py-1.5 text-xs border border-gray-300 text-black rounded hover:bg-gray-100 transition-colors">
                      Format
                    </button>
                    <button className="px-3 py-1.5 text-xs border border-gray-300 text-black rounded hover:bg-gray-100 transition-colors">
                      New
                    </button>
                    <button className="px-3 py-1.5 text-xs border border-gray-300 text-black rounded hover:bg-gray-100 transition-colors">
                      Extend
                    </button>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep("license")}
                      className="text-gray-500 text-sm hover:text-black transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep("ready")}
                      className="bg-[#0078d4] text-white px-8 py-2.5 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 8: Ready to Install ── */}
            {step === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 flex items-center justify-center p-8"
              >
                <div className="w-full max-w-lg">
                  <div className="flex gap-0.5 mb-8">
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                    <div className="w-5 h-5 bg-[#0078d4]" />
                  </div>

                  <h1 className="text-black text-2xl font-light mb-6">
                    Ready to install
                  </h1>

                  <div className="space-y-3 mb-8">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-1">General</div>
                      <div className="text-sm text-black">{EDITIONS[selectedEdition].name}</div>
                      <div className="text-xs text-gray-500">Clean install · {partitions.length} partitions</div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Location</div>
                      <div className="text-sm text-black">Drive 0</div>
                      <div className="text-xs text-gray-500">254.4 GB — {partitions.length} partitions</div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep("partition")}
                      className="text-gray-500 text-sm hover:text-black transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => {
                        setStep("installing");
                        const iv = setInterval(() => {
                          setInstallProgress((p) => {
                            const next = Math.min(100, p + 1);
                            if (next < 25) setInstallPhase("Copying files");
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
                      }}
                      className="bg-[#0078d4] text-white px-10 py-2.5 text-sm font-semibold rounded-md hover:bg-[#006cbd] transition-colors"
                    >
                      Install
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 9: Installing ── */}
            {step === "installing" && (
              <motion.div
                key="installing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center p-8"
                style={{
                  background: "linear-gradient(180deg, #0078d4 0%, #005a9e 100%)",
                }}
              >
                <div className="w-full max-w-lg text-center">
                  <div className="flex gap-0.5 mb-8 justify-center">
                    <div className="w-5 h-5 bg-white" />
                    <div className="w-5 h-5 bg-white" />
                    <div className="w-5 h-5 bg-white" />
                    <div className="w-5 h-5 bg-white" />
                  </div>

                  <h1 className="text-white text-2xl font-light mb-2">
                    Installing {config.branding.name}
                  </h1>
                  <p className="text-white/60 text-sm mb-8">
                    {installPhase}… {installProgress}%
                  </p>

                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mb-4">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      style={{ width: `${installProgress}%` }}
                    />
                  </div>

                  <p className="text-white/40 text-xs">
                    Your PC will restart several times. Sit back and relax.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
