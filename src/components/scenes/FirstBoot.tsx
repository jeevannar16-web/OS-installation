import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSceneAdvance } from "../shared/SceneAdvance";

type WizardPage = "welcome" | "accounts" | "privacy" | "done";

const ONLINE_ACCOUNTS = [
  { name: "Google", icon: "🔍", connected: false },
  { name: "Microsoft", icon: "🪟", connected: false },
  { name: "Nextcloud", icon: "☁️", connected: false },
];

export default function FirstBoot({
  osName,
  osLogo,
  accent,
  onComplete,
}: {
  osName: string;
  osLogo: string;
  accent: string;
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [page, setPage] = useState<WizardPage>("welcome");

  useEffect(() => {
    registerAdvance(() => {
      if (page === "done") onComplete();
    });
  }, [registerAdvance, page, onComplete]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {page === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="rounded-2xl border border-white/10 p-8 text-center shadow-2xl backdrop-blur-xl"
            style={{ background: `linear-gradient(135deg, ${accent}22, #0a0a0f)` }}
          >
            <div className="text-6xl mb-4">{osLogo}</div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white/90 mb-2">
              Welcome to {osName}
            </h2>
            <p className="text-white/50 mb-8">
              Let's set up a few things before you start.
            </p>
            <button
              onClick={() => setPage("accounts")}
              className="rounded-xl px-8 py-3 font-bold text-white transition-all shadow-lg hover:scale-105 active:scale-95"
              style={{ background: accent }}
            >
              Start Setup →
            </button>
          </motion.div>
        )}

        {page === "accounts" && (
          <motion.div
            key="accounts"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="rounded-2xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl"
            style={{ background: `linear-gradient(135deg, ${accent}22, #0a0a0f)` }}
          >
            <h2 className="text-xl font-bold text-white/90 mb-2">Online Accounts</h2>
            <p className="text-sm text-white/50 mb-6">
              Connect your accounts for files, calendar, and contacts.
            </p>

            <div className="space-y-3 mb-8">
              {ONLINE_ACCOUNTS.map((acc) => (
                <div
                  key={acc.name}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="text-2xl">{acc.icon}</span>
                  <div className="flex-1">
                    <div className="text-white/80 font-medium">{acc.name}</div>
                    <div className="text-xs text-white/40">Not connected</div>
                  </div>
                  <button className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/20 transition-colors">
                    Connect
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPage("welcome")}
                className="rounded-xl px-6 py-2 text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setPage("privacy")}
                className="rounded-xl px-6 py-3 font-bold text-white transition-all shadow-lg hover:scale-105 active:scale-95"
                style={{ background: accent }}
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {page === "privacy" && (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="rounded-2xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl"
            style={{ background: `linear-gradient(135deg, ${accent}22, #0a0a0f)` }}
          >
            <h2 className="text-xl font-bold text-white/90 mb-2">Privacy Settings</h2>
            <p className="text-sm text-white/50 mb-6">
              Choose what data you share to help improve {osName}.
            </p>

            <div className="space-y-4 mb-8">
              <PrivacyToggle label="Location Services" defaultOn={false} />
              <PrivacyToggle label="Automatic Problem Reports" defaultOn={true} />
              <PrivacyToggle label="Usage Statistics" defaultOn={false} />
              <PrivacyToggle label="Screen Lock" defaultOn={true} />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPage("accounts")}
                className="rounded-xl px-6 py-2 text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setPage("done")}
                className="rounded-xl px-6 py-3 font-bold text-white transition-all shadow-lg hover:scale-105 active:scale-95"
                style={{ background: accent }}
              >
                Done →
              </button>
            </div>
          </motion.div>
        )}

        {page === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/10 p-8 text-center shadow-2xl backdrop-blur-xl"
            style={{ background: `linear-gradient(135deg, ${accent}22, #0a0a0f)` }}
          >
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white/90 mb-2">You're all set!</h2>
            <p className="text-white/50 mb-6">
              {osName} is ready to use.
            </p>
            <button
              onClick={onComplete}
              className="rounded-xl px-8 py-3 font-bold text-white transition-all shadow-lg hover:scale-105 active:scale-95"
              style={{ background: accent }}
            >
              Start Using {osName} →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrivacyToggle({
  label,
  defaultOn,
}: {
  label: string;
  defaultOn: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
      <span className="text-white/80 text-sm">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          on ? "bg-green-500" : "bg-white/20"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
