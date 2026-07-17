import { useEffect, useState } from "react";
import { VARIABLES_USUARIO } from "../../constants/variablesTanque";
import { guardarVariablesUsuario } from "../../services/variablesUsuarioService";
import type { VariablesUsuario } from "../../types/tanque";
import "./CalidadAguaForm.css";

type Props = {
  usuario: string;
  clave: string;
  tanqueId: string;
  tanqueNombre: string;
  valores: VariablesUsuario;
  enUso?: boolean;
};

export default function CalidadAguaForm({
  usuario,
  clave,
  tanqueId,
  tanqueNombre,
  valores,
  enUso = true,
}: Props) {
  const [form, setForm] = useState<VariablesUsuario>(valores);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    setForm(valores);
  }, [valores, tanqueId]);

  const actualizarCampo = (key: keyof VariablesUsuario, texto: string) => {
    const numero = texto === "" ? 0 : Number(texto);
    setForm((prev) => ({
      ...prev,
      [key]: Number.isFinite(numero) ? numero : prev[key],
    }));
  };

  const guardar = async () => {
    setGuardando(true);
    setMensaje("");
    try {
      await guardarVariablesUsuario(usuario, clave, tanqueId, form);
      setMensaje("Valores guardados en Firebase.");
    } catch (error) {
      setMensaje(
        error instanceof Error ? error.message : "No se pudo guardar.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="calidad-agua">
      <header className="calidad-agua__header">
        <h3>💧 Calidad del agua — {tanqueNombre}</h3>
        <p>Ingresa manualmente nitritos, nitratos y amoniaco.</p>
      </header>

      <div className="calidad-agua__grid">
        {VARIABLES_USUARIO.map((item) => (
          <label className="calidad-agua__campo" key={item.key}>
            <span>
              {item.icono} {item.label}
              {item.unidad && ` (${item.unidad})`}
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              disabled={!enUso || guardando}
              value={form[item.key] === 0 ? "" : form[item.key]}
              placeholder="0"
              onChange={(e) => actualizarCampo(item.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="calidad-agua__acciones">
        <button
          type="button"
          className="calidad-agua__btn"
          disabled={!enUso || guardando}
          onClick={guardar}
        >
          {guardando ? "Guardando…" : "Guardar en Firebase"}
        </button>
        {mensaje && (
          <p
            className={`calidad-agua__mensaje${
              mensaje.includes("guardados") ? " calidad-agua__mensaje--ok" : ""
            }`}
          >
            {mensaje}
          </p>
        )}
      </div>
    </section>
  );
}
