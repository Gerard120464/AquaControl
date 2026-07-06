import "./Gauge.css";

type GaugeProps = {
  titulo: string;
  valor: number;
  unidad: string;
  minimo: number;
  maximo: number;
  color: string;
};

export default function Gauge({
  titulo,
  valor,
  unidad,
  minimo,
  maximo,
  color,
}: GaugeProps) {

  const porcentaje =
    ((valor - minimo) / (maximo - minimo)) * 180;

  return (

    <div className="gaugeCard">

      <div className="gaugeTitulo">

        {titulo}

      </div>

      <svg
        width="180"
        height="120"
        viewBox="0 0 180 120"
      >

        {/* fondo */}

        <path

          d="M20 100 A70 70 0 0 1 160 100"

          stroke="#2b3550"

          strokeWidth="12"

          fill="none"

        />

        {/* arco */}

        <path

          d="M20 100 A70 70 0 0 1 160 100"

          stroke={color}

          strokeWidth="12"

          strokeLinecap="round"

          fill="none"

          strokeDasharray={`${porcentaje * 1.22} 999`}

        />

        {/* aguja */}

        <g
          transform={`rotate(${porcentaje - 90} 90 100)`}
        >

          <line

            x1="90"

            y1="100"

            x2="145"

            y2="100"

            stroke="white"

            strokeWidth="3"

          />

          <circle

            cx="90"

            cy="100"

            r="6"

            fill="white"

          />

        </g>

      </svg>

      <div className="gaugeValor">

        {valor}

      </div>

      <div className="gaugeUnidad">

        {unidad}

      </div>

    </div>

  );

}