import type { Tanque } from "../../types/tanque";
import { useHistoricoSensor } from "../../hooks/useHistoricoSensor";
import {
  tanqueTieneHistorico,
  tanqueTieneLecturaEnVivo,
} from "../../utils/historicoSensores";
import HistoricoChart from "../HistoricoChart/HistoricoChart";
import "./GraficasPanel.css";

type Props = {
  tanque: Tanque;
  usuario: string | null;
};

function ultimoValor(
  historico: { hora: string; valor: number }[],
  fallback: number,
): number {
  return historico.at(-1)?.valor ?? fallback;
}

export default function GraficasPanel({ tanque, usuario }: Props) {
  const historicoOxigeno = useHistoricoSensor(usuario, tanque.id, "oxigeno");
  const historicoTemperatura = useHistoricoSensor(
    usuario,
    tanque.id,
    "temperatura",
  );

  const lecturaEnVivo = tanqueTieneLecturaEnVivo(tanque);
  const tieneHistorico = tanqueTieneHistorico({
    oxigeno: historicoOxigeno,
    temperatura: historicoTemperatura,
  });

  const mostrarOxigeno = historicoOxigeno.length > 0;
  const mostrarTemperatura = historicoTemperatura.length > 0;
  const valorOxigeno = lecturaEnVivo
    ? tanque.sensores.oxigeno
    : ultimoValor(historicoOxigeno, tanque.sensores.oxigeno);
  const valorTemperatura = lecturaEnVivo
    ? tanque.sensores.temperatura
    : ultimoValor(historicoTemperatura, tanque.sensores.temperatura);

  return (
    <div className="panel-graficas">
      <div className="panel-graficas__titulo">
        <h2>Últimas 24 horas — {tanque.nombre}</h2>
        {tieneHistorico && !tanque.conectado && (
          <small className="panel-graficas__aviso-prueba">
            Histórico de prueba — tarjeta sin señal
          </small>
        )}
      </div>

      {!tieneHistorico && !lecturaEnVivo ? (
        <div className="panel-graficas__sin-datos">
          <p>Sin datos de sensores para este tanque.</p>
          <small>
            {tanque.conectado
              ? "Espere las primeras lecturas de la tarjeta ESP32."
              : "Vincule la tarjeta ESP32 en Configuración → ESP32 / WiFi."}
          </small>
        </div>
      ) : !tieneHistorico ? (
        <div className="panel-graficas__sin-datos">
          <p>
            Lectura actual: O₂ {tanque.sensores.oxigeno} · T{" "}
            {tanque.sensores.temperatura}°C
          </p>
          <small>
            El histórico se guarda en Firebase bajo{" "}
            <code>historico/temperatura</code> y <code>historico/oxigeno</code>{" "}
            (clave cada 10 min). La gráfica aparece al acumular puntos.
          </small>
        </div>
      ) : (
        <div className="panel-graficas__contenido">
          {mostrarOxigeno && (
            <HistoricoChart
              chartId={`${tanque.id}-oxigeno`}
              titulo="💨 Oxígeno disuelto"
              valorActual={valorOxigeno}
              unidad="mg/L"
              color="#4fc3f7"
              datos={historicoOxigeno}
              periodoHoras={24}
            />
          )}

          {mostrarTemperatura && (
            <HistoricoChart
              chartId={`${tanque.id}-temperatura`}
              titulo="🌡 Temperatura del agua"
              valorActual={valorTemperatura}
              unidad="°C"
              color="#ff8a65"
              datos={historicoTemperatura}
              periodoHoras={24}
            />
          )}
        </div>
      )}
    </div>
  );
}
