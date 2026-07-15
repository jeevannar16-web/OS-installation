import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";

export default function VmClose({
  config,
  onComplete,
}: {
  config: OSConfig;
  onComplete: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl space-y-6">
      {/* VM Window */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden rounded-xl border border-white/10 shadow-2xl"
      >
        {/* VM title bar */}
        <div className="flex items-center gap-2 bg-[#323234] px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 mx-auto text-xs text-white/50">
            <span>VirtualBox</span>
            <span>—</span>
            <span>{config.branding.name} [Running]</span>
          </div>
          <button
            onClick={() => {
              playClick();
              onComplete();
            }}
            className="text-white/40 hover:text-red-400 text-sm font-bold transition-colors"
            title="Close VM"
          >
            ×
          </button>
        </div>

        {/* Guest OS screen content */}
        <div
          className="flex h-[420px] lg:h-[520px] xl:h-[600px] items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${config.branding.surface} 0%, #0a0a1a 100%)`,
          }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">{config.branding.logo}</div>
            <div className="text-lg font-bold text-white/80">{config.branding.name}</div>
            <div className="mt-2 text-sm text-white/50">Installation complete!</div>
          </div>
        </div>
      </motion.div>

      <div className="text-center text-sm text-white/50">
        Click the <span className="text-red-400">×</span> to close the VM window and return to your host.
      </div>
    </div>
  );
}
