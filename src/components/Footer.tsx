import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GITHUB_REPO, GITHUB_URL, GITHUB_API } from "../data/repo";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export default function Footer() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(GITHUB_API)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && typeof d.stargazers_count === "number") {
          setStars(d.stargazers_count);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <footer className="mt-24 px-6 pb-10 text-center text-sm">
      {/* Gradient divider */}
      <div className="mx-auto max-w-3xl h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent mb-10" />

      {/* GitHub CTA pill */}
      <motion.a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-white/70 hover:text-white hover:bg-white/[0.07] hover:border-white/[0.14] hover:shadow-[0_0_30px_-8px] hover:shadow-accent/20 transition-all duration-300 cursor-pointer"
      >
        <GitHubIcon />
        <span className="font-medium text-sm">{GITHUB_REPO}</span>
        {stars !== null && (
          <span className="flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.06] px-2 py-0.5 text-xs text-yellow-400/80">
            ★ {stars.toLocaleString()}
          </span>
        )}
      </motion.a>

      <p className="mt-4 text-white/30 text-xs leading-relaxed max-w-md mx-auto">
        If this helped you, star the repo on GitHub. Built as an educational, client-side
        simulation — not a real emulator.
      </p>
    </footer>
  );
}
