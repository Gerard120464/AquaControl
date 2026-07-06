type Props = {
  tanqueActivo: number;
  setTanqueActivo: (id: number) => void;
};

function TankView({
  tanqueActivo,
  setTanqueActivo,
}: Props) {

  const tanques = [
    { id: 1, x: 180, y: 120 },
    { id: 2, x: 470, y: 120 },
    { id: 3, x: 180, y: 320 },
    { id: 4, x: 470, y: 320 },
  ];

  return (
    <div
      className="tank-container"
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg width="700" height="450" viewBox="0 0 700 450">

        <text
          x="350"
          y="35"
          textAnchor="middle"
          fill="white"
          fontSize="26"
          fontWeight="bold"
        >
          ESTO ES UNA PRUEBA

        </text>

        {tanques.map((t) => (

          <g
            key={t.id}
            onClick={() => {
             alert("Tanque " + t.id);
                console.log("Click tanque", t.id);
                setTanqueActivo(t.id);
             }}
            style={{ cursor: "pointer" }}
          >

            {/* LED */}

            <circle
              cx={t.x}
              cy={t.y - 90}
              r="8"
              fill={tanqueActivo === t.id ? "#00ff66" : "#ff4040"}
            />

            {/* ESTANQUE */}

            <circle
              cx={t.x}
              cy={t.y}
              r="75"
              fill={tanqueActivo === t.id ? "#2d8cff" : "#184d78"}
              stroke="#a7d3ff"
              strokeWidth="5"
            />

            {/* AGUA */}

            <circle
              cx={t.x}
              cy={t.y}
              r="60"
              fill="transparent"
            />

            {/* DRENAJE */}

            <circle
              cx={t.x}
              cy={t.y}
              r="10"
              fill="#d9d9d9"
            />

            {/* PECES */}

            <ellipse
              cx={t.x - 18}
              cy={t.y - 10}
              rx="10"
              ry="4"
              fill="white"
            />

            <polygon
              points={`${t.x - 28},${t.y - 10} ${t.x - 38},${t.y - 15} ${t.x - 38},${t.y - 5}`}
              fill="white"
            />

            <ellipse
              cx={t.x + 18}
              cy={t.y + 18}
              rx="10"
              ry="4"
              fill="white"
            />

            <polygon
              points={`${t.x + 8},${t.y + 18} ${t.x - 2},${t.y + 13} ${t.x - 2},${t.y + 23}`}
              fill="white"
            />

            {/* NOMBRE */}

            <text
              x={t.x}
              y={t.y + 105}
              textAnchor="middle"
              fill="white"
              fontSize="20"
              fontWeight="bold"
            >
              {`T-${t.id.toString().padStart(2, "0")}`}
            </text>

          </g>

        ))}

      </svg>
    </div>
  );
}

export default TankView;