import "./App.css";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import Configuracion from "./pages/Configuracion/Configuracion";
import ConfigurarEsp32 from "./pages/ConfigurarEsp32/ConfigurarEsp32";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/configurar-esp32" element={<ConfigurarEsp32 />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
