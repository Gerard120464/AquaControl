import { useState } from "react";
import "./FarmView.css";

export default function FarmView() {

  const [activo, setActivo] = useState(1);

  const tanques = [
    { id: 1, x: 130, y: 110 },
    { id: 2, x: 360, y: 110 },
    { id: 3, x: 130, y: 300 },
    { id: 4, x: 360, y: 300 },
  ];

  return (
    <div className="farm">

      <svg viewBox="0 0 520 420">

        {tanques.map((t) => (

          <g
            key={t.id}
            onClick={() => setActivo(t.id)}
            style={{ cursor: "pointer" }}
          >

            <circle
              cx={t.x}
              cy={t.y}
              r="70"
              fill={activo === t.id ? "#2b7cff" : "#18456e"}
              stroke={activo === t.id ? "#8cc4ff" : "#4b8fd3"}
              strokeWidth="5"
            />

            <circle
              cx={t.x}
              cy={t.y}
              r="8"
              fill="#d9d9d9"
            />

            <text
              x={t.x}
              y={t.y + 100}
              textAnchor="middle"
              fill="white"
              fontSize="18"
            >
              Tanque {t.id}
            </text>

          </g>

        ))}

      </svg>

      <div className="tanqueActivo">

        TANQUE SELECCIONADO : T-{activo}

      </div>

    </div>
  );

}