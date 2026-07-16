/**
 * Contrato AquaControl — configuración de tarjeta ESP32
 *
 * Identificación de cada tarjeta:
 *   USUARIO + RED (WiFi) + número de tanque
 *
 * La app verifica USUARIO + clave de app en Firebase antes de enviar.
 * La CLAVE WiFi es solo para conectar la tarjeta a la red del campo.
 *
 * Línea hacia la tarjeta (portal / Monitor Serie):
 *   RED,CLAVE_WIFI,USUARIO,CLAVE_APP,numeroTanque
 *   Ejemplo: TITO,wifiPass123,GERARD,31910951,1
 */

export const PROTOCOLO_BT = {
  separador: ",",
  nombreDispositivo: "ESP32_BT",
  respuestaOk: "OK",
  campos: 5,
} as const;

export interface MensajeConfigTarjeta {
  red: string;
  claveWifi: string;
  usuario: string;
  claveApp: string;
  numeroTanque: number;
}

export function formatearMensajeConfigTarjeta(
  config: MensajeConfigTarjeta,
): string {
  return [
    config.red,
    config.claveWifi,
    config.usuario,
    config.claveApp,
    String(config.numeroTanque),
  ].join(PROTOCOLO_BT.separador);
}

export function parsearMensajeConfigTarjeta(
  mensaje: string,
): MensajeConfigTarjeta | null {
  const partes = mensaje.trim().split(PROTOCOLO_BT.separador);
  if (partes.length !== PROTOCOLO_BT.campos) return null;

  const [red, claveWifi, usuario, claveApp, numeroStr] = partes.map((p) =>
    p.trim(),
  );
  const numeroTanque = Number(numeroStr);

  if (
    !red ||
    !claveWifi ||
    !usuario ||
    !claveApp ||
    !Number.isInteger(numeroTanque) ||
    numeroTanque < 1
  ) {
    return null;
  }

  return {
    red,
    claveWifi,
    usuario: usuario.toUpperCase(),
    claveApp,
    numeroTanque,
  };
}

/** @deprecated usar formatearMensajeConfigTarjeta */
export function formatearMensajeBluetoothTarjeta(
  red: string,
  clave: string,
  numeroTanque: number,
): string {
  return `${red},${clave},USUARIO,CLAVE_APP,${numeroTanque}`;
}
