import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useConfiguracion } from "../../hooks/useConfiguracion";
import "./Configuracion.css";

export default function Configuracion() {
  const {
    sesion,
    usuarioInput,
    setUsuarioInput,
    claveInput,
    setClaveInput,
    cantidadTanques,
    setCantidadTanques,
    tanques,
    mensaje,
    cargando,
    claveActual,
    setClaveActual,
    claveNueva,
    setClaveNueva,
    claveNueva2,
    setClaveNueva2,
    iniciarSesion,
    crearInicial,
    agregarUnTanque,
    borrarTanque,
    actualizarClave,
    cerrarSesion,
    refrescarTanques,
  } = useConfiguracion();

  useEffect(() => {
    if (sesion) refrescarTanques(sesion.usuario);
  }, [sesion, refrescarTanques]);

  return (
    <div className="config-pagina">
      <header className="config-pagina__header">
        <Link to="/" className="config-pagina__volver">
          ← Dashboard
        </Link>
        <h1>Configuración inicial</h1>
        <p className="config-pagina__subtitulo">
          Tras validar <b>USUARIO + clave</b> registrados en Firebase, la app
          crea tanques y nodos. La clave de login es distinta a la{" "}
          <b>CLAVE WiFi</b> que recibe cada tarjeta ESP32.
        </p>
      </header>

      <section className="config-pagina__paso">
        <h2>1. Acceso (USUARIO + clave de app)</h2>
        <p>
          Ejemplo en Firebase (creado por admin):{" "}
          <code>GERARD/clave: "8241"</code>
        </p>
        <div className="config-pagina__form">
          <label>
            USUARIO
            <input
              value={usuarioInput}
              onChange={(e) => setUsuarioInput(e.target.value.toUpperCase())}
              placeholder="GERARD"
              disabled={Boolean(sesion)}
            />
          </label>
          <label>
            Clave de app
            <input
              type="password"
              value={claveInput}
              onChange={(e) => setClaveInput(e.target.value)}
              placeholder="••••"
              disabled={Boolean(sesion)}
            />
          </label>
        </div>
        <div className="config-pagina__acciones">
          {!sesion ? (
            <button
              type="button"
              className="config-pagina__btn primario"
              disabled={cargando}
              onClick={iniciarSesion}
            >
              {cargando ? "Conectando…" : "Iniciar sesión"}
            </button>
          ) : (
            <button
              type="button"
              className="config-pagina__btn secundario"
              onClick={cerrarSesion}
            >
              Cerrar sesión ({sesion.usuario})
            </button>
          )}
        </div>
        {mensaje && !sesion && (
          <p className="config-pagina__mensaje config-pagina__mensaje--alerta">
            {mensaje}
          </p>
        )}
      </section>

      {sesion && (
        <section className="config-pagina__paso">
          <h2>2. Tanques en Firebase</h2>
          {tanques.length === 0 ? (
            <>
              <p>¿Cuántos tanques? (se crean en Firebase tras validar tu acceso)</p>
              <div className="config-pagina__form config-pagina__form--fila">
                <label>
                  Número de tanques
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={cantidadTanques}
                    onChange={(e) =>
                      setCantidadTanques(Number(e.target.value) || 1)
                    }
                  />
                </label>
                <button
                  type="button"
                  className="config-pagina__btn primario"
                  disabled={cargando}
                  onClick={crearInicial}
                >
                  Crear estructura en Firebase
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                Tanques activos: <b>{tanques.join(", ")}</b>. Puedes eliminar
                uno vacío (sin tarjeta ESP32 ni lecturas).
              </p>
              <ul className="config-pagina__lista-tanques">
                {tanques.map((id) => (
                  <li key={id} className="config-pagina__tanque-item">
                    <span>{id}</span>
                    <button
                      type="button"
                      className="config-pagina__btn-eliminar"
                      disabled={cargando}
                      onClick={() => borrarTanque(id)}
                      title="Solo si no tiene tarjeta ni datos"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
              <div className="config-pagina__acciones">
                <button
                  type="button"
                  className="config-pagina__btn primario"
                  disabled={cargando}
                  onClick={agregarUnTanque}
                >
                  Tanque (+)
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {sesion && (
        <section className="config-pagina__paso">
          <h2>3. Cambiar clave de app</h2>
          <p>No modifica la clave WiFi de la red.</p>
          <div className="config-pagina__form">
            <label>
              Clave actual
              <input
                type="password"
                value={claveActual}
                onChange={(e) => setClaveActual(e.target.value)}
              />
            </label>
            <label>
              Clave nueva
              <input
                type="password"
                value={claveNueva}
                onChange={(e) => setClaveNueva(e.target.value)}
              />
            </label>
            <label>
              Confirmar clave nueva
              <input
                type="password"
                value={claveNueva2}
                onChange={(e) => setClaveNueva2(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="config-pagina__btn secundario"
            disabled={cargando}
            onClick={actualizarClave}
          >
            Actualizar clave
          </button>
        </section>
      )}

      {sesion && tanques.length > 0 && (
        <section className="config-pagina__paso">
          <h2>4. Vincular tarjetas ESP32</h2>
          <p>
            Con los tanques creados, configura cada tarjeta (RED, CLAVE, número)
            en:
          </p>
          <Link to="/configurar-esp32" className="config-pagina__link">
            Configurar ESP32 →
          </Link>
        </section>
      )}

      {mensaje && <p className="config-pagina__mensaje">{mensaje}</p>}

      <section className="config-pagina__diagrama">
        <pre>{`ADMIN Firebase                 APP                              TARJETA ESP32
GERARD/clave="8241"     valida USUARIO+clave
                        crea TANQUES/T-01… + variables
                        Tanque (+)
                        BT: RED,CLAVE,1 ─────────────────► identidad única
                                                         tanque 1`}</pre>
      </section>
    </div>
  );
}
