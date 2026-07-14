import { Link } from "react-router-dom";
import { useConexionEsp32 } from "../../hooks/useConexionEsp32";
import { useSesion } from "../../hooks/useSesion";
import { formatearMensajeBluetoothTarjeta } from "../../types/protocoloAquaControl";
import "../Configuracion/Configuracion.css";

const PORTAL_SSID = "AquaControl-Setup";
const PORTAL_PASS = "aquacontrol";
const PORTAL_URL = "http://192.168.4.1";

export default function ConfigurarEsp32() {
  const { sesion } = useSesion();
  const {
    tanquesDisponibles,
    tanqueSeleccionado,
    setTanqueSeleccionado,
    numeroSeleccionado,
    red,
    setRed,
    clave,
    setClave,
    estado,
    mensaje,
    enviarConfiguracion,
  } = useConexionEsp32(sesion?.usuario ?? null);

  const preview =
    numeroSeleccionado > 0 && red
      ? formatearMensajeBluetoothTarjeta(
          red,
          clave || "••••",
          numeroSeleccionado,
        )
      : "RED,CLAVE,numeroTanque";

  if (!sesion) {
    return (
      <div className="config-pagina">
        <header className="config-pagina__header">
          <Link to="/" className="config-pagina__volver">
            ← Dashboard
          </Link>
          <h1>Configurar tarjeta ESP32</h1>
          <p className="config-pagina__mensaje">
            Primero valida USUARIO + clave y crea los tanques en{" "}
            <Link to="/configuracion">Configuración inicial</Link>.
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="config-pagina">
      <header className="config-pagina__header">
        <Link to="/" className="config-pagina__volver">
          ← Dashboard
        </Link>
        <h1>Tarjeta ESP32 — {sesion.usuario}</h1>
        <p className="config-pagina__subtitulo">
          En <b>iPhone</b> no funciona Bluetooth desde Safari. Usa el portal WiFi
          de la tarjeta (pasos abajo).
        </p>
      </header>

      <section className="config-pagina__paso config-pagina__aviso config-pagina__aviso--info">
        <h2>📱 iPhone — portal WiFi (método correcto)</h2>
        <ol style={{ margin: 0, paddingLeft: 20, color: "#b9c7de", lineHeight: 1.7 }}>
          <li>
            En la app: crea el tanque Nº <b>{numeroSeleccionado || "…"}</b> en{" "}
            <Link to="/configuracion">Configuración</Link> (obligatorio antes).
          </li>
          <li>
            Sube el firmware actualizado al ESP32 (una vez, con PC).
          </li>
          <li>
            Si la tarjeta ya tenía WiFi mal guardado: en{" "}
            <code>secrets.h</code> pon <code>BORRAR_EEPROM_AL_INICIAR 1</code>,
            sube firmware, luego vuelve a <code>0</code>.
          </li>
          <li>
            Enciende la ESP32 y espera ~10 s.
          </li>
          <li>
            iPhone → <b>Ajustes → Wi‑Fi</b> → red{" "}
            <code>{PORTAL_SSID}</code> (clave <code>{PORTAL_PASS}</code>).
          </li>
          <li>
            iOS puede mostrar <b>«Iniciar sesión en la red Wi‑Fi»</b> — ábrelo.
            Si no aparece, abre Safari y escribe exactamente:{" "}
            <code>{PORTAL_URL}</code> (sin https).
          </li>
          <li>
            En el formulario: RED y clave de tu WiFi <b>2.4 GHz</b> (no 5 GHz) y
            tanque Nº <b>{numeroSeleccionado || "…"}</b>.
          </li>
          <li>
            Pulsa «Guardar y conectar», espera el mensaje de confirmación.
          </li>
          <li>
            Vuelve al WiFi normal del iPhone y abre el dashboard.
          </li>
        </ol>
      </section>

      <section className="config-pagina__paso config-pagina__aviso">
        <h2>⚠️ Si no funciona en iPhone</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#b9c7de", lineHeight: 1.6 }}>
          <li>
            «Sin internet» en <code>{PORTAL_SSID}</code> es normal — no cambies
            de red hasta guardar.
          </li>
          <li>
            Desactiva datos móviles un momento si Safari no abre el portal.
          </li>
          <li>
            La red del campo debe ser <b>2.4 GHz</b> y la clave correcta.
          </li>
          <li>
            El tanque debe existir en Firebase antes (app → Configuración).
          </li>
          <li>
            Revisa en Firebase:{" "}
            <code>
              {sesion.usuario}/TANQUES/T-
              {String(numeroSeleccionado).padStart(2, "0")}/conectado
            </code>{" "}
            debe pasar a <code>1</code>.
          </li>
        </ul>
      </section>

      <section className="config-pagina__paso">
        <h2>1. Número de tanque (tarjeta)</h2>
        {tanquesDisponibles.length === 0 ? (
          <p>
            No hay tanques.{" "}
            <Link to="/configuracion">Créalos en Configuración</Link>.
          </p>
        ) : (
          <>
            <select
              value={tanqueSeleccionado}
              onChange={(e) => setTanqueSeleccionado(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #2a3f5f",
                background: "#0b1220",
                color: "#e8eef8",
              }}
            >
              {tanquesDisponibles.map((id) => (
                <option key={id} value={id}>
                  Tanque Nº {numeroDesdeId(id)} — {id}
                </option>
              ))}
            </select>
            <p>
              Esta tarjeta quedará asignada al <b>tanque Nº {numeroSeleccionado}</b>.
            </p>
          </>
        )}
      </section>

      <section className="config-pagina__paso">
        <h2>2. RED y CLAVE (para copiar o portal)</h2>
        <div className="config-pagina__form">
          <label>
            RED
            <input
              value={red}
              onChange={(e) => setRed(e.target.value)}
              placeholder="SSID de la red 2.4 GHz"
            />
          </label>
          <label>
            CLAVE
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Contraseña WiFi"
            />
          </label>
        </div>
        <p>
          Línea equivalente: <code>{preview}</code>
        </p>

        <div className="config-pagina__aviso config-pagina__aviso--info">
          <p>
            <b>PC (Monitor Serie USB):</b> copia la línea y pégala en Arduino IDE
            (115200, Both NL &amp; CR). En iPhone no uses este método si no tienes
            PC conectado.
          </p>
        </div>

        <div className="config-pagina__acciones">
          <button
            type="button"
            className="config-pagina__btn primario"
            disabled={tanquesDisponibles.length === 0 || !red.trim() || !clave.trim()}
            onClick={async () => {
              const linea = formatearMensajeBluetoothTarjeta(
                red.trim(),
                clave.trim(),
                numeroSeleccionado,
              );
              try {
                await navigator.clipboard.writeText(linea);
                alert(
                  `Copiado:\n${linea}\n\nPégalo en Monitor Serie USB (115200) y pulsa Enter.`,
                );
              } catch {
                prompt("Copia esta línea al Monitor Serie USB:", linea);
              }
            }}
          >
            Copiar línea (solo PC / USB)
          </button>
          <button
            type="button"
            className="config-pagina__btn secundario"
            disabled={tanquesDisponibles.length === 0}
            onClick={() => enviarConfiguracion({ simularBluetooth: true })}
          >
            Simular en app (sin tarjeta real)
          </button>
        </div>
      </section>

      <section className="config-pagina__paso">
        <h2>Estado</h2>
        <p>{mensaje || "Listo para configurar tarjeta."}</p>
        <p>
          Estado: <b>{estado}</b>
        </p>
      </section>
    </div>
  );
}

function numeroDesdeId(id: string): number {
  const match = id.match(/^T-(\d+)$/i);
  return match ? Number(match[1]) : 0;
}
