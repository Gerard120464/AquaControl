import { useEffect, useState } from "react";
import { firebaseDisponible } from "../config/firebase";
import { useSesion } from "./useSesion";
import { suscribirTanques } from "../services/tanquesFirebase";
import type { Tanque } from "../types/tanque";

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

    setCargando(true);
    const cancelar = suscribirTanques(
      sesion.usuario,
      (lista) => {
        setTanques(lista);
        setCargando(false);
      },
      () => {
        setCargando(false);
      },
    );

    return () => {
      cancelar?.();
    };
  }, [sesion?.usuario]);

  return { tanques, setTanques, cargando, sesion };
}
