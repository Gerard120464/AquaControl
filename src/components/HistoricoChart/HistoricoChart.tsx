import type { PuntoHistorico } from "../../utils/historicoSensores";
import "./HistoricoChart.css";

type Props = {
  chartId: string;
  titulo: string;
  valorActual: number;
  unidad: string;
  color: string;
  datos: PuntoHistorico[];
};

const ANCHO = 320;
const ALTO = 130;
const MARGEN = { arriba: 12, derecha: 12, abajo: 26, izquierda: 36 };

export default function HistoricoChart({
  chartId,
  titulo,
  valorActual,
  unidad,
  color,
  datos,
}: Props) {
  const valores = datos.map((d) => d.valor);
  const minValor = Math.min(...valores);
  const maxValor = Math.max(...valores);
  const rango = maxValor - minValor || 1;

  const areaAncho = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo;

  const puntos = datos.map((punto, indice) => {
    const x =
      MARGEN.izquierda + (indice / (datos.length - 1)) * areaAncho;
    const y =
      MARGEN.arriba +
      areaAlto -
      ((punto.valor - minValor) / rango) * areaAlto;
    return { x, y, ...punto };
  });

  const linea = puntos
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaBajo = `${linea} L ${puntos[puntos.length - 1].x} ${MARGEN.arriba + areaAlto} L ${puntos[0].x} ${MARGEN.arriba + areaAlto} Z`;

  const etiquetasEjeX = [0, 4, 8, 11].map((indice) => puntos[indice]);

  return (
    <div className="historico-chart">
      <div className="historico-chart__header">
        <h3>{titulo}</h3>
        <span className="historico-chart__valor" style={{ color }}>
          {valorActual} {unidad}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="historico-chart__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((fraccion) => {
          const y = MARGEN.arriba + areaAlto * (1 - fraccion);
          const valor =
            Math.round((minValor + rango * fraccion) * 10) / 10;
          return (
            <g key={fraccion}>
              <line
                x1={MARGEN.izquierda}
                y1={y}
                x2={ANCHO - MARGEN.derecha}
                y2={y}
                className="historico-chart__grid"
              />
              <text
                x={MARGEN.izquierda - 6}
                y={y + 4}
                textAnchor="end"
                className="historico-chart__eje-y"
              >
                {valor}
              </text>
            </g>
          );
        })}

        <path d={areaBajo} fill={`url(#grad-${chartId})`} />
        <path d={linea} className="historico-chart__linea" stroke={color} />

        {puntos.map((punto, indice) => (
          <circle
            key={`${punto.hora}-${indice}`}
            cx={punto.x}
            cy={punto.y}
            r={indice === puntos.length - 1 ? 4 : 2.5}
            fill={indice === puntos.length - 1 ? color : "#1b2439"}
            stroke={color}
            strokeWidth={1.5}
          />
        ))}

        {etiquetasEjeX.map((punto, indice) => (
          <text
            key={`${punto.hora}-x-${indice}`}
            x={punto.x}
            y={ALTO - 6}
            textAnchor="middle"
            className="historico-chart__eje-x"
          >
            {punto.hora}
          </text>
        ))}
      </svg>

      <span className="historico-chart__periodo">Últimas 12 horas</span>
    </div>
  );
}
