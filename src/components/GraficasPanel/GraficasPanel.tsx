import type { Tanque } from "../../types/tanque";
import { useHistoricoSensor } from "../../hooks/useHistoricoSensor";
import {
  tanqueTieneHistorico,
  tanqueTieneLecturaEnVivo,
  tanqueTieneSensoresReportados,
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
  const sensoresReportados = tanqueTieneSensoresReportados(tanque);
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
        {tieneHistorico && !lecturaEnVivo && (
          <small className="panel-graficas__aviso-prueba">
            Histórico guardado — tarjeta sin señal reciente
          </small>
        )}
      </div>

      {!tieneHistorico && !sensoresReportados ? (
        <div className="panel-graficas__sin-datos">
          <p>Sin datos de sensores para este tanque.</p>
          <small>
            Ruta en Firebase:{" "}
            <code>
              {usuario ?? "?"}/TANQUES/{tanque.id}/historico/
            </code>
            . Vincule la tarjeta en Configuración → ESP32 / WiFi.
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
            (clave cada 10 min, últimos 7 días). Con pocos puntos la línea
            aparece al acumular lecturas.
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
              periodoHoras={168}
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
              periodoHoras={168}
            />
          )}
        </div>
      )}
    </div>
  );
}
