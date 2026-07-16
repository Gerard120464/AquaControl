/** Credenciales de acceso a la app (registradas en Firebase por el administrador). */
export interface CredencialesApp {
  usuario: string;
  clave: string;
}

export type EstadoConexion =
  | "inicial"
  | "verificando"
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
 * Configuración completa enviada a cada tarjeta ESP32.
 * Identificación: USUARIO + RED + número de tanque.
 */
export interface ConfiguracionTarjeta {
  usuario: string;
  claveApp: string;
  red: string;
  claveWifi: string;
  numeroTanque: number;
}
