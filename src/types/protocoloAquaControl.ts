/**
 * Contrato AquaControl
 *
 * APP (tras validar USUARIO + clave registrados en Firebase):
 *   - Crea /{USUARIO}/TANQUES/ y todos los nodos/variables
 *   - Tanque (+) agrega más tanques
 *
 * TARJETA ESP32 — única identificación por Bluetooth:
 *   RED,CLAVE,numeroTanque
 *   Ejemplo: MiRedWiFi,pass123,1  → tanque 1 (nodo T-01)
 *   Una tarjeta = un tanque. No recibe USUARIO por BT.
 */

export const PROTOCOLO_BT = {
  separador: ",",
  nombreDispositivo: "ESP32_BT",
  respuestaOk: "OK",
  /** RED, CLAVE (WiFi), número de tanque (1, 2, 3…) */
  campos: 3,
} as const;

/** Mensaje Bluetooth hacia la tarjeta. */
export function formatearMensajeBluetoothTarjeta(
  red: string,
  clave: string,
  numeroTanque: number,
): string {
  return `${red},${clave},${numeroTanque}`;
}

export function parsearMensajeBluetoothTarjeta(
  mensaje: string,
): { red: string; clave: string; numeroTanque: number } | null {
  const partes = mensaje.trim().split(PROTOCOLO_BT.separador);
  if (partes.length !== PROTOCOLO_BT.campos) return null;

  const [red, clave, numeroStr] = partes.map((p) => p.trim());
  const numeroTanque = Number(numeroStr);
  if (!red || !clave || !Number.isInteger(numeroTanque) || numeroTanque < 1) {
    return null;
  }

  return { red, clave, numeroTanque };
}

/** @deprecated usar formatearMensajeBluetoothTarjeta */
export function formatearMensajeBluetoothWifi(
  red: string,
  claveWifi: string,
  tanqueId: string,
): string {
  const match = tanqueId.match(/^T-(\d+)$/i);
  const numero = match ? Number(match[1]) : Number(tanqueId);
  return formatearMensajeBluetoothTarjeta(red, claveWifi, numero);
}
