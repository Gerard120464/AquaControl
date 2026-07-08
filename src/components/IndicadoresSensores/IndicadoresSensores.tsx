import type { Sensores } from "../types/tanque";

type Props = {
  sensores: Sensores;
  compacto?: boolean;
  enUso?: boolean;
};

const items = [
  { key: "temperatura" as const, icono: "🌡", label: "Temp", unidad: "°C" },
  { key: "oxigeno" as const, icono: "💨", label: "O₂", unidad: "mg/L" },
  { key: "ph" as const, icono: "🧪", label: "pH", unidad: "" },
  { key: "tds" as const, icono: "💧", label: "TDS", unidad: "" },
  { key: "ec" as const, icono: "⚡", label: "EC", unidad: "" },
  { key: "nh4" as const, icono: "🧪", label: "NH₄", unidad: "" },
];

export default function IndicadoresSensores({ sensores, compacto = false, enUso = true }: Props) {
  return (
    <section className={`indicadores ${compacto ? "indicadores--compacto" : ""}`}>
      {items.map((item) => (
        <div className="cardIndicador" key={item.key}>
          <span>
            {item.icono} {item.label}
          </span>
          <h2>
            {!enUso ? "—" : (
              <>
                {sensores[item.key]}
                {item.unidad && ` ${item.unidad}`}
              </>
            )}
          </h2>
        </div>
      ))}
    </section>
  );
}
