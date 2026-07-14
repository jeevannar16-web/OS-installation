import { motion, AnimatePresence } from "framer-motion";

type FileEntry = { name: string; icon: string; size?: string };

export default function FilePickerModal({
  open,
  files,
  title,
  onSelect,
  onClose,
}: {
  open: boolean;
  files: FileEntry[];
  title: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a2e] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <h3 className="text-sm font-semibold text-white/90">{title}</h3>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-3">
              {files.map((f) => (
                <button
                  key={f.name}
                  onClick={() => {
                    onSelect(f.name);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-colors"
                >
                  <span className="text-xl">{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{f.name}</div>
                    {f.size && (
                      <div className="text-xs text-white/40">{f.size}</div>
                    )}
                  </div>
                </button>
              ))}
              {files.length === 0 && (
                <div className="py-8 text-center text-sm text-white/40">
                  No files found.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
