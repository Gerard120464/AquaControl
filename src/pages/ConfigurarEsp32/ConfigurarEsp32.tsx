import { Link } from "react-router-dom";
import { useConexionEsp32 } from "../../hooks/useConexionEsp32";
import { useDiagnosticoTarjeta } from "../../hooks/useDiagnosticoTarjeta";
import {
  claseEstadoDiagnostico,
  etiquetaEstadoDiagnostico,
} from "../../services/diagnosticoFirebase";
import { formatearMensajeConfigTarjeta } from "../../types/protocoloAquaControl";
import "../Configuracion/Configuracion.css";

const PORTAL_SSID = "AquaControl-Setup";
const PORTAL_PASS = "aquacontrol";
const PORTAL_URL = "http://192.168.4.1";

export default function ConfigurarEsp32() {
  const {
    paso,
    accesoVerificado,
    tanqueListo,
    wifiHabilitado,
    tanquesDisponibles,
    tanqueSeleccionado,
    numeroSeleccionado,
    usuario,
    setUsuario,
    claveApp,
    setClaveApp,
    red,
    setRed,
    claveWifi,
    setClaveWifi,
    estado,
    mensaje,
    cargando,
    verificarUsuarioClave,
    confirmarTanque,
    agregarNuevoTanque,
    enviarConfiguracion,
    reiniciarFlujo,
  } = useConexionEsp32();

  const usuarioDiag = usuario.trim().toUpperCase();
  const { activo: diagnostico } = useDiagnosticoTarjeta(
    accesoVerificado ? usuarioDiag : null,
    tanqueSeleccionado,
  );
  const claseDiag = claseEstadoDiagnostico(diagnostico?.estado);

  const preview =
    wifiHabilitado && red && claveApp
      ? formatearMensajeConfigTarjeta({
          red,
          claveWifi: claveWifi || "••••",
          usuario: usuarioDiag,
          claveApp: "••••",
          numeroTanque: numeroSeleccionado,
        })
      : "RED,CLAVE_WIFI,USUARIO,CLAVE_APP,numeroTanque";

  const puedeEnviar =
    wifiHabilitado && Boolean(red.trim() && claveWifi.trim() && claveApp.trim());

  return (
    <div className="config-pagina">
      <header className="config-pagina__header">
        <Link to="/" className="config-pagina__volver">
          ← Dashboard
        </Link>
        <h1>Configurar tarjeta nueva</h1>
        <p className="config-pagina__subtitulo">
          Solo para vincular una <b>tarjeta ESP32 nueva</b>. Verifica USUARIO,
          elige o crea tanque, luego ingresa la red WiFi del campo.
        </p>
      </header>

      <section className="config-pagina__paso config-pagina__aviso config-pagina__aviso--info">
        <p style={{ margin: 0, color: "#b9c7de", lineHeight: 1.6 }}>
          <b>Identidad tarjeta:</b> USUARIO + RED WiFi + tanque Nº
        </p>
      </section>

      {/* PASO 1 */}
      <section
        className={`config-pagina__paso${paso === 1 ? " config-pagina__paso--activo" : ""}`}
      >
        <h2>Paso 1 — USUARIO y clave (app)</h2>
        <p style={{ color: "#9eb0cc", fontSize: "0.9rem" }}>
          No es la clave WiFi. Es la de Firebase, ej.{" "}
          <code>GERARD/clave: 31910951</code>
        </p>
        <div className="config-pagina__form">
          <label>
            USUARIO
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value.toUpperCase())}
              placeholder="GERARD"
              disabled={accesoVerificado && paso > 1}
            />
          </label>
          <label>
            Clave de app
            <input
              type="password"
              value={claveApp}
              onChange={(e) => setClaveApp(e.target.value)}
              placeholder="Clave en Firebase"
              disabled={accesoVerificado && paso > 1}
            />
          </label>
        </div>
        <div className="config-pagina__acciones">
          {!accesoVerificado ? (
            <button
              type="button"
              className="config-pagina__btn primario"
              disabled={!usuario.trim() || !claveApp.trim() || cargando}
              onClick={() => verificarUsuarioClave()}
            >
              {cargando ? "Verificando…" : "Verificar en Firebase"}
            </button>
          ) : (
            <button
              type="button"
              className="config-pagina__btn secundario"
              onClick={reiniciarFlujo}
            >
              Cambiar USUARIO
            </button>
          )}
        </div>
      </section>

      {/* PASO 2 */}
      <section
        className={`config-pagina__paso${!accesoVerificado ? " config-pagina__paso--bloqueado" : ""}${paso === 2 ? " config-pagina__paso--activo" : ""}`}
      >
        <h2>Paso 2 — Tanque para esta tarjeta</h2>
        {!accesoVerificado ? (
          <p style={{ color: "#9eb0cc" }}>Verifica el paso 1 primero.</p>
        ) : (
          <>
            {tanquesDisponibles.length > 0 ? (
              <>
                <label style={{ display: "block", marginBottom: 8, color: "#b9c7de" }}>
                  Tanques existentes
                </label>
                <select
                  value={tanqueSeleccionado}
                  onChange={(e) => confirmarTanque(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #2a3f5f",
                    background: "#0b1220",
                    color: "#e8eef8",
                    marginBottom: 12,
                  }}
                >
                  {tanquesDisponibles.map((id) => (
                    <option key={id} value={id}>
                      Tanque Nº {numeroDesdeId(id)} — {id}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <p style={{ color: "#b9c7de" }}>
                No hay tanques aún para <b>{usuarioDiag}</b>.
              </p>
            )}
            <button
              type="button"
              className="config-pagina__btn primario"
              disabled={cargando}
              onClick={() => agregarNuevoTanque()}
            >
              {cargando ? "Creando…" : "+ Agregar tanque nuevo"}
            </button>
            {tanqueListo && (
              <p style={{ marginTop: 12 }}>
                Asignado: <b>{usuarioDiag}</b> · <b>{tanqueSeleccionado}</b>
              </p>
            )}
          </>
        )}
      </section>

      {/* PASO 3 */}
      <section
        className={`config-pagina__paso${!wifiHabilitado ? " config-pagina__paso--bloqueado" : ""}${paso === 3 ? " config-pagina__paso--activo" : ""}`}
      >
        <h2>Paso 3 — RED y clave WiFi (campo)</h2>
        {!wifiHabilitado ? (
          <p style={{ color: "#9eb0cc" }}>
            Completa paso 1 y 2 para habilitar la red.
          </p>
        ) : (
          <>
            <div className="config-pagina__form">
              <label>
                RED (SSID 2.4 GHz)
                <input
                  value={red}
                  onChange={(e) => setRed(e.target.value)}
                  placeholder="Nombre de la red del campo"
                />
              </label>
              <label>
                Clave WiFi (de la red, no de la app)
                <input
                  type="password"
                  value={claveWifi}
                  onChange={(e) => setClaveWifi(e.target.value)}
                  placeholder="Contraseña del WiFi"
                />
              </label>
            </div>
            <p>
              Línea para ESP32: <code>{preview}</code>
            </p>
            <div className="config-pagina__acciones">
              <button
                type="button"
                className="config-pagina__btn secundario"
                disabled={!puedeEnviar}
                onClick={async () => {
                  const linea = formatearMensajeConfigTarjeta({
                    red: red.trim(),
                    claveWifi: claveWifi.trim(),
                    usuario: usuarioDiag,
                    claveApp: claveApp.trim(),
                    numeroTanque: numeroSeleccionado,
                  });
                  try {
                    await navigator.clipboard.writeText(linea);
                    alert(`Copiado:\n${linea}`);
                  } catch {
                    prompt("Copia:", linea);
                  }
                }}
              >
                Copiar línea (USB / portal)
              </button>
              <button
                type="button"
                className="config-pagina__btn primario"
                disabled={!puedeEnviar || cargando}
                onClick={() => enviarConfiguracion()}
              >
                Enviar configuración al ESP32
              </button>
            </div>
          </>
        )}
      </section>

      <section className="config-pagina__paso config-pagina__aviso config-pagina__aviso--info">
        <h2>📱 iPhone — portal {PORTAL_SSID}</h2>
        <p style={{ margin: 0, color: "#b9c7de", lineHeight: 1.6 }}>
          WiFi <code>{PORTAL_SSID}</code> / <code>{PORTAL_PASS}</code> → Safari{" "}
          <code>{PORTAL_URL}</code> → mismos 5 datos del paso 1–3.
        </p>
      </section>

      <section
        className={`config-pagina__paso config-pagina__diagnostico config-pagina__diagnostico--${claseDiag}`}
      >
        <h2>Diagnóstico tarjeta</h2>
        {diagnostico ? (
          <>
            <p>
              <b>{etiquetaEstadoDiagnostico(diagnostico.estado)}</b>
            </p>
            <p className="config-pagina__diagnostico-msg">{diagnostico.mensaje}</p>
          </>
        ) : (
          <p style={{ color: "#b9c7de" }}>Sin mensajes de la tarjeta aún.</p>
        )}
        {mensaje && (
          <p style={{ marginTop: 12 }}>
            <b>{estado}</b> — {mensaje}
          </p>
        )}
      </section>
    </div>
  );
}

function numeroDesdeId(id: string): number {
  const match = id.match(/^T-(\d+)$/i);
  return match ? Number(match[1]) : 0;
}
