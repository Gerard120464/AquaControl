/** Credenciales de acceso a la app (registradas en Firebase por el administrador). */
export interface CredencialesApp {
  usuario: string;
  clave: string;
}

export type EstadoConexion =
  | "inicial"
  | "enviando_bluetooth"
  | "esperando_esp32"
  | "conectado"
  | "error";

/** Sesión activa: USUARIO + clave de app (distinta a la clave WiFi de la red). */
export interface SesionAquaControl {
  usuario: string;
  clave: string;
}

/**
 * Configuración enviada a cada tarjeta ESP32 por Bluetooth.
 * Única identificación de la tarjeta: RED + CLAVE (WiFi) + número de tanque.
 */
export interface ConfiguracionTarjeta {
  red: string;
  clave: string;
  numeroTanque: number;
}
