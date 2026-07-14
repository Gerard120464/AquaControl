import { Link } from "react-router-dom";
import { useConexionEsp32 } from "../../hooks/useConexionEsp32";
import { useSesion } from "../../hooks/useSesion";
import { formatearMensajeBluetoothTarjeta } from "../../types/protocoloAquaControl";
import "../Configuracion/Configuracion.css";

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
          Una tarjeta por tanque. En campo con <b>iPhone</b> usa el portal WiFi de
          la ESP32. Con PC también puedes usar Monitor Serie USB.
        </p>
      </header>

      <section className="config-pagina__paso config-pagina__aviso config-pagina__aviso--info">
        <h2>📱 iPhone (sin PC) — recomendado en campo</h2>
        <ol style={{ margin: 0, paddingLeft: 20, color: "#b9c7de", lineHeight: 1.6 }}>
          <li>
            Sube el firmware con portal (una vez, con PC o quien te ayude).
          </li>
          <li>
            Enciende la ESP32 sin configurar (o con{" "}
            <code>BORRAR_EEPROM_AL_INICIAR 1</code> en secrets.h).
          </li>
          <li>
            iPhone → <b>Ajustes → Wi‑Fi</b> → red{" "}
            <code>AquaControl-Setup</code> (clave <code>aquacontrol</code>).
          </li>
          <li>
            Abre <b>Safari</b> → <code>http://192.168.4.1</code>
          </li>
          <li>
            Completa RED, clave WiFi 2.4 GHz y tanque Nº {numeroSeleccionado || "…"}.
          </li>
          <li>Vuelve al WiFi normal del iPhone y abre el dashboard.</li>
        </ol>
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
        <h2>2. RED y CLAVE (red WiFi)</h2>
        <div className="config-pagina__form">
          <label>
            RED
            <input
              value={red}
              onChange={(e) => setRed(e.target.value)}
              placeholder="SSID de la red"
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
          Línea para la tarjeta: <code>{preview}</code>
        </p>

        <div className="config-pagina__aviso config-pagina__aviso--info">
          <p>
            <b>PC (Monitor Serie):</b> copia la línea y pégala en Arduino IDE
            (115200, Both NL &amp; CR).
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
            Copiar línea (Monitor Serie USB)
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
