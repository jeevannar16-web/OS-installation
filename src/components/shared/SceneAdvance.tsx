import { createContext, useContext, useRef, type ReactNode } from "react";

type AdvanceFn = () => void;

const SceneAdvanceCtx = createContext({
  register: (_fn: AdvanceFn) => {},
  clear: () => {},
  current: null as AdvanceFn | null,
});

export function useSceneAdvance() {
  return useContext(SceneAdvanceCtx);
}

export function SceneAdvanceProvider({ children }: { children: ReactNode }) {
  const fnRef = useRef<AdvanceFn | null>(null);

  function register(fn: AdvanceFn) {
    fnRef.current = fn;
  }
  function clear() {
    fnRef.current = null;
  }

  return (
    <SceneAdvanceCtx.Provider value={{ register, clear, current: fnRef.current }}>
      {children}
    </SceneAdvanceCtx.Provider>
  );
}
