import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const ProjectorCtx = createContext({ on: false, toggle: () => {} });

export function useProjector() {
  return useContext(ProjectorCtx);
}

export function ProjectorProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(() => localStorage.getItem("projector") === "1");

  useEffect(() => {
    document.body.classList.toggle("projector", on);
    localStorage.setItem("projector", on ? "1" : "0");
  }, [on]);

  function toggle() {
    setOn((v) => !v);
  }

  return (
    <ProjectorCtx.Provider value={{ on, toggle }}>
      {children}
    </ProjectorCtx.Provider>
  );
}
