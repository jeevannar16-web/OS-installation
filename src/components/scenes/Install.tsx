import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig, WizardStep } from "../../data/types";

type WizardPhase = "wizard" | "installing" | "done";

function LanguageStep({
  step,
  value,
  onChange,
}: {
  step: Extract<WizardStep, { kind: "language" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white/90">{step.title}</h3>
      <div className="space-y-1">
        {step.options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
              value === opt
                ? "bg-accent/20 text-white ring-1 ring-accent/50"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function KeyboardStep({
  step,
  value,
  onChange,
}: {
  step: Extract<WizardStep, { kind: "keyboard" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white/90">{step.title}</h3>
      <div className="space-y-1">
        {step.layouts.map((layout) => (
          <button
            key={layout}
            onClick={() => onChange(layout)}
            className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
              value === layout
                ? "bg-accent/20 text-white ring-1 ring-accent/50"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            {layout}
          </button>
        ))}
      </div>
    </div>
  );
}

function DiskStep({
  step,
  value,
  onChange,
}: {
  step: Extract<WizardStep, { kind: "disk" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white/90">{step.title}</h3>
      <div className="space-y-2">
        {step.choices.map((c) => (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`w-full rounded-lg px-4 py-3 text-left transition-colors ${
              value === c.id
                ? "bg-accent/20 text-white ring-1 ring-accent/50"
                : "text-white/70 hover:bg-white/5"
            }`}
          >
            <div className="text-sm font-medium">{c.label}</div>
            <div className="mt-0.5 text-xs text-white/40">{c.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AccountStep({
  step,
  values,
  onChange,
}: {
  step: Extract<WizardStep, { kind: "account" }>;
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(field: string, val: string) {
    if (!val.trim()) {
      setErrors((p) => ({ ...p, [field]: "Required" }));
    } else {
      setErrors((p) => {
        const n = { ...p };
        delete n[field];
        return n;
      });
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white/90">{step.title}</h3>
      <div className="space-y-3">
        {step.prompts.map((p) => (
          <div key={p.label}>
            <label className="mb-1 block text-xs text-white/50">{p.label}</label>
            <input
              type={p.secret ? "password" : "text"}
              value={values[p.label] ?? ""}
              onChange={(e) => {
                onChange(p.label, e.target.value);
                validate(p.label, e.target.value);
              }}
              onBlur={() => validate(p.label, values[p.label] ?? "")}
              placeholder={p.placeholder}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/50 transition-colors placeholder:text-white/20"
            />
            {errors[p.label] && (
              <div className="mt-1 text-xs text-red-400">{errors[p.label]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmStep({
  step,
}: {
  step: Extract<WizardStep, { kind: "confirm" }>;
}) {
  return (
    <div className="space-y-3 text-center">
      <h3 className="text-lg font-bold text-white/90">{step.title}</h3>
      <p className="text-sm text-white/50">{step.body}</p>
    </div>
  );
}

export default function Install({
  config,
  speed,
  onComplete,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<WizardPhase>("wizard");
  const [stepIdx, setStepIdx] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  const steps = config.wizard;
  const currentStep = steps[stepIdx];
  const isLastStep = stepIdx === steps.length - 1;

  const installDuration = speed === "fast" ? 2000 : 8000;

  // Install progress
  useEffect(() => {
    if (phase !== "installing") return;
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / installDuration) * 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
      else setTimeout(() => onComplete(), 600);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, installDuration, onComplete]);

  // Rotate tips
  useEffect(() => {
    if (phase !== "installing") return;
    const interval = setInterval(() => {
      setTipIdx((p) => (p + 1) % config.installTips.length);
    }, speed === "fast" ? 600 : 2000);
    return () => clearInterval(interval);
  }, [phase, config.installTips.length, speed]);

  function canAdvance(): boolean {
    if (!currentStep) return false;
    if (currentStep.kind === "language") return !!values["language"];
    if (currentStep.kind === "keyboard") return !!values["keyboard"];
    if (currentStep.kind === "disk") return !!values["disk"];
    if (currentStep.kind === "account") {
      return currentStep.prompts.every((p) => (values[p.label] ?? "").trim().length > 0);
    }
    return true;
  }

  function handleNext() {
    if (isLastStep) {
      setPhase("installing");
    } else {
      setStepIdx((p) => p + 1);
    }
  }

  function setVal(field: string, val: string) {
    setValues((p) => ({ ...p, [field]: val }));
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <AnimatePresence mode="wait">
        {/* Wizard steps */}
        {phase === "wizard" && (
          <motion.div
            key={`step-${stepIdx}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
          >
            {/* Step indicator */}
            <div className="mb-6 flex items-center gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= stepIdx ? "bg-accent" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            <div className="min-h-[280px]">
              {currentStep?.kind === "language" && (
                <LanguageStep
                  step={currentStep}
                  value={values["language"] ?? ""}
                  onChange={(v) => setVal("language", v)}
                />
              )}
              {currentStep?.kind === "keyboard" && (
                <KeyboardStep
                  step={currentStep}
                  value={values["keyboard"] ?? ""}
                  onChange={(v) => setVal("keyboard", v)}
                />
              )}
              {currentStep?.kind === "disk" && (
                <DiskStep
                  step={currentStep}
                  value={values["disk"] ?? ""}
                  onChange={(v) => setVal("disk", v)}
                />
              )}
              {currentStep?.kind === "account" && (
                <AccountStep
                  step={currentStep}
                  values={values}
                  onChange={(f, v) => setVal(f, v)}
                />
              )}
              {currentStep?.kind === "confirm" && <ConfirmStep step={currentStep} />}
            </div>

            {/* Next / Install button */}
            <div className="mt-6 flex justify-end">
              <button
                disabled={!canAdvance()}
                onClick={handleNext}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLastStep ? "Install now →" : "Next →"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Installing progress */}
        {phase === "installing" && (
          <motion.div
            key="installing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center"
          >
            <div className="text-4xl mb-4">{config.branding.logo}</div>
            <h2 className="text-lg font-bold text-white/90">
              Installing {config.branding.name}…
            </h2>

            {/* Progress bar */}
            <div className="mt-6 mx-auto max-w-md space-y-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: config.branding.accent }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
              <div className="text-xs text-white/40">{Math.floor(progress)}%</div>
            </div>

            {/* Rotating tips */}
            <div className="mt-6 min-h-[2em]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tipIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-sm text-white/50"
                >
                  {config.installTips[tipIdx]}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
