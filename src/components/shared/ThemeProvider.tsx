import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface Theme {
  id: string;
  name: string;
  icon: string;
  /** CSS class applied to <body> */
  bodyClass: string;
}

export const THEMES: Theme[] = [
  { id: "dark",           name: "Dark",           icon: "🌙",  bodyClass: "theme-dark" },
  { id: "light",          name: "Light",          icon: "☀️",  bodyClass: "theme-light" },
  { id: "projector",      name: "Projector",      icon: "📽️",  bodyClass: "theme-projector" },
  { id: "high-contrast",  name: "Hi-Contrast",    icon: "🔲",  bodyClass: "theme-hc" },
  { id: "ocean",          name: "Ocean",           icon: "🌊",  bodyClass: "theme-ocean" },
  { id: "neon",           name: "Neon",            icon: "💜",  bodyClass: "theme-neon" },
  { id: "midnight",       name: "Midnight",        icon: "🌌",  bodyClass: "theme-midnight" },
  { id: "warm",           name: "Warm",            icon: "🔥",  bodyClass: "theme-warm" },
  { id: "minimal",        name: "Minimal",         icon: "◻️",  bodyClass: "theme-minimal" },
];

const ThemeCtx = createContext({
  theme: THEMES[0],
  setTheme: (_id: string) => {},
  cycleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem("theme") ?? "dark");
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    // Remove all theme classes, apply current
    THEMES.forEach((t) => document.body.classList.remove(t.bodyClass));
    document.body.classList.add(theme.bodyClass);
    localStorage.setItem("theme", theme.id);
  }, [theme]);

  function setTheme(id: string) {
    setThemeId(id);
  }

  function cycleTheme() {
    const idx = THEMES.findIndex((t) => t.id === themeId);
    const next = (idx + 1) % THEMES.length;
    setThemeId(THEMES[next].id);
  }

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}
