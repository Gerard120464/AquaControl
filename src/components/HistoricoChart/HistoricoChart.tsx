import type { PuntoHistorico } from "../../utils/historicoSensores";
import "./HistoricoChart.css";

type Props = {
  chartId: string;
  titulo: string;
  valorActual: number;
  unidad: string;
  color: string;
  datos: PuntoHistorico[];
  periodoHoras?: number;
};

const ANCHO = 320;
const ALTO = 130;
const MARGEN = { arriba: 12, derecha: 12, abajo: 26, izquierda: 36 };
const GROSOR_LINEA = 1;

function indicesEtiquetasEjeX(total: number): number[] {
  if (total <= 1) return [0];
  if (total <= 6) return [0, total - 1];

  const cantidad = Math.min(5, total);
  const ultimo = total - 1;
  const paso = ultimo / (cantidad - 1);

  const indices = Array.from({ length: cantidad }, (_, i) =>
    Math.min(ultimo, Math.round(i * paso)),
  );

  return [...new Set(indices)];
}

function etiquetaHoraCorta(hora: string): string {
  return hora.replace(/\s*(a\.?\s*m\.?|p\.?\s*m\.?)\.?/gi, "").trim();
}

export default function HistoricoChart({
  chartId,
  titulo,
  valorActual,
  unidad,
  color,
  datos,
  periodoHoras = 24,
}: Props) {
  if (datos.length === 0) {
    return (
      <div className="historico-chart historico-chart--vacio">
        <div className="historico-chart__header">
          <h3>{titulo}</h3>
          <span className="historico-chart__valor" style={{ color }}>
            {valorActual} {unidad}
          </span>
        </div>
        <p className="historico-chart__vacio-texto">Sin puntos en el período</p>
      </div>
    );
  }

  const valores = datos.map((d) => d.valor);
  const minValor = Math.min(...valores);
  const maxValor = Math.max(...valores);
  const rango = maxValor - minValor || 1;

  const areaAncho = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const areaAlto = ALTO - MARGEN.arriba - MARGEN.abajo;

  const divisor = Math.max(datos.length - 1, 1);

  const puntos = datos.map((punto, indice) => {
    const x = MARGEN.izquierda + (indice / divisor) * areaAncho;
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

  const etiquetasEjeX = indicesEtiquetasEjeX(datos.length).map(
    (indice) => puntos[indice]
  );
  const muchosPuntos = puntos.length > 24;

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
        <path
          d={linea}
          className="historico-chart__linea"
          stroke={color}
          strokeWidth={GROSOR_LINEA}
          vectorEffect="non-scaling-stroke"
        />

        {puntos.map((punto, indice) => {
          const esUltimo = indice === puntos.length - 1;
          if (muchosPuntos && !esUltimo) return null;

          return (
            <circle
              key={`${punto.hora}-${indice}`}
              cx={punto.x}
              cy={punto.y}
              r={esUltimo ? 3 : 1.5}
              fill={esUltimo ? color : "#1b2439"}
              stroke={color}
              strokeWidth={esUltimo ? 1 : 0.75}
              vectorEffect="non-scaling-stroke"
              opacity={esUltimo ? 1 : 0.7}
            />
          );
        })}

        {etiquetasEjeX.map((punto, indice) => {
          const esPrimera = indice === 0;
          const esUltima = indice === etiquetasEjeX.length - 1;

          return (
            <text
              key={`${punto.hora}-x-${indice}`}
              x={punto.x}
              y={ALTO - 6}
              textAnchor={esPrimera ? "start" : esUltima ? "end" : "middle"}
              className="historico-chart__eje-x"
            >
              {etiquetaHoraCorta(punto.hora)}
            </text>
          );
        })}
      </svg>

      <span className="historico-chart__periodo">
        Últimas {periodoHoras} horas
      </span>
    </div>
  );
}
