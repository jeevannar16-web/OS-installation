import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { getRandomBios } from "../../data/bios";
import { playPostBeep, playKeyClick, playSuccess, playClick } from "../shared/sounds";
import { Tooltip, PulseHint } from "../shared/InteractiveEffects";

type RebootPhase = "flicker" | "fade_out" | "post" | "memory" | "prompt" | "missed" | "bios" | "done";
type BiosTab = "main" | "advanced" | "security" | "boot" | "exit";

export default function Reboot({
  speed,
  onComplete,
  secureBoot,
  setSecureBoot,
  vtEnabled,
  setVtEnabled,
  bootOrderUSB,
  setBootOrderUSB,
}: {
  speed: "normal" | "fast";
  onComplete: () => void;
  secureBoot: boolean;
  setSecureBoot: (v: boolean) => void;
  vtEnabled: boolean;
  setVtEnabled: (v: boolean) => void;
  bootOrderUSB: boolean;
  setBootOrderUSB: (v: boolean) => void;
}) {
  const bios = useMemo(() => getRandomBios(), []);
  const [phase, setPhase] = useState<RebootPhase>("flicker");
  const [memCount, setMemCount] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [activeTab, setActiveTab] = useState<BiosTab>("main");
  const [selectedRow, setSelectedRow] = useState(0);

  // Local values for BIOS that are saved only on Exit & Save
  const [localSecureBoot, setLocalSecureBoot] = useState(secureBoot);
  const [localVtEnabled, setLocalVtEnabled] = useState(vtEnabled);
  const [localBootOrder, setLocalBootOrder] = useState<string[]>([
    "SATA HDD: Windows Boot Manager",
    "USB Key: Generic Flash Disk",
    "Network Boot: PXE IP4",
  ]);

  useEffect(() => {
    // Synchronize local states when entering BIOS
    if (phase === "bios") {
      setLocalSecureBoot(secureBoot);
      setLocalVtEnabled(vtEnabled);
      if (bootOrderUSB) {
        setLocalBootOrder([
          "USB Key: Generic Flash Disk",
          "SATA HDD: Windows Boot Manager",
          "Network Boot: PXE IP4",
        ]);
      } else {
        setLocalBootOrder([
          "SATA HDD: Windows Boot Manager",
          "USB Key: Generic Flash Disk",
          "Network Boot: PXE IP4",
        ]);
      }
    }
  }, [phase, secureBoot, vtEnabled, bootOrderUSB]);

  const flickerDur = 200;
  const fadeDur = speed === "fast" ? 300 : 600;
  const postDur = speed === "fast" ? 400 : bios.postDelay;
  const memDur = speed === "fast" ? 400 : 1000;

  useEffect(() => {
    const t = setTimeout(() => setPhase("fade_out"), flickerDur);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "fade_out") return;
    const t = setTimeout(() => {
      setPhase("post");
      playPostBeep();
    }, fadeDur);
    return () => clearTimeout(t);
  }, [phase, fadeDur]);

  useEffect(() => {
    if (phase !== "post") return;
    const t = setTimeout(() => setPhase("memory"), postDur);
    return () => clearTimeout(t);
  }, [phase, postDur]);

  useEffect(() => {
    if (phase !== "memory") return;
    const target = 16384;
    const step = target / (memDur / 30);
    const interval = setInterval(() => {
      setMemCount((prev) => {
        const next = prev + step;
        if (next >= target) {
          clearInterval(interval);
          setTimeout(() => setPhase("prompt"), 200);
          return target;
        }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [phase, memDur]);

  // Prompt countdown
  useEffect(() => {
    if (phase !== "prompt") return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (bootOrderUSB) {
            // USB is ranked first, auto boots to USB installer!
            setPhase("done");
            playSuccess();
            onComplete();
          } else {
            setTimeout(() => setPhase("missed"), 300);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, bootOrderUSB, onComplete]);

  // Move item in boot list
  const moveBootOrder = (index: number, direction: "up" | "down") => {
    playClick();
    const newList = [...localBootOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newList.length) {
      const temp = newList[index];
      newList[index] = newList[targetIndex];
      newList[targetIndex] = temp;
      setLocalBootOrder(newList);
    }
  };

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (phase === "prompt") {
        if (e.key === "F12") {
          e.preventDefault();
          playKeyClick();
          setPhase("done");
          playSuccess();
          onComplete();
        } else if (e.key === "F2" || e.key === "Delete") {
          e.preventDefault();
          playKeyClick();
          setPhase("bios");
        }
      } else if (phase === "bios") {
        playKeyClick();
        if (e.key === "ArrowRight") {
          const tabs: BiosTab[] = ["main", "advanced", "security", "boot", "exit"];
          const currIdx = tabs.indexOf(activeTab);
          setActiveTab(tabs[(currIdx + 1) % tabs.length]);
          setSelectedRow(0);
        } else if (e.key === "ArrowLeft") {
          const tabs: BiosTab[] = ["main", "advanced", "security", "boot", "exit"];
          const currIdx = tabs.indexOf(activeTab);
          setActiveTab(tabs[(currIdx - 1 + tabs.length) % tabs.length]);
          setSelectedRow(0);
        } else if (e.key === "ArrowDown") {
          if (activeTab === "advanced" || activeTab === "security" || activeTab === "boot" || activeTab === "exit") {
            setSelectedRow((prev) => prev + 1);
          }
        } else if (e.key === "ArrowUp") {
          setSelectedRow((prev) => Math.max(0, prev - 1));
        } else if (e.key === "Enter") {
          if (activeTab === "security") {
            setLocalSecureBoot((p) => !p);
          } else if (activeTab === "advanced") {
            setLocalVtEnabled((p) => !p);
          } else if (activeTab === "exit") {
            if (selectedRow === 0) {
              // Save and Exit
              setSecureBoot(localSecureBoot);
              setVtEnabled(localVtEnabled);
              setBootOrderUSB(localBootOrder[0].includes("USB Key"));
              setCountdown(3);
              setMemCount(0);
              setPhase("post");
              playPostBeep();
            } else {
              // Discard and Exit
              setCountdown(3);
              setMemCount(0);
              setPhase("post");
              playPostBeep();
            }
          }
        }
      }
    },
    [
      phase,
      activeTab,
      selectedRow,
      localSecureBoot,
      localVtEnabled,
      localBootOrder,
      onComplete,
      setSecureBoot,
      setVtEnabled,
      setBootOrderUSB,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {phase === "flicker" && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.2, 0.8, 0.1, 0.9, 0] }}
          transition={{ duration: flickerDur / 1000 }}
          className="absolute inset-0 bg-white"
        />
      )}

      {phase === "fade_out" && (
        <div className="absolute inset-0 bg-black opacity-0" />
      )}

      {phase === "post" && (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl">{bios.logo}</div>
          <div className="text-xs sm:text-sm lg:text-base font-bold tracking-widest text-white/70">
            {bios.name}
          </div>
          <div className="text-[10px] sm:text-xs lg:text-sm text-white/40">{bios.memLabel}</div>
          <div className="mt-2 text-xs sm:text-sm text-white/30">Initializing hardware…</div>
        </div>
      )}

      {phase === "memory" && (
        <div className="font-mono text-sm text-white/70">
          <div>Memory Test: {Math.floor(memCount)} MB OK</div>
          <div className="mt-2 h-1 w-48 overflow-hidden rounded bg-white/10">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-30"
              style={{ width: `${(memCount / 16384) * 100}%` }}
            />
          </div>
        </div>
      )}

      {phase === "prompt" && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl">{bios.logo}</div>
          <div className="font-mono text-center space-y-1">
            <div className="text-sm sm:text-base lg:text-lg text-white/70">
              Press <span className="font-bold text-white">F2</span> to enter Setup,{" "}
              <span className="font-bold text-white">F12</span> for Boot Menu
            </div>
            <div className="text-xs sm:text-sm lg:text-base text-white/40">
              {countdown}s remaining
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => {
                playClick();
                setPhase("bios");
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              Press F2 (BIOS Setup)
            </button>
            <PulseHint>
              <Tooltip text="Press F12 key or click to enter boot device selection menu directly.">
                <button
                  onClick={() => {
                    playKeyClick();
                    setPhase("done");
                    playSuccess();
                    onComplete();
                  }}
                  className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/15 transition-colors"
                >
                  Press F12 (Boot Menu)
                </button>
              </Tooltip>
            </PulseHint>
          </div>
        </div>
      )}

      {/* Interactive BIOS Setup Utility */}
      {phase === "bios" && (
        <div className="w-full max-w-3xl border-4 border-double border-white/80 bg-[#000084] font-mono text-white p-4 flex flex-col justify-between h-[450px] sm:h-[500px] text-xs sm:text-sm relative select-none">
          {/* Top Title */}
          <div className="flex justify-between border-b border-white pb-1 mb-2">
            <span>Aptio Setup Utility - Copyright (C) 2026 American Megatrends, Inc.</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-white pb-1 mb-3 text-center">
            {(["main", "advanced", "security", "boot", "exit"] as BiosTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  playClick();
                  setActiveTab(tab);
                  setSelectedRow(0);
                }}
                className={`px-3 py-0.5 uppercase font-bold transition-colors ${
                  activeTab === tab ? "bg-[#848484] text-[#000084]" : "hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Main content grid */}
          <div className="flex-1 flex gap-4 text-white overflow-hidden min-h-0">
            {/* Left side list of options */}
            <div className="flex-1 border-r border-white/20 pr-4 space-y-2.5 overflow-y-auto">
              {activeTab === "main" && (
                <div className="space-y-1.5 text-white/80">
                  <div>BIOS Version:      AMIBIOS v4.6.5.4</div>
                  <div>Build Date:        07/15/2026</div>
                  <div>Processor Type:    Intel(R) Core(TM) i7-14700K</div>
                  <div>System Memory:     16384 MB</div>
                  <div className="h-6" />
                  <div className="text-yellow-300">Use arrow keys or mouse to explore tabs.</div>
                  <div className="text-yellow-300">Set Boot Device Priority under "Boot" or Enable VT-x under "Advanced".</div>
                </div>
              )}

              {activeTab === "advanced" && (
                <div className="space-y-2">
                  <div className="text-yellow-300 font-bold mb-2">System Configuration</div>
                  <button
                    onClick={() => {
                      playClick();
                      setLocalVtEnabled(!localVtEnabled);
                    }}
                    className={`w-full flex justify-between items-center text-left p-1 rounded ${
                      selectedRow === 0 ? "bg-[#848484] text-[#000084] font-bold" : ""
                    }`}
                  >
                    <span>Intel Virtualization Technology (VT-x)</span>
                    <span className="font-bold">[{localVtEnabled ? "Enabled" : "Disabled"}]</span>
                  </button>
                  <div className="text-[10px] text-white/60 pl-2 leading-relaxed">
                    When enabled, a VMM can utilize the additional hardware capabilities provided by Intel(R) Virtualization Tech. Required for VirtualBox VMs to run!
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-2">
                  <div className="text-yellow-300 font-bold mb-2">Security Settings</div>
                  <button
                    onClick={() => {
                      playClick();
                      setLocalSecureBoot(!localSecureBoot);
                    }}
                    className={`w-full flex justify-between items-center text-left p-1 rounded ${
                      selectedRow === 0 ? "bg-[#848484] text-[#000084] font-bold" : ""
                    }`}
                  >
                    <span>Secure Boot Configuration</span>
                    <span className="font-bold">[{localSecureBoot ? "Enabled" : "Disabled"}]</span>
                  </button>
                  <div className="text-[10px] text-white/60 pl-2 leading-relaxed">
                    Secure Boot prevents unsigned or unverified operating systems from booting. Windows 11 requires Secure Boot to be enabled, while some custom Linux environments may require it disabled.
                  </div>
                </div>
              )}

              {activeTab === "boot" && (
                <div className="space-y-3">
                  <div className="text-yellow-300 font-bold mb-1">Boot Device Priority</div>
                  <div className="text-[10px] text-white/60 pl-1 leading-relaxed">
                    Arrange order by clicking the up/down arrows. First device will boot automatically without pressing F12.
                  </div>
                  
                  <div className="space-y-1.5 mt-2">
                    {localBootOrder.map((device, idx) => (
                      <div
                        key={device}
                        className="flex items-center justify-between bg-white/5 border border-white/10 px-3 py-1.5 rounded"
                      >
                        <span className="font-semibold text-white/90">
                          {idx + 1}. {device}
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={idx === 0}
                            onClick={() => moveBootOrder(idx, "up")}
                            className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent px-1.5 py-0.5 rounded text-[10px]"
                          >
                            ▲ Up
                          </button>
                          <button
                            disabled={idx === localBootOrder.length - 1}
                            onClick={() => moveBootOrder(idx, "down")}
                            className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent px-1.5 py-0.5 rounded text-[10px]"
                          >
                            ▼ Down
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "exit" && (
                <div className="space-y-2">
                  <div className="text-yellow-300 font-bold mb-2">Exit Options</div>
                  <button
                    onClick={() => {
                      playClick();
                      // Save and Exit
                      setSecureBoot(localSecureBoot);
                      setVtEnabled(localVtEnabled);
                      setBootOrderUSB(localBootOrder[0].includes("USB Key"));
                      setCountdown(3);
                      setMemCount(0);
                      setPhase("post");
                      playPostBeep();
                    }}
                    className={`w-full text-left p-1.5 rounded ${
                      selectedRow === 0 ? "bg-[#848484] text-[#000084] font-bold" : "hover:bg-white/5"
                    }`}
                  >
                    Save Changes and Exit (F10)
                  </button>
                  <button
                    onClick={() => {
                      playClick();
                      // Discard and Exit
                      setCountdown(3);
                      setMemCount(0);
                      setPhase("post");
                      playPostBeep();
                    }}
                    className={`w-full text-left p-1.5 rounded ${
                      selectedRow === 1 ? "bg-[#848484] text-[#000084] font-bold" : "hover:bg-white/5"
                    }`}
                  >
                    Discard Changes and Exit (Esc)
                  </button>
                </div>
              )}
            </div>

            {/* Right side help panel */}
            <div className="w-52 border border-white/20 bg-white/5 p-3 flex flex-col justify-between text-[10px] leading-relaxed text-white/60">
              <div>
                <div className="font-bold text-white border-b border-white/20 pb-1 mb-1">Item Help</div>
                {activeTab === "main" && "View basic system information, processor specifications, and memory metrics."}
                {activeTab === "advanced" && "Configure advanced CPU settings. VT-x must be ENABLED for VirtualBox VMs to function."}
                {activeTab === "security" && "Adjust security settings. Windows 11 mandates Secure Boot, but older installations might block Linux."}
                {activeTab === "boot" && "Specify the boot device sequence. Put 'USB Key' first to avoid pressing F12 manually."}
                {activeTab === "exit" && "Exit the setup utility. Save to apply Secure Boot, VT-x, or Boot order modifications."}
              </div>
              <div className="border-t border-white/20 pt-1.5 space-y-0.5 text-white/50">
                <div>←→: Select Screen</div>
                <div>↑↓: Select Item</div>
                <div>Enter: Toggle/Select</div>
                <div>F10: Save and Exit</div>
                <div>ESC: Discard & Exit</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "missed" && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-center animate-fade-in">
            <div className="text-3xl sm:text-4xl lg:text-5xl mb-3">🪟</div>
            <div className="text-sm sm:text-base lg:text-lg text-white/60">Booting to Windows Boot Manager…</div>
            <div className="mt-2 text-xs sm:text-sm lg:text-base text-white/40">
              (No boot device selected — your BIOS boot order booted HDD first instead of USB!)
            </div>
            <div className="mt-1 text-xs text-accent/70">
              Tip: Press <span className="font-semibold text-white">F2</span> during reboot to rearrange Boot Device Priority, or press <span className="font-semibold text-white">F12</span> to select USB manually.
            </div>
          </div>
          <button
            onClick={() => {
              setCountdown(3);
              setMemCount(0);
              setPhase("post");
              playPostBeep();
            }}
            className="rounded-xl bg-white/10 border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
          >
            🔄 Reboot Again
          </button>
        </div>
      )}
    </div>
  );
}
