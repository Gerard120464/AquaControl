import { useEffect, useState } from "react";
import { useSesion } from "./useSesion";
import { suscribirEstadoEsp32 } from "../services/tanquesFirebase";
import { firebaseDisponible } from "../config/firebase";

export function useEstadoEsp32() {
  const { sesion } = useSesion();
  const [online, setOnline] = useState(false);
  const [tanquesOnline, setTanquesOnline] = useState(0);

  useEffect(() => {
    if (!sesion?.usuario || !firebaseDisponible()) {
      setOnline(false);
      setTanquesOnline(0);
      return;
    }

    const cancelar = suscribirEstadoEsp32(sesion.usuario, (activo, cantidad) => {
      setOnline(activo);
      setTanquesOnline(cantidad);
    });
    return () => {
      cancelar?.();
    };
  }, [sesion?.usuario]);

  return { online, tanquesOnline, sesion };
}
