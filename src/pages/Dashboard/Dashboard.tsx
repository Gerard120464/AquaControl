import "./Dashboard.css";
import { useState } from "react";
import TankView from "../../components/TankView/TankView";

type Sensor = {
  temperatura: number;
  oxigeno: number;
  ph: number;
  tds: number;
  ec: number;
  nh4: number;
};

type Tanque = {
  id: number;
  nombre: string;
  estado: "normal" | "alarma";
  sensores: Sensor;
};

const tanques: Tanque[] = [
  {
    id: 1,
    nombre: "T-01",
    estado: "normal",
    sensores: {
      temperatura: 13.2,
      oxigeno: 9.8,
      ph: 7.20,
      tds: 112,
      ec: 215,
      nh4: 0.01,
    },
  },
  {
    id: 2,
    nombre: "T-02",
    estado: "normal",
    sensores: {
      temperatura: 12.4,
      oxigeno: 8.9,
      ph: 7.05,
      tds: 124,
      ec: 228,
      nh4: 0.02,
    },
  },
  {
    id: 3,
    nombre: "T-03",
    estado: "alarma",
    sensores: {
      temperatura: 15.8,
      oxigeno: 6.4,
      ph: 6.82,
      tds: 155,
      ec: 294,
      nh4: 0.08,
    },
  },
  {
    id: 4,
    nombre: "T-04",
    estado: "normal",
    sensores: {
      temperatura: 11.9,
      oxigeno: 10.4,
      ph: 7.38,
      tds: 98,
      ec: 194,
      nh4: 0.01,
    },
  },
];

export default function Dashboard() {

  const [tanqueActivo, setTanqueActivo] = useState(1);

console.log("Tanque activo =", tanqueActivo);

  const tanque = tanques.find(
    (t) => t.id === tanqueActivo
  )!;

  return (

    <div className="dashboard">

      <aside className="sidebar">

        <h2>AquaControl</h2>

        <button className="menuActivo">🏠 Dashboard</button>

        <button>🐟 Producción</button>

        <button>💧 Calidad del Agua</button>

        <button>🫧 Nanoburbujas</button>

        <button>🍽 Alimentación</button>

        <button>⚙ Equipos</button>

        <button>🚨 Alarmas</button>

        <button>📈 Reportes</button>

      </aside>

      <main className="contenido">

        <header className="topbar">

          <div>

            <h1>AquaControl</h1>

            <small>

              Tanque seleccionado:
              <b> {tanque.nombre}</b>

            </small>

          </div>

          <div className="estadoSistema">

            🟢 ONLINE

          </div>

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
              tanqueActivo={tanqueActivo}
              setTanqueActivo={setTanqueActivo}
            />

          </div>

          <div className="panelGrafica">

            <h2>Oxígeno Disuelto</h2>

            <div className="grafica">

              Gráfica en tiempo real

            </div>

          </div>

        </section>
                <section className="panelesInferiores">

          <div className="panel">

            <h3>Equipos</h3>

            <table className="tablaEquipos">

              <tbody>

                <tr>
                  <td>Recirculador</td>
                  <td className="on">ENCENDIDO</td>
                </tr>

                <tr>
                  <td>Nanoburbujas</td>
                  <td className="on">ENCENDIDO</td>
                </tr>

                <tr>
                  <td>Alimentador</td>
                  <td className="off">ESPERA</td>
                </tr>

                <tr>
                  <td>Iluminación</td>
                  <td className="on">ACTIVA</td>
                </tr>

              </tbody>

            </table>

          </div>

          <div className="panel">

            <h3>Producción</h3>

            <table className="tablaEquipos">

              <tbody>

                <tr>
                  <td>Biomasa</td>
                  <td>520 kg</td>
                </tr>

                <tr>
                  <td>Peces</td>
                  <td>3250</td>
                </tr>

                <tr>
                  <td>Peso promedio</td>
                  <td>160 g</td>
                </tr>

                <tr>
                  <td>Conversión</td>
                  <td>1.08</td>
                </tr>

              </tbody>

            </table>

          </div>

          <div className="panel">

            <h3>Alarmas</h3>

            <div className="alarma ok">

              ✔ Sin alarmas activas

            </div>

            <div className="alarma">

              Temperatura dentro del rango

            </div>

            <div className="alarma">

              Oxígeno estable

            </div>

          </div>

        </section>

        <footer className="footer">

          <div>

            Firebase :
            <span className="on">
              CONECTADO
            </span>

          </div>

          <div>

            ESP32 :
            <span className="on">
              ONLINE
            </span>

          </div>

          <div>

            Última actualización :

            {new Date().toLocaleTimeString()}

          </div>

        </footer>

      </main>

    </div>

  );

}


