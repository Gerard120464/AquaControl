type Props = {
  id: number;
  temperatura: number;
  oxigeno: number;
  estado: "normal" | "alarma";
  activo: boolean;
  onClick: () => void;
};

export default function TankCard({
  id,
  temperatura,
  oxigeno,
  estado,
  activo,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 240,
        background: activo ? "#1d3f63" : "#1b2636",
        border: activo ? "3px solid #3fa9ff" : "2px solid #3a4c63",
        borderRadius: 18,
        padding: 12,
        cursor: "pointer",
        transition: "0.25s",
        boxShadow: activo
          ? "0 0 18px rgba(0,180,255,.6)"
          : "0 0 8px rgba(0,0,0,.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <b
          style={{
            color: "white",
            fontSize: 20,
          }}
        >
          T-{id.toString().padStart(2, "0")}
        </b>

        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background:
              estado === "normal"
                ? "#00ff6a"
                : "#ff3030",
          }}
        />
      </div>

      <svg width="210" height="120">

        <ellipse
          cx="105"
          cy="60"
          rx="85"
          ry="42"
          fill="#185b96"
          stroke="#7ec8ff"
          strokeWidth="3"
        />

        <ellipse
          cx="105"
          cy="60"
          rx="70"
          ry="32"
          fill="#2a7fc9"
        />

        <circle cx="105" cy="60" r="6" fill="#d8d8d8" />

        <ellipse cx="70" cy="52" rx="10" ry="4" fill="white" />
        <polygon points="58,52 49,47 49,57" fill="white" />

        <ellipse cx="132" cy="72" rx="10" ry="4" fill="white" />
        <polygon points="120,72 111,67 111,77" fill="white" />

        <ellipse cx="105" cy="43" rx="10" ry="4" fill="white" />
        <polygon points="93,43 84,38 84,48" fill="white" />

        <rect
          x="10"
          y="46"
          width="20"
          height="20"
          rx="3"
          fill="#ffb000"
        />

        <rect
          x="180"
          y="46"
          width="22"
          height="22"
          rx="3"
          fill="#497cff"
        />
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
          color: "#d7e7ff",
          fontSize: 15,
        }}
      >
        <div>
          🌡 {temperatura}°C
        </div>

        <div>
          💨 {oxigeno} mg/L
        </div>
      </div>
    </div>
  );
}