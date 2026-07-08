import { useEffect, useState } from "react";
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
  const [compacto, setCompacto] = useState(
    () => window.matchMedia("(max-width: 900px)").matches
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const actualizar = () => setCompacto(media.matches);
    actualizar();
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, []);

  const layout = calcularLayoutTanques(
    tanques.length,
    compacto ? 340 : 700,
    compacto ? 175 : 400,
    compacto
  );
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
    <div className={`tank-container ${compacto ? "tank-container--compacto" : ""}`}>
      <svg
        viewBox={`0 0 ${layout.ancho} ${layout.alto}`}
        preserveAspectRatio="xMidYMid meet"
        className="tank-svg"
      >
        {!compacto && (
          <text
            x={layout.ancho / 2}
            y="24"
            textAnchor="middle"
            fill="white"
            fontSize="18"
            fontWeight="bold"
          >
            Vista de granja — {tanques.length} tanques
          </text>
        )}

        {tanques.map((tanque, indice) => {
          const { x, y } = posiciones[indice];
          const seleccionado = tanqueActivoId === tanque.id;
          const enUso = tanque.enUso;

          const ledColor = !enUso
            ? "#5c6678"
            : tanque.estado === "alarma"
              ? "#ff4040"
              : seleccionado
                ? "#00ff66"
                : "#4caf50";

          const rellenoTanque = !enUso
            ? "#2a3345"
            : seleccionado
              ? "#2d8cff"
              : "#184d78";

          const bordeTanque = !enUso
            ? "#4a5568"
            : seleccionado
              ? "#69b3ff"
              : "#7a9ec4";

          const opacidad = enUso ? 1 : 0.55;
          const offsetLed = radio + (compacto ? 10 : 14) * escala;
          const offsetLabel = radio + (compacto ? 18 : 28) * escala;
          const radioAgua = radio * 0.8;
          const radioDrenaje = radio * 0.13;
          const pezRx = 10 * escala;
          const pezRy = 4 * escala;

          return (
            <g
              key={tanque.id}
              opacity={opacidad}
              onClick={() => onSeleccionarTanque(tanque.id)}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label={`Seleccionar ${tanque.nombre}`}
            >
              <circle
                cx={x}
                cy={y - offsetLed}
                r={(compacto ? 4 : 6) * escala}
                fill={ledColor}
              />

              <circle
                cx={x}
                cy={y}
                r={radio}
                fill={rellenoTanque}
                stroke={bordeTanque}
                strokeWidth={seleccionado && enUso ? 3 : 2}
                strokeDasharray={enUso ? undefined : "5 4"}
              />

              {enUso && (
                <>
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
                </>
              )}

              {!enUso && (
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill="#8b95a8"
                  fontSize={compacto ? 9 : 11}
                  fontWeight="bold"
                >
                  OFF
                </text>
              )}

              <text
                x={x}
                y={y + offsetLabel}
                textAnchor="middle"
                fill={enUso ? "white" : "#8b95a8"}
                fontSize={compacto ? 10 : 14 + escala * 6}
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
