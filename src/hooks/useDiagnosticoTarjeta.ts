import { useEffect, useState } from "react";
import {
  suscribirDiagnosticoTanque,
  suscribirDiagnosticoUsuario,
} from "../services/diagnosticoFirebase";
import type { DiagnosticoTarjetaFirebase } from "../types/firebaseNodos";

/** Mensajes de la tarjeta ESP32 visibles en la app (sin Monitor Serie). */
export function useDiagnosticoTarjeta(
  usuario: string | null,
  tanqueId: string,
) {
  const [usuarioDiag, setUsuarioDiag] =
    useState<DiagnosticoTarjetaFirebase | null>(null);
  const [tanqueDiag, setTanqueDiag] =
    useState<DiagnosticoTarjetaFirebase | null>(null);

  useEffect(() => {
    if (!usuario) {
      setUsuarioDiag(null);
      setTanqueDiag(null);
      return;
    }

    const cancelarUsuario = suscribirDiagnosticoUsuario(usuario, setUsuarioDiag);
    const cancelarTanque = tanqueId
      ? suscribirDiagnosticoTanque(usuario, tanqueId, setTanqueDiag)
      : null;

    return () => {
      cancelarUsuario?.();
      cancelarTanque?.();
    };
  }, [usuario, tanqueId]);

  const activo = tanqueDiag ?? usuarioDiag;

  return { usuarioDiag, tanqueDiag, activo };
}
