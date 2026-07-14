import { useEffect, useState } from "react";
import {
  suscribirHistoricoSensor,
  type SensorHistorico,
} from "../services/historicoFirebase";
import type { PuntoHistorico } from "../utils/historicoSensores";

/** Solo lecturas reales desde Firebase historico/{sensor}/ */
export function useHistoricoSensor(
  usuario: string | null,
  tanqueId: string,
  sensor: SensorHistorico,
) {
  const [datos, setDatos] = useState<PuntoHistorico[]>([]);

  useEffect(() => {
    if (!usuario) {
      setDatos([]);
      return;
    }

    const cancelar = suscribirHistoricoSensor(
      usuario,
      tanqueId,
      sensor,
      setDatos,
    );
    return () => {
      cancelar?.();
    };
  }, [usuario, tanqueId, sensor]);

  return datos;
}
