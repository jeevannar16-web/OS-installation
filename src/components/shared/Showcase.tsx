import { useState } from "react";
import { motion } from "framer-motion";
import { playClick, playSuccess } from "./sounds";

export default function Showcase({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [over, setOver] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8"
      >
        {step === 0 && (
          <div className="text-center">
            <div className="text-4xl mb-4">💿</div>
            <h2 className="text-xl font-bold text-white/90">OS Install Simulator</h2>
            <p className="mt-3 text-sm text-white/50 max-w-sm mx-auto leading-relaxed">
              This is a realistic, interactive simulation of installing an operating system.
              You'll search for an ISO, flash a USB, navigate boot menus, and install — all with real interactions.
            </p>
            <div className="flex flex-col items-center gap-3 mt-6">
              <button
                onClick={() => { playClick(); setStep(1); }}
                className="btn-primary w-full sm:w-auto"
              >
                Let's try a quick interaction →
              </button>
              <button
                onClick={() => { playClick(); onDismiss(); }}
                className="text-xs text-white/30 hover:text-white/50"
              >
                Skip intro
              </button>
            </div>
          </div>
        )}

        {step === 1 && !done && (
          <div className="text-center">
            <div className="text-sm text-white/50 mb-4">
              This is how you'll interact — try dragging the icon to the target.
            </div>
            <div className="flex items-center justify-center gap-10 sm:gap-16 py-8">
              <motion.div
                draggable
                onDragStart={() => setDragging(true)}
                onDragEnd={() => { setDragging(false); setOver(false); }}
                animate={
                  dragging
                    ? { scale: 1.1, rotate: -5 }
                    : { scale: 1, y: [0, -4, 0] }
                }
                transition={
                  dragging ? {} : { y: { repeat: Infinity, duration: 1.5 } }
                }
                className="cursor-grab active:cursor-grabbing select-none"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/20 text-3xl ring-1 ring-accent/30">
                  📦
                </div>
              </motion.div>

              <div className="text-white/20 text-xl">→</div>

              <motion.div
                onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(false);
                  setDragging(false);
                  setDone(true);
                  playSuccess();
                }}
                animate={over ? { scale: 1.1 } : { scale: 1 }}
                className={`flex h-20 w-28 items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                  over ? "border-accent bg-accent/20" : "border-white/20 bg-white/5"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl">🎯</div>
                  <div className="text-[10px] text-white/40 mt-1">
                    {over ? "Release!" : "Drop here"}
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="text-xs text-white/30">
              Drag-and-drop is used throughout the simulation
            </div>
          </div>
        )}

        {done && (
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-bold text-white/90">You've got the idea!</h2>
            <p className="mt-2 text-sm text-white/50 leading-relaxed">
              You'll use similar interactions throughout the simulation. Ready to begin?
            </p>
            <button
              onClick={() => { playClick(); onDismiss(); }}
              className="btn-primary mt-6"
            >
              Start simulating →
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
