import "./Dashboard.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GraficasPanel from "../../components/GraficasPanel/GraficasPanel";
import IndicadoresSensores from "../../components/IndicadoresSensores/IndicadoresSensores";
import TankView from "../../components/TankView/TankView";
import { useEstadoEsp32 } from "../../hooks/useEstadoEsp32";
import { useTanques } from "../../hooks/useTanques";
import { claseEquipo, etiquetaEquipo } from "../../utils/estadoEquipo";

export default function Dashboard() {
  const { tanques, cargando, sesion } = useTanques();
  const { online: esp32Online, tanquesOnline } = useEstadoEsp32();
  const [tanqueActivoId, setTanqueActivoId] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (tanques.length === 0) {
      setTanqueActivoId(null);
      return;
    }

    const sigueExistiendo = tanques.some((t) => t.id === tanqueActivoId);
    if (!tanqueActivoId || !sigueExistiendo) {
      const primeroActivo = tanques.find((t) => t.enUso) ?? tanques[0];
      setTanqueActivoId(primeroActivo.id);
    }
  }, [tanques, tanqueActivoId]);

  const tanque = tanques.find((t) => t.id === tanqueActivoId);

  if (cargando) {
    return (
      <div className="dashboard dashboard-cargando">
        <Link to="/configuracion" className="topbar-config">
          ⚙ Configuración
        </Link>
        <p>Cargando tanques...</p>
      </div>
    );
  }

  if (!tanque) {
    return (
      <div className="dashboard dashboard-vacio">
        <aside className="sidebar">
          <h2>AquaControl</h2>
          <button className="menuActivo">🏠 Dashboard</button>
          <Link to="/configuracion" className="menuConfigurar">
            ⚙ Configuración
          </Link>
          <Link to="/configurar-esp32" className="menuConfigurar">
            📡 ESP32 / WiFi
          </Link>
        </aside>
        <main className="contenido">
          <Link to="/configuracion" className="topbar-config topbar-config--flotante">
            ⚙ Configuración
          </Link>
          <div className="mensaje-vacio">
            <h1>Sin tanques</h1>
            <p>
              Inicia sesión y crea los tanques en Configuración (la app los
              registra en Firebase).
            </p>
            <Link to="/configuracion" className="link-configurar">
              Ir a Configuración inicial
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <button
        type="button"
        className="menu-toggle"
        aria-label="Abrir menú"
        onClick={() => setMenuAbierto((abierto) => !abierto)}
      >
        ☰
      </button>

      {menuAbierto && (
        <button
          type="button"
          className="menu-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside className={`sidebar ${menuAbierto ? "sidebar--abierto" : ""}`}>
        <h2>AquaControl</h2>
        <button className="menuActivo" onClick={() => setMenuAbierto(false)}>
          🏠 Dashboard
        </button>
        <button onClick={() => setMenuAbierto(false)}>🐟 Producción</button>
        <button onClick={() => setMenuAbierto(false)}>💧 Calidad del Agua</button>
        <button onClick={() => setMenuAbierto(false)}>🫧 Nanoburbujas</button>
        <button onClick={() => setMenuAbierto(false)}>🍽 Alimentación</button>
        <button onClick={() => setMenuAbierto(false)}>⚙ Equipos</button>
        <button onClick={() => setMenuAbierto(false)}>🚨 Alarmas</button>
        <button onClick={() => setMenuAbierto(false)}>📈 Reportes</button>
        <Link
          to="/configuracion"
          className="menuConfigurar"
          onClick={() => setMenuAbierto(false)}
        >
          ⚙ Configuración
        </Link>
        <Link
          to="/configurar-esp32"
          className="menuConfigurar"
          onClick={() => setMenuAbierto(false)}
        >
          📡 ESP32 / WiFi
        </Link>
      </aside>

      <main className="contenido">
        <div className="bloqueFijo">
          <header className="topbar">
            <div className="topbar-titulo">
              <h1>AquaControl</h1>
              <span className="topbar-tanque">
                {tanque.nombre}
                {tanque.estado === "alarma" && (
                  <span className="badge-alarma"> ALARMA</span>
                )}
              </span>
            </div>
            <div className="topbar-acciones">
              <Link to="/configuracion" className="topbar-config">
                ⚙ Config
              </Link>
              <div className={`estadoSistema ${esp32Online ? "online" : "offline"}`}>
                {esp32Online ? "🟢 ONLINE" : "🔴 OFFLINE"}
              </div>
            </div>
          </header>

          <div className="panelTanques">
            <TankView
              tanques={tanques}
              tanqueActivoId={tanqueActivoId}
              onSeleccionarTanque={setTanqueActivoId}
            />
          </div>

          <IndicadoresSensores
            sensores={tanque.sensores}
            enUso={tanque.enUso}
            compacto
          />
        </div>

        <div className="bloqueScroll">
          <GraficasPanel
            tanque={tanque}
            usuario={sesion?.usuario ?? null}
          />

          <section className="panelesInferiores">
          <div className="panel">
            <h3>Equipos — {tanque.nombre}</h3>
            <table className="tablaEquipos">
              <tbody>
                <tr>
                  <td>Recirculador</td>
                  <td className={claseEquipo(tanque.equipos.recirculador)}>
                    {etiquetaEquipo(tanque.equipos.recirculador)}
                  </td>
                </tr>
                <tr>
                  <td>Nanoburbujas</td>
                  <td className={claseEquipo(tanque.equipos.nanoburbujas)}>
                    {etiquetaEquipo(tanque.equipos.nanoburbujas)}
                  </td>
                </tr>
                <tr>
                  <td>Alimentador</td>
                  <td className={claseEquipo(tanque.equipos.alimentador)}>
                    {etiquetaEquipo(tanque.equipos.alimentador)}
                  </td>
                </tr>
                <tr>
                  <td>Iluminación</td>
                  <td className={claseEquipo(tanque.equipos.iluminacion)}>
                    {etiquetaEquipo(tanque.equipos.iluminacion)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h3>Producción — {tanque.nombre}</h3>
            <table className="tablaEquipos">
              <tbody>
                <tr>
                  <td>Biomasa</td>
                  <td>{tanque.produccion.biomasa} kg</td>
                </tr>
                <tr>
                  <td>Peces</td>
                  <td>{tanque.produccion.peces}</td>
                </tr>
                <tr>
                  <td>Peso promedio</td>
                  <td>{tanque.produccion.pesoPromedio} g</td>
                </tr>
                <tr>
                  <td>Conversión</td>
                  <td>{tanque.produccion.conversion}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h3>Alarmas — {tanque.nombre}</h3>
            {tanque.alarmas.map((alarma, indice) => (
              <div
                key={`${tanque.id}-alarma-${indice}`}
                className={`alarma ${alarma.tipo === "ok" ? "ok" : ""} ${alarma.tipo === "alerta" ? "alerta" : ""}`}
              >
                {alarma.tipo === "ok" && "✔ "}
                {alarma.tipo === "alerta" && "⚠ "}
                {alarma.mensaje}
              </div>
            ))}
          </div>
        </section>

        <footer className="footer">
          <div>
            Firebase :{" "}
            <span className={sesion ? "on" : "off"}>
              {sesion ? `/${sesion.usuario}/` : "Sin sesión"}
            </span>
          </div>
          <div>
            ESP32 :{" "}
            <span className={esp32Online ? "on" : "off"}>
              {esp32Online
                ? `${tanquesOnline} tarjeta(s) en línea`
                : "SIN SEÑAL"}
            </span>
          </div>
          <div>
            Tanques activos : <b>{tanques.filter((t) => t.enUso).length}</b> /{" "}
            {tanques.length}
          </div>
          <div>
            Última actualización : {new Date().toLocaleTimeString()}
          </div>
        </footer>
        </div>
      </main>
    </div>
  );
}
