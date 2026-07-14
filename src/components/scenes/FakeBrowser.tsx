import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";

type Phase = "address" | "search" | "download" | "downloading" | "done";

type SearchResult = {
  title: string;
  url: string;
  desc: string;
  official: boolean;
};

function buildResults(config: OSConfig): SearchResult[] {
  const dp = config.downloadPage;
  return [
    {
      title: `${config.branding.name} | The official ${config.branding.name} website`,
      url: dp.url.replace(/^https?:\/\//, ""),
      desc: dp.blurb,
      official: true,
    },
    {
      title: `Download ${config.branding.name} — Free & Safe | Softonic`,
      url: `softonic.com/${config.id}/download`,
      desc: `Get ${config.branding.name} for your computer. Alternative mirrors and installers available.`,
      official: false,
    },
    {
      title: `How to install ${config.branding.name} in 2024 (step-by-step)`,
      url: `howtogeek.com/how-to-install-${config.id}`,
      desc: `A complete walkthrough covering USB creation, partitioning, and first boot.`,
      official: false,
    },
    {
      title: `${config.branding.name} Community Forum — reddit`,
      url: `reddit.com/r/${config.id}`,
      desc: `Talk to other users, share screenshots, and get help with your setup.`,
      official: false,
    },
  ];
}

export default function FakeBrowser({
  config,
  speed,
  onComplete,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const dp = config.downloadPage;
  const [phase, setPhase] = useState<Phase>("address");
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [version, setVersion] = useState(dp.versions?.[0] ?? "");
  const results = buildResults(config);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autotype the search term when the user clicks "Skip typing".
  useEffect(() => {
    if (!typing) return;
    let i = 0;
    setQuery("");
    const t = setInterval(() => {
      i += 1;
      setQuery(dp.searchTerm.slice(0, i));
      if (i >= dp.searchTerm.length) {
        clearInterval(t);
        setTimeout(() => setPhase("search"), 350);
      }
    }, 45);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing]);

  // Drive the fake download progress.
  useEffect(() => {
    if (phase !== "downloading") return;
    const duration = speed === "fast" ? 900 : 3800;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => onComplete(), 650);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, speed]);

  function submitSearch() {
    const q = query.trim();
    if (!q) return;
    setNudge(null);
    setPhase("search");
  }

  const addressUrl =
    phase === "address"
      ? "about:blank"
      : phase === "search"
        ? `search.example.com/search?q=${encodeURIComponent(query || dp.searchTerm)}`
        : dp.url.replace(/^https?:\/\//, "");

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Browser window */}
      <div className="overflow-hidden rounded-xl bg-[#202124] shadow-2xl ring-1 ring-white/10">
        {/* Tab strip */}
        <div className="flex items-end gap-2 bg-[#202124] px-3 pt-2">
          <div className="flex items-center gap-2 rounded-t-lg bg-[#323639] px-4 py-2 text-sm text-white/80">
            <span className="text-base">{config.branding.logo}</span>
            <span className="max-w-[160px] truncate">
              {phase === "download" ? dp.title : phase === "search" ? "Search" : "New Tab"}
            </span>
            <button className="ml-1 text-white/40 hover:text-white">×</button>
          </div>
          <div className="mb-1 text-white/30">+</div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-[#323639] px-3 py-2">
          <div className="flex gap-3 text-white/50">
            <span className="hover:text-white">‹</span>
            <span className="hover:text-white">›</span>
            <button
              onClick={() => phase !== "address" && setPhase("address")}
              className="hover:text-white"
            >
              ↻
            </button>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-full bg-[#202124] px-4 py-1.5 text-sm">
            <span className="text-emerald-400">🔒</span>
            {phase === "address" ? (
              <input
                ref={inputRef}
                value={query}
                disabled={typing}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setNudge(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder="Search or enter a URL"
                className="w-full bg-transparent text-white/90 outline-none placeholder:text-white/30"
                autoFocus
              />
            ) : (
              <span className="w-full truncate text-white/80">{addressUrl}</span>
            )}
          </div>
          <div className="h-7 w-7 rounded-full bg-white/10" />
        </div>

        {/* Body */}
        <div className="relative h-[460px] overflow-hidden bg-white text-[#202124]">
          <AnimatePresence mode="wait">
            {phase === "address" && (
              <motion.div
                key="address"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center"
              >
                <div className="text-6xl">{config.branding.logo}</div>
                <div className="text-lg text-white/60">Search for the OS you want to install</div>
                <button
                  onClick={() => setTyping(true)}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-soft"
                >
                  Skip typing — search “{dp.searchTerm}”
                </button>
              </motion.div>
            )}

            {phase === "search" && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto px-8 py-6"
              >
                <div className="mb-4 text-sm text-[#5f6368]">
                  About {results.length * 840_000 + 1200} results ({((Math.random() * 0.4) + 0.3).toFixed(2)} seconds)
                </div>
                <div className="space-y-5">
                  {results.map((r) => (
                    <button
                      key={r.url}
                      onClick={() => {
                        if (r.official) {
                          setNudge(null);
                          setPhase("download");
                        } else {
                          setNudge("Hmm, let's stick with the official source for safety.");
                        }
                      }}
                      className={`block w-full text-left ${r.official ? "rounded-lg ring-2 ring-accent/60 bg-accent/5 p-2" : ""}`}
                    >
                      <div className="text-xs text-[#5f6368]">{r.url}</div>
                      <div
                        className={`text-lg ${r.official ? "text-accent" : "text-[#1a0dab]"} hover:underline`}
                      >
                        {r.title}
                      </div>
                      <div className="text-sm text-[#4d5156]">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "download" && (
              <motion.div
                key="download"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center"
                style={{ background: `linear-gradient(180deg, ${config.branding.surface}, #0b0b0f)` }}
              >
                <div className="text-7xl drop-shadow-[0_0_24px_rgba(255,255,255,0.25)]">
                  {config.branding.logo}
                </div>
                <h1 className="text-3xl font-bold text-white">{dp.title}</h1>
                {dp.versions && (
                  <div className="flex flex-col items-center gap-1">
                    <label className="text-xs uppercase tracking-wide text-white/50">
                      {dp.selectorLabel}
                    </label>
                    <select
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    >
                      {dp.versions.map((v) => (
                        <option key={v} className="text-black">
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={() => setPhase("downloading")}
                  className="rounded-xl px-8 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.03]"
                  style={{ background: config.branding.accent }}
                >
                  {dp.cta}
                </button>
                <p className="max-w-md text-sm text-white/60">{dp.blurb}</p>
              </motion.div>
            )}

            {phase === "downloading" && (
              <motion.div
                key="downloading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center"
                style={{ background: `linear-gradient(180deg, ${config.branding.surface}, #0b0b0f)` }}
              >
                <div className="text-center text-white/70">Preparing your download…</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Browser download chip (bottom-left) */}
          <AnimatePresence>
            {phase === "downloading" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-4 w-80 rounded-lg bg-white/95 p-3 shadow-xl ring-1 ring-black/10 text-left"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-[#202124]">
                  <span>📄</span>
                  <span className="truncate">{config.iso.filename}</span>
                  {progress >= 100 && <span className="ml-auto text-emerald-600">✓</span>}
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-gray-200">
                  <div
                    className="h-full rounded bg-accent transition-[width] duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-[#5f6368]">
                  <span>{progress >= 100 ? "Download complete" : `${Math.floor(progress)}%`}</span>
                  <span>{config.iso.size}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nudge / helper */}
      <AnimatePresence>
        {nudge && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto mt-4 max-w-md rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-center text-sm text-amber-200"
          >
            {nudge}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between text-sm text-white/50">
        <span>
          {phase === "address" && "Type a search or hit “Skip typing”."}
          {phase === "search" && "Click the official result to continue."}
          {phase === "download" && "Click the download button to grab the ISO."}
          {phase === "downloading" && "Your ISO is downloading…"}
        </span>
        <button className="btn-ghost" onClick={onComplete}>
          Skip this scene →
        </button>
      </div>
    </div>
  );
}
