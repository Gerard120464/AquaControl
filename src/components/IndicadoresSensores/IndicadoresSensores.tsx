import { VARIABLES_ESP32 } from "../../constants/variablesTanque";
import type { SensoresEsp32 } from "../../types/tanque";

type Props = {
  sensores: SensoresEsp32;
  compacto?: boolean;
  enUso?: boolean;
};

export default function IndicadoresSensores({
  sensores,
  compacto = false,
  enUso = true,
}: Props) {
  return (
    <section
      className={`indicadores ${compacto ? "indicadores--compacto" : ""}`}
      aria-label="Sensores ESP32"
    >
      {VARIABLES_ESP32.map((item) => (
        <div className="cardIndicador" key={item.key}>
          <span>
            {item.icono} {item.label}
          </span>
          <h2>
            {!enUso ? (
              "—"
            ) : (
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
