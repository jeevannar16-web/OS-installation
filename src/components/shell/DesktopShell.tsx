import { useEffect, useState } from "react";

export type AppInfo = { name: string; icon: string };

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DesktopShell({
  activeApp,
  children,
}: {
  activeApp: AppInfo;
  children: React.ReactNode;
}) {
  const clock = useClock();

  return (
    <div className="relative h-[680px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
      {/* Wallpaper */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 20% 0%, #241b46 0%, transparent 60%), radial-gradient(900px 600px at 90% 100%, #0b2a3a 0%, transparent 55%), linear-gradient(160deg, #0a0a0f 0%, #12101c 100%)",
        }}
      />
      <div
        className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent/30 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -right-16 bottom-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"
        aria-hidden
      />

      {/* Window area */}
      <div className="relative z-10 flex h-full justify-center overflow-y-auto px-4 pt-6 pb-20">
        {children}
      </div>

      {/* Taskbar */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex h-12 items-center gap-3 border-t border-white/10 bg-black/60 px-4 backdrop-blur">
        <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-sm text-white/90">
          <span>{activeApp.icon}</span>
          <span>{activeApp.name}</span>
        </div>
        <div className="ml-auto text-xs text-white/50">{clock}</div>
      </div>
    </div>
  );
}
