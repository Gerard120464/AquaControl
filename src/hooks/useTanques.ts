import { useState } from "react";
import { tanquesMock } from "../data/tanquesMock";
import type { Tanque } from "../types/tanque";

/**
 * Hook central para los tanques.
 * Hoy usa datos mock; al conectar Firebase, solo cambia la carga aquí.
 */
export function useTanques() {
  const [tanques, setTanques] = useState<Tanque[]>(tanquesMock);
  const [cargando] = useState(false);

  return { tanques, setTanques, cargando };
}
