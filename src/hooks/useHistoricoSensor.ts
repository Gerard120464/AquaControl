import { useEffect, useState } from "react";
import {
  cargarHistoricoSensorHttp,
  suscribirHistoricoSensor,
  type SensorHistorico,
} from "../services/historicoFirebase";
import type { PuntoHistorico } from "../utils/historicoSensores";

function elegirMejorHistorico(
  actual: PuntoHistorico[],
  nuevo: PuntoHistorico[],
): PuntoHistorico[] {
  return nuevo.length >= actual.length ? nuevo : actual;
}

/** Lecturas desde Firebase historico/{sensor}/ (SDK + respaldo HTTP). */
export function useHistoricoSensor(
  usuario: string | null,
  tanqueId: string,
  sensor: SensorHistorico,
) {
  const [datos, setDatos] = useState<PuntoHistorico[]>([]);

  useEffect(() => {
    if (!usuario?.trim() || !tanqueId.trim()) {
      setDatos([]);
      return;
    }

    const usuarioNorm = usuario.trim().toUpperCase();

    const actualizar = (puntos: PuntoHistorico[]) => {
      setDatos((prev) => elegirMejorHistorico(prev, puntos));
    };

    const cancelar = suscribirHistoricoSensor(
      usuarioNorm,
      tanqueId,
      sensor,
      actualizar,
    );

    const cargarHttp = () => {
      void cargarHistoricoSensorHttp(usuarioNorm, tanqueId, sensor).then(
        actualizar,
      );
    };

    cargarHttp();
    const intervalo = window.setInterval(cargarHttp, 60_000);

    return () => {
      cancelar?.();
      window.clearInterval(intervalo);
    };
  }, [usuario, tanqueId, sensor]);

  return datos;
}
