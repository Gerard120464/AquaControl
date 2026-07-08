import type { Tanque } from "../../types/tanque";
import { generarHistorico24h } from "../../utils/historicoSensores";
import HistoricoChart from "../HistoricoChart/HistoricoChart";
import "./GraficasPanel.css";

type Props = {
  tanque: Tanque;
};

export default function GraficasPanel({ tanque }: Props) {
  const historicoOxigeno = generarHistorico24h(
    tanque.sensores.oxigeno,
    `${tanque.id}-oxigeno`,
    1.2,
    4,
    12
  );

  const historicoTemperatura = generarHistorico24h(
    tanque.sensores.temperatura,
    `${tanque.id}-temperatura`,
    1.5,
    8,
    20
  );

  return (
    <div className="panel-graficas">
      <div className="panel-graficas__titulo">
        <h2>Últimas 24 horas — {tanque.nombre}</h2>
      </div>

      <div className="panel-graficas__contenido">
        <HistoricoChart
          chartId={`${tanque.id}-oxigeno`}
          titulo="💨 Oxígeno disuelto"
          valorActual={tanque.sensores.oxigeno}
          unidad="mg/L"
          color="#4fc3f7"
          datos={historicoOxigeno}
          periodoHoras={24}
        />

        <HistoricoChart
          chartId={`${tanque.id}-temperatura`}
          titulo="🌡 Temperatura del agua"
          valorActual={tanque.sensores.temperatura}
          unidad="°C"
          color="#ff8a65"
          datos={historicoTemperatura}
          periodoHoras={24}
        />
      </div>
    </div>
  );
}
