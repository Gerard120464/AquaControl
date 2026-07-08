import "./Dashboard.css";
import { useEffect, useState } from "react";
import GraficasPanel from "../../components/GraficasPanel/GraficasPanel";
import TankView from "../../components/TankView/TankView";
import { useTanques } from "../../hooks/useTanques";
import { claseEquipo, etiquetaEquipo } from "../../utils/estadoEquipo";

export default function Dashboard() {
  const { tanques, cargando } = useTanques();
  const [tanqueActivoId, setTanqueActivoId] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (tanques.length === 0) {
      setTanqueActivoId(null);
      return;
    }

    const sigueExistiendo = tanques.some((t) => t.id === tanqueActivoId);
    if (!tanqueActivoId || !sigueExistiendo) {
      setTanqueActivoId(tanques[0].id);
    }
  }, [tanques, tanqueActivoId]);

  const tanque = tanques.find((t) => t.id === tanqueActivoId);

  if (cargando) {
    return (
      <div className="dashboard dashboard-cargando">
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
        </aside>
        <main className="contenido">
          <div className="mensaje-vacio">
            <h1>Sin tanques</h1>
            <p>Crea tanques en Firebase para verlos aquí.</p>
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
      </aside>

      <main className="contenido">
        <header className="topbar">
          <div>
            <h1>AquaControl</h1>
            <small>
              Tanque: <b>{tanque.nombre}</b>
              {tanque.estado === "alarma" && (
                <span className="badge-alarma"> — ALARMA</span>
              )}
            </small>
          </div>
          <div className="estadoSistema">🟢 ONLINE</div>
        </header>

        <section className="indicadores">
          <div className="cardIndicador">
            <span>🌡 Temperatura</span>
            <h2>{tanque.sensores.temperatura} °C</h2>
          </div>
          <div className="cardIndicador">
            <span>💨 Oxígeno</span>
            <h2>{tanque.sensores.oxigeno} mg/L</h2>
          </div>
          <div className="cardIndicador">
            <span>🧪 pH</span>
            <h2>{tanque.sensores.ph}</h2>
          </div>
          <div className="cardIndicador">
            <span>💧 TDS</span>
            <h2>{tanque.sensores.tds}</h2>
          </div>
          <div className="cardIndicador">
            <span>⚡ Conductividad</span>
            <h2>{tanque.sensores.ec}</h2>
          </div>
          <div className="cardIndicador">
            <span>🧪 NH₄</span>
            <h2>{tanque.sensores.nh4}</h2>
          </div>
        </section>

        <section className="centro">
          <div className="panelTanques">
            <TankView
              tanques={tanques}
              tanqueActivoId={tanqueActivoId}
              onSeleccionarTanque={setTanqueActivoId}
            />
          </div>

          <GraficasPanel tanque={tanque} />
        </section>

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
            Firebase : <span className="off">PENDIENTE</span>
          </div>
          <div>
            ESP32 : <span className="off">PENDIENTE</span>
          </div>
          <div>
            Tanques activos : <b>{tanques.length}</b>
          </div>
          <div>
            Última actualización : {new Date().toLocaleTimeString()}
          </div>
        </footer>
      </main>
    </div>
  );
}
