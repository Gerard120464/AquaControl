import { useEffect, useState } from "react";
import { firebaseDisponible } from "../config/firebase";
import { completarVariablesTanquesExistentes } from "../services/tanquesAdminService";
import { suscribirTanques } from "../services/tanquesFirebase";
import type { Tanque } from "../types/tanque";
import { useSesion } from "./useSesion";

/**
 * Tanques en vivo desde /{USUARIO}/TANQUES/.
 * Sin sesión iniciada no muestra datos de prueba.
 */
export function useTanques() {
  const { sesion } = useSesion();
  const [tanques, setTanques] = useState<Tanque[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!sesion?.usuario || !firebaseDisponible()) {
      setTanques([]);
      setCargando(false);
      return;
    }

    let cancelar: (() => void) | null = null;
    let cancelado = false;

    setCargando(true);

    void completarVariablesTanquesExistentes(
      sesion.usuario,
      sesion.clave,
    ).finally(() => {
      if (cancelado) return;

      cancelar = suscribirTanques(
        sesion.usuario,
        (lista) => {
          setTanques(lista);
          setCargando(false);
        },
        () => {
          setCargando(false);
        },
      );
    });

    return () => {
      cancelado = true;
      cancelar?.();
    };
  }, [sesion?.usuario, sesion?.clave]);

  return { tanques, setTanques, cargando, sesion };
}
