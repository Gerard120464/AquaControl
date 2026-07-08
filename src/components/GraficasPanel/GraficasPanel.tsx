import type { Tanque } from "../../types/tanque";
import { generarHistorico12h } from "../../utils/historicoSensores";
import HistoricoChart from "../HistoricoChart/HistoricoChart";
import "./GraficasPanel.css";

type Props = {
  tanque: Tanque;
};

export default function GraficasPanel({ tanque }: Props) {
  const historicoOxigeno = generarHistorico12h(
    tanque.sensores.oxigeno,
    `${tanque.id}-oxigeno`,
    1.2,
    4,
    12
  );

  const historicoTemperatura = generarHistorico12h(
    tanque.sensores.temperatura,
    `${tanque.id}-temperatura`,
    1.5,
    8,
    20
  );

  return (
    <div className="panel-graficas">
      <div className="panel-graficas__titulo">
        <h2>Últimas 12 horas — {tanque.nombre}</h2>
      </div>

      <div className="panel-graficas__contenido">
        <HistoricoChart
          chartId={`${tanque.id}-oxigeno`}
          titulo="💨 Oxígeno disuelto"
          valorActual={tanque.sensores.oxigeno}
          unidad="mg/L"
          color="#4fc3f7"
          datos={historicoOxigeno}
        />

        <HistoricoChart
          chartId={`${tanque.id}-temperatura`}
          titulo="🌡 Temperatura del agua"
          valorActual={tanque.sensores.temperatura}
          unidad="°C"
          color="#ff8a65"
          datos={historicoTemperatura}
        />
      </div>
    </div>
  );
}
