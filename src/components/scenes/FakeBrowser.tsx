import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Lock, ArrowLeft, ArrowRight, RotateCcw, FileText, CheckCircle2, Download } from "lucide-react";
import type { OSConfig } from "../../data/types";
import GhostCursor from "../shared/GhostCursor";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Phase = "address" | "search" | "download" | "downloading" | "done";

type Result = {
  title: string;
  url: string;
  snippet: string;
  official?: boolean;
  related?: boolean;
};

function isRelevant(query: string, keywords: string[]): boolean {
  const norm = query.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();
  if (!norm) return false;
  const qt = norm.split(/\s+/).filter((t) => t.length > 1);
  return keywords.some((k) => {
    const kn = k.toLowerCase();
    if (kn.includes(norm) || norm.includes(kn)) return true;
    const kt = kn.split(/\s+/);
    return kt.some((t) => qt.some((q) => t.includes(q) || q.includes(t)));
  });
}

function buildRelevant(config: OSConfig): Result[] {
  const dp = config.downloadPage;
  return [
    {
      title: `${config.branding.name} | The official ${config.branding.name} website`,
      url: dp.url.replace(/^https?:\/\//, ""),
      snippet: dp.blurb,
      official: true,
    },
    {
      title: `How to install ${config.branding.name} (step-by-step guide)`,
      url: `howtogeek.com/how-to-install-${config.id}`,
      snippet: `Everything you need: create the USB, partition your disk, and finish first boot.`,
      related: true,
    },
    {
      title: `${config.branding.name} download (64-bit) — FOSSHub`,
      url: `fosshub.com/${config.id}`,
      snippet: `Mirror downloads and older point releases for ${config.branding.name}.`,
      related: true,
    },
    {
      title: `${config.branding.name} Community Forum`,
      url: `reddit.com/r/${config.id}`,
      snippet: `Talk to other users, share screenshots, and get help with your setup.`,
      related: true,
    },
  ];
}

function buildIrrelevant(): Result[] {
  return [
    {
      title: "Cat — Wikipedia",
      url: "en.wikipedia.org/wiki/Cat",
      snippet:
        "The cat (Felis catus) is a domestic species of small carnivorous mammal.",
    },
    {
      title: "Breaking News — Latest Headlines & Top Stories",
      url: "news.example.com",
      snippet: "The latest national and world news, from politics to entertainment.",
    },
    {
      title: "10-Day Weather Forecast for Your Area",
      url: "weather.example.com",
      snippet: "Hour-by-hour conditions, radar, and severe-weather alerts.",
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
  const { register: registerAdvance } = useSceneAdvance();
  const dp = config.downloadPage;
  const [phase, setPhase] = useState<Phase>("address");
  const [query, setQuery] = useState("");
  const [nudge, setNudge] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [version, setVersion] = useState(dp.versions?.[0] ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showDemo, setShowDemo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const relevant = isRelevant(query, config.searchKeywords);
  const results = relevant ? buildRelevant(config) : buildIrrelevant();
  const didYouMean = dp.searchTerm;

  useEffect(() => {
    if (phase === "downloading") {
      registerAdvance(() => onComplete());
    }
  }, [phase, registerAdvance, onComplete]);

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
  }, [phase, speed, onComplete]);

  const demoSteps: Array<{
    type: "move" | "click" | "drag";
    x: number;
    y: number;
    delay?: number;
    duration?: number;
    dragEndX?: number;
    dragEndY?: number;
    label?: string;
  }> = [
    { type: "move", x: 200, y: 200, delay: 0, duration: 500 },
    { type: "click", x: 200, y: 200, delay: 300, duration: 300 },
    { type: "move", x: 300, y: 300, delay: 500, duration: 400 },
  ];

  function submitSearch() {
    setNudge(null);
    setPhase("search");
  }

  function useSearchTerm() {
    setQuery(dp.searchTerm);
    setNudge(null);
  }

  const addressUrl =
    phase === "address"
      ? "about:blank"
      : phase === "search"
        ? `search.example.com/search?q=${encodeURIComponent(query || dp.searchTerm)}`
        : dp.url.replace(/^https?:\/\//, "");

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-4xl lg:max-w-5xl relative">
      <GhostCursor
        isVisible={showDemo}
        steps={demoSteps}
        onComplete={() => setShowDemo(false)}
      />

      {/* Instruction banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex items-center gap-3"
      >
        <div className="shrink-0 h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Download size={16} className="text-accent" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-white/80">Download the OS installer</div>
          <div className="text-[11px] text-white/40 mt-0.5">
            Search for <span className="text-accent font-medium">"{dp.searchTerm}"</span> and click the official {config.branding.name} download page
          </div>
        </div>
        <button
          onClick={useSearchTerm}
          className="shrink-0 rounded-lg bg-accent/10 border border-accent/20 px-3 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/20 transition-colors"
        >
          Auto-fill
        </button>
        <button
          onClick={() => setShowDemo(true)}
          className="shrink-0 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-[11px] text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          Show guide
        </button>
      </motion.div>

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
            <button className="hover:text-white"><ArrowLeft size={16} /></button>
            <button className="hover:text-white"><ArrowRight size={16} /></button>
            <button onClick={() => phase !== "address" && setPhase("address")} className="hover:text-white">
              <RotateCcw size={14} />
            </button>
          </div>
          <form
            className="flex flex-1 items-center gap-2 rounded-full bg-[#202124] px-4 py-1.5 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
          >
            <Lock size={14} className="text-emerald-400 shrink-0" />
            {phase === "address" || phase === "search" ? (
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setNudge(null);
                }}
                placeholder={`Search for "${dp.searchTerm}"...`}
                className="w-full bg-transparent text-white/90 outline-none placeholder:text-white/30"
                autoFocus
              />
            ) : (
              <span className="w-full truncate text-white/80">{addressUrl}</span>
            )}
            <button type="submit" className="text-white/40 hover:text-white shrink-0" aria-label="Search">
              <Search size={16} />
            </button>
          </form>
          <div className="h-7 w-7 rounded-full bg-white/10" />
        </div>

        {/* Body */}
        <div className="relative h-[460px] lg:h-[560px] xl:h-[640px] overflow-hidden bg-[#0d1117] text-[#c9d1d9]">
          {phase === "address" && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center text-3xl font-bold text-accent">
                {config.branding.logo}
              </div>
              <div className="text-lg font-semibold text-[#e0e0e0]">{config.branding.name} Download</div>
              <p className="text-sm text-[#8b949e] max-w-sm">
                Type <span className="font-medium text-[#e0e0e0]">"{dp.searchTerm}"</span> in the search bar above to find the official download page
              </p>
              <button
                onClick={useSearchTerm}
                className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Search for {dp.searchTerm}
              </button>
            </div>
          )}

          {phase === "search" && (
            <div className="h-full overflow-y-auto px-8 py-6">
              {!relevant && (
                <button
                  onClick={() => {
                    setQuery(didYouMean);
                    setNudge(null);
                  }}
                  className="mb-4 rounded-lg border border-accent/40 bg-accent/5 px-4 py-2 text-left text-sm text-accent hover:bg-accent/10"
                >
                  Did you mean: <span className="font-semibold">{didYouMean}</span>?
                </button>
              )}
              <div className="mb-4 text-sm text-[#8b949e]">
                About {results.length * 840_000 + 1200} results
              </div>
              <div className="space-y-5">
                {results.map((r) => (
                  <button
                    key={r.url}
                    onClick={() => {
                      if (r.official) {
                        setNudge(null);
                        setPhase("download");
                      } else if (r.related) {
                        setNudge("Hmm, let's stick with the official source for safety.");
                      }
                    }}
                    className={`block w-full text-left ${r.official ? "rounded-lg ring-2 ring-accent/60 bg-accent/5 p-2" : ""}`}
                  >
                    <div className="text-xs text-[#8b949e]">{r.url}</div>
                    <div className={`text-lg ${r.official ? "text-accent" : "text-[#58a6ff]"} hover:underline`}>
                      {r.title}
                    </div>
                    <div className="text-sm text-[#8b949e]">{r.snippet}</div>
                    {r.official && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        <CheckCircle2 size={10} /> Official source
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === "download" && (
            <div
              className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center"
              style={{ background: `linear-gradient(180deg, ${config.branding.surface}, #0b0b0f)` }}
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/20 flex items-center justify-center text-4xl font-bold text-accent shadow-lg shadow-accent/20">
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
                      <option key={v} className="text-black">{v}</option>
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
            </div>
          )}

          {phase === "downloading" && (
            <div
              className="flex h-full items-center justify-center"
              style={{ background: `linear-gradient(180deg, ${config.branding.surface}, #0b0b0f)` }}
            >
              <div className="text-center text-white/70">Preparing your download…</div>
            </div>
          )}

          {/* Browser download chip (bottom-left) */}
          <AnimatePresence>
            {phase === "downloading" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-4 w-80 rounded-lg bg-[#161b22] p-3 shadow-xl ring-1 ring-white/10 text-left"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-[#c9d1d9]">
                  <FileText size={16} className="text-[#8b949e] shrink-0" />
                  <span className="truncate">{config.iso.filename}</span>
                  {progress >= 100 && <CheckCircle2 size={16} className="ml-auto text-emerald-500 shrink-0" />}
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[#30363d]">
                  <div
                    className="h-full rounded bg-accent transition-[width] duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-[#8b949e]">
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
    </div>
  );
}
