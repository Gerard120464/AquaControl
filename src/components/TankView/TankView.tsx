import type { Tanque } from "../../types/tanque";
import { calcularLayoutTanques } from "../../utils/tanqueLayout";

type Props = {
  tanques: Tanque[];
  tanqueActivoId: string | null;
  onSeleccionarTanque: (id: string) => void;
};

function TankView({
  tanques,
  tanqueActivoId,
  onSeleccionarTanque,
}: Props) {
  const layout = calcularLayoutTanques(tanques.length);
  const { radio, posiciones } = layout;

  if (tanques.length === 0) {
    return (
      <div className="tank-container tank-vacio">
        <p>No hay tanques configurados</p>
      </div>
    );
  }

  const escala = radio / 75;

  return (
    <div className="tank-container">
      <svg
        viewBox={`0 0 ${layout.ancho} ${layout.alto}`}
        preserveAspectRatio="xMidYMid meet"
        className="tank-svg"
      >
        <text
          x={layout.ancho / 2}
          y="24"
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontWeight="bold"
        >
          Vista de granja — {tanques.length} tanque
          {tanques.length !== 1 ? "s" : ""}
        </text>

        {tanques.map((tanque, indice) => {
          const { x, y } = posiciones[indice];
          const activo = tanqueActivoId === tanque.id;
          const ledColor =
            tanque.estado === "alarma"
              ? "#ff4040"
              : activo
                ? "#00ff66"
                : "#4caf50";

          const offsetLed = radio + 14 * escala;
          const offsetLabel = radio + 28 * escala;
          const radioAgua = radio * 0.8;
          const radioDrenaje = radio * 0.13;
          const pezRx = 10 * escala;
          const pezRy = 4 * escala;

          return (
            <g
              key={tanque.id}
              onClick={() => onSeleccionarTanque(tanque.id)}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label={`Seleccionar ${tanque.nombre}`}
            >
              <circle
                cx={x}
                cy={y - offsetLed}
                r={6 * escala}
                fill={ledColor}
              />

              <circle
                cx={x}
                cy={y}
                r={radio}
                fill={activo ? "#2d8cff" : "#184d78"}
                stroke={activo ? "#69b3ff" : "#a7d3ff"}
                strokeWidth={activo ? 4 : 3}
              />

              <circle cx={x} cy={y} r={radioAgua} fill="transparent" />

              <circle cx={x} cy={y} r={radioDrenaje} fill="#d9d9d9" />

              <ellipse
                cx={x - 18 * escala}
                cy={y - 10 * escala}
                rx={pezRx}
                ry={pezRy}
                fill="white"
              />
              <polygon
                points={`${x - 28 * escala},${y - 10 * escala} ${x - 38 * escala},${y - 15 * escala} ${x - 38 * escala},${y - 5 * escala}`}
                fill="white"
              />

              <ellipse
                cx={x + 18 * escala}
                cy={y + 18 * escala}
                rx={pezRx}
                ry={pezRy}
                fill="white"
              />
              <polygon
                points={`${x + 8 * escala},${y + 18 * escala} ${x - 2 * escala},${y + 13 * escala} ${x - 2 * escala},${y + 23 * escala}`}
                fill="white"
              />

              <text
                x={x}
                y={y + offsetLabel}
                textAnchor="middle"
                fill="white"
                fontSize={14 + escala * 6}
                fontWeight="bold"
              >
                {tanque.nombre}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default TankView;
