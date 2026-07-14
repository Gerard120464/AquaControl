import type { NodoTanqueFirebase } from "../types/firebaseNodos";

/** Intervalo del heartbeat en firmware ESP32 (HEARTBEAT_MS). */
export const HEARTBEAT_ESP32_MS = 30_000;

/** Sin heartbeat reciente → tarjeta offline (3 intervalos). */
export const HEARTBEAT_TIMEOUT_MS = HEARTBEAT_ESP32_MS * 3;

/** La app revalida el tiempo aunque Firebase no emita cambios. */
export const INTERVALO_REVISION_CONEXION_MS = 10_000;

export function esConectadoFlag(valor: unknown): boolean {
  return valor === "1" || valor === 1 || valor === true;
}

export function parsearUltimoHeartbeat(valor: unknown): number | null {
  if (valor == null || valor === "") return null;

  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor < 1_000_000_000_000 ? valor * 1000 : valor;
  }

  const texto = String(valor).trim();
  const numero = Number(texto);
  if (Number.isFinite(numero)) {
    return numero < 1_000_000_000_000 ? numero * 1000 : numero;
  }

  const fecha = Date.parse(texto);
  return Number.isNaN(fecha) ? null : fecha;
}

/** Online solo si conectado=1 y ultimoHeartbeat es reciente. */
export function tarjetaEnLinea(
  nodo: Pick<NodoTanqueFirebase, "conectado" | "ultimoHeartbeat">,
  ahora = Date.now(),
): boolean {
  if (!esConectadoFlag(nodo.conectado)) return false;

  const ultimo = parsearUltimoHeartbeat(nodo.ultimoHeartbeat);
  if (ultimo == null) return false;

  return ahora - ultimo <= HEARTBEAT_TIMEOUT_MS;
}

export function contarTanquesEnLinea(
  nodos: Record<string, NodoTanqueFirebase | undefined>,
  ahora = Date.now(),
): number {
  return Object.values(nodos).filter((nodo) => nodo && tarjetaEnLinea(nodo, ahora))
    .length;
}
