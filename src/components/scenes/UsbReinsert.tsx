import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../shared/Toast";
import { playUsbConnect } from "../shared/sounds";

export default function UsbReinsert({ onComplete }: { onComplete: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [overPort, setOverPort] = useState(false);
  const [connected, setConnected] = useState(false);
  const toast = useToast();

  const handleDrop = useCallback(() => {
    setDragging(false);
    setOverPort(false);
    setConnected(true);
    playUsbConnect();
    toast("USB Drive inserted into target PC", "🔌");
    setTimeout(() => onComplete(), 1000);
  }, [onComplete, toast]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <AnimatePresence mode="wait">
        {!connected ? (
          <motion.div
            key="insert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8 py-8"
          >
            <div className="text-center">
              <div className="text-sm uppercase tracking-widest text-white/40">Physical Setup</div>
              <h2 className="mt-1 text-xl font-bold text-white">
                Insert the USB into the PC you're installing on
              </h2>
              <p className="mt-2 text-sm text-white/50">
                The USB was safely ejected from the flashing computer. Now plug it into the target machine.
              </p>
            </div>

            <div className="relative flex items-center gap-24 py-8">
              {/* USB Stick */}
              <motion.div
                draggable
                onDragStart={() => setDragging(true)}
                onDragEnd={() => {
                  if (!overPort) setDragging(false);
                }}
                animate={
                  dragging
                    ? { scale: 1.05, rotate: -3, cursor: "grabbing" }
                    : { scale: 1, rotate: 0, y: [0, -4, 0] }
                }
                transition={
                  dragging ? { duration: 0.15 } : { y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
                }
                className="flex cursor-grab flex-col items-center gap-2 select-none active:cursor-grabbing"
              >
                <div className="flex h-20 w-14 flex-col items-center justify-center rounded-lg bg-gradient-to-b from-gray-300 to-gray-400 shadow-lg">
                  <div className="h-6 w-8 rounded-t bg-gray-200" />
                  <div className="mt-1 text-[8px] font-bold text-gray-600">USB</div>
                </div>
                <div className="text-xs text-white/50">USB Stick</div>
              </motion.div>

              <div className="text-2xl text-white/20">→</div>

              {/* Target PC Port */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverPort(true);
                }}
                onDragLeave={() => setOverPort(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop();
                }}
                className={`flex h-24 w-32 flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                  overPort
                    ? "border-accent bg-accent/20 scale-105 shadow-[0_0_20px_rgba(124,92,255,0.3)]"
                    : "border-white/20 bg-white/5"
                }`}
              >
                <div className="text-3xl">🖥️</div>
                <div className="mt-1 text-[10px] text-white/40">
                  {overPort ? "Release to insert" : "Drop here"}
                </div>
              </div>
            </div>

            {dragging && !overPort && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-amber-400/80"
              >
                Drop the USB onto the target PC port →
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-12"
          >
            <div className="text-4xl">✓</div>
            <div className="text-lg font-bold text-emerald-400">USB inserted!</div>
            <div className="text-sm text-white/50">Ready to reboot into the installer.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
