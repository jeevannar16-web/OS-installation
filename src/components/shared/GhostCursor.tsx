import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type GhostCursorProps = {
  isVisible: boolean;
  steps: Array<{
    type: "move" | "click" | "drag";
    x: number;
    y: number;
    delay?: number;
    duration?: number;
    dragEndX?: number;
    dragEndY?: number;
    label?: string;
  }>;
  onComplete?: () => void;
};

export default function GhostCursor({
  isVisible,
  steps,
  onComplete,
}: GhostCursorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const trailIdRef = useRef(0);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setCursorPos({ x: 0, y: 0 });
    setIsClicking(false);
    setIsDragging(false);
    setTrail([]);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      reset();
      return;
    }

    let stepTimer: ReturnType<typeof setTimeout>;

    const runStep = async (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        onComplete?.();
        return;
      }

      const step = steps[stepIndex];

      stepTimer = setTimeout(async () => {
        if (step.type === "move") {
          setCursorPos({ x: step.x, y: step.y });
        } else if (step.type === "click") {
          setCursorPos({ x: step.x, y: step.y });
          await new Promise((r) => setTimeout(r, (step.duration || 300)));
          setIsClicking(true);
          await new Promise((r) => setTimeout(r, 150));
          setIsClicking(false);
        } else if (step.type === "drag") {
          setCursorPos({ x: step.x, y: step.y });
          await new Promise((r) => setTimeout(r, (step.duration || 300)));
          setIsDragging(true);
          if (step.dragEndX !== undefined && step.dragEndY !== undefined) {
            setCursorPos({ x: step.dragEndX, y: step.dragEndY });
          }
          await new Promise((r) => setTimeout(r, (step.duration || 500)));
          setIsDragging(false);
        }

        setCurrentStep(stepIndex + 1);
      }, step.delay || 500);
    };

    runStep(currentStep);

    return () => {
      clearTimeout(stepTimer);
    };
  }, [isVisible, steps, currentStep, reset, onComplete]);

  useEffect(() => {
    if (!isVisible) return;

    const trailTimer = setInterval(() => {
      setTrail((prev) => [
        ...prev.slice(-10),
        { x: cursorPos.x, y: cursorPos.y, id: trailIdRef.current++ },
      ]);
    }, 50);

    return () => clearInterval(trailTimer);
  }, [isVisible, cursorPos]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Trail */}
          {trail.map((point, i) => (
            <motion.div
              key={point.id}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed pointer-events-none z-[9998] w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
              style={{
                left: point.x - 6,
                top: point.y - 6,
                opacity: (i / trail.length) * 0.6,
              }}
            />
          ))}

          {/* Cursor */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed pointer-events-none z-[9999]"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-[0_0_10px_rgba(124,92,255,0.8)]"
            >
              <path
                d="M5 3L19 12L13 13L18 21L14 22L9 14L5 17V3Z"
                fill="url(#cursor-gradient)"
                stroke="white"
                strokeWidth="1.5"
              />
              <defs>
                <linearGradient id="cursor-gradient" x1="0" y1="0" x2="24" y2="24">
                  <stop stopColor="#7c5cff" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>

            {/* Click Ripple */}
            {isClicking && (
              <motion.div
                initial={{ opacity: 1, scale: 0.5 }}
                animate={{ opacity: 0, scale: 2.5 }}
                transition={{ duration: 0.5 }}
                className="absolute -left-6 -top-6 w-12 h-12 rounded-full border-2 border-cyan-400"
              />
            )}

            {/* Drag Indicator */}
            {isDragging && (
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -5, 5, -5, 0],
                }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-purple-500/50"
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
