import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SimulationPage from "./pages/SimulationPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/:os/:path" element={<SimulationPage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
