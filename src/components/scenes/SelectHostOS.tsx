import { useEffect } from "react";
import { motion } from "framer-motion";
import type { HostOS } from "../../data/types";
import { useSceneAdvance } from "../shared/SceneAdvance";

type SelectHostOSProps = {
  onSelect: (hostOS: HostOS) => void;
};

const HOST_OPTIONS: Array<{ id: HostOS; name: string; icon: string; description: string }> = [
  {
    id: "windows",
    name: "Windows",
    icon: "🪟",
    description: "You're running Windows — use VirtualBox or VMware Workstation.",
  },
  {
    id: "macos",
    name: "macOS",
    icon: "🍎",
    description: "You're on a Mac — use UTM, VMware Fusion, or VirtualBox.",
  },
  {
    id: "linux",
    name: "Linux",
    icon: "🐧",
    description: "You're on Linux — use VirtualBox, GNOME Boxes, or virt-manager.",
  },
];

export default function SelectHostOS({ onSelect }: SelectHostOSProps) {
  const { register: registerAdvance } = useSceneAdvance();

  useEffect(() => {
    registerAdvance(() => onSelect("windows"));
  }, [registerAdvance, onSelect]);
  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-center">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-2"
        >
          What are you using right now?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/60"
        >
          We'll customize the VM UI to match your host OS.
        </motion.p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 w-full max-w-3xl">
        {HOST_OPTIONS.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option.id)}
            className="glass rounded-2xl p-6 text-left transition-all border border-white/10 hover:border-white/30"
          >
            <div className="text-4xl mb-3">{option.icon}</div>
            <div className="text-lg font-semibold text-white mb-1">{option.name}</div>
            <div className="text-xs text-white/50">{option.description}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
