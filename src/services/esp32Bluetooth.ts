import { get, ref } from "firebase/database";
import { obtenerDatabase } from "../config/firebase";
import { idTanque } from "./tanquesAdminService";
import type { ConfiguracionTarjeta } from "../types/conexion";
import type { NodoTanqueFirebase } from "../types/firebaseNodos";
import { formatearMensajeBluetoothTarjeta } from "../types/protocoloAquaControl";
import { tarjetaEnLinea } from "../utils/conexionTarjeta";

export type ResultadoEnvioBluetooth =
  | { ok: true; modo: "bluetooth" | "simulacion"; mensaje: string }
  | { ok: false; error: string };

/**
 * Envía RED,CLAVE,numero a la tarjeta.
 * Identificación única de cada ESP32: red WiFi + clave WiFi + número de tanque.
 */
export async function enviarConfiguracionTarjetaBluetooth(
  config: ConfiguracionTarjeta,
  opciones?: { simular?: boolean },
): Promise<ResultadoEnvioBluetooth> {
  const mensaje = formatearMensajeBluetoothTarjeta(
    config.red,
    config.clave,
    config.numeroTanque,
  );

  if (opciones?.simular) {
    console.info("[AquaControl BT tarjeta]", mensaje);
    await esperar(800);
    return { ok: true, modo: "simulacion", mensaje };
  }

  return {
    ok: false,
    error:
      "Bluetooth clásico (ESP32_BT) requiere app nativa o Capacitor. Usa modo simulación en desarrollo.",
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
