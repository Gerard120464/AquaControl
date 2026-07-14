import { useCallback, useEffect, useState } from "react";
import type { SesionAquaControl } from "../types/conexion";

const CLAVE_STORAGE = "aquacontrol.sesion";

function leerSesionGuardada(): SesionAquaControl | null {
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SesionAquaControl & { red?: string };
    if (!parsed?.usuario) return null;
    const clave = parsed.clave ?? parsed.red;
    if (!clave) return null;
    return { usuario: parsed.usuario, clave };
  } catch {
    return null;
  }
}

export function useSesion() {
  const [sesion, setSesionState] = useState<SesionAquaControl | null>(() =>
    leerSesionGuardada(),
  );

  const guardarSesion = useCallback((nueva: SesionAquaControl) => {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(nueva));
    setSesionState(nueva);
  }, []);

  const limpiarSesion = useCallback(() => {
    localStorage.removeItem(CLAVE_STORAGE);
    setSesionState(null);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CLAVE_STORAGE) {
        setSesionState(leerSesionGuardada());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { sesion, guardarSesion, limpiarSesion };
}
