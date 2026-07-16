import { obtenerDatabase } from "../config/firebase";
import type { ConfiguracionTarjeta } from "../types/conexion";
import { formatearMensajeConfigTarjeta } from "../types/protocoloAquaControl";
import { idTanque } from "./tanquesAdminService";
import type { NodoTanqueFirebase } from "../types/firebaseNodos";
import { tarjetaEnLinea } from "../utils/conexionTarjeta";
import { get, ref } from "firebase/database";

export type ResultadoEnvioBluetooth =
  | { ok: true; modo: "bluetooth" | "simulacion"; mensaje: string }
  | { ok: false; error: string };

/**
 * Envía RED,CLAVE_WIFI,USUARIO,CLAVE_APP,numero a la tarjeta.
 * Identificación: USUARIO + RED + número de tanque.
 */
export async function enviarConfiguracionTarjetaBluetooth(
  config: ConfiguracionTarjeta,
  opciones?: { simular?: boolean },
): Promise<ResultadoEnvioBluetooth> {
  const mensaje = formatearMensajeConfigTarjeta({
    red: config.red,
    claveWifi: config.claveWifi,
    usuario: config.usuario,
    claveApp: config.claveApp,
    numeroTanque: config.numeroTanque,
  });

  if (opciones?.simular) {
    console.info("[AquaControl config tarjeta]", mensaje);
    await esperar(800);
    return { ok: true, modo: "simulacion", mensaje };
  }

  return {
    ok: false,
    error:
      "En iPhone usa el portal WiFi AquaControl-Setup. En PC copia la línea al Monitor Serie USB.",
  };
}

export async function esperarTarjetaEnLinea(
  usuario: string,
  numeroTanque: number,
  opciones?: { timeoutMs?: number; intervaloMs?: number },
): Promise<boolean> {
  const db = obtenerDatabase();
  if (!db) return false;

  const tanqueId = idTanque(numeroTanque);
  const timeoutMs = opciones?.timeoutMs ?? 90_000;
  const intervaloMs = opciones?.intervaloMs ?? 2_000;
  const inicio = Date.now();
  const ruta = `${usuario}/TANQUES/${tanqueId}`;

  while (Date.now() - inicio < timeoutMs) {
    const snapshot = await get(ref(db, ruta));
    const nodo = snapshot.val() as NodoTanqueFirebase | null;
    if (nodo && tarjetaEnLinea(nodo)) return true;
    await esperar(intervaloMs);
  }

  return false;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
