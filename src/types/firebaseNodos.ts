/**
 * Estructura Firebase — la APP crea y administra los nodos.
 * El administrador crea primero /{USUARIO}/clave en Firebase.
 *
 * GERARD/
 *   clave          ← acceso app (distinta a clave WiFi)
 *   configurado
 *   conectado
 *   TANQUES/
 *     T-01/
 *       nombre, enUso, estado, conectado, ultimoHeartbeat
 *       temperatura, oxigeno, ph, tds, ec, nh4
 *       registro/  ← la tarjeta ESP32 actualiza al conectarse
 */

export interface RegistroTarjetaFirebase {
  red?: string;
  claveWifi?: string;
  tanque?: string;
  mac?: string;
  actualizado?: string;
}

export interface NodoTanqueFirebase {
  numero?: number;
  nombre?: string;
  conectado?: string | number | boolean;
  /** ISO local o epoch — la ESP32 lo actualiza cada heartbeat (~30 s). */
  ultimoHeartbeat?: string | number;
  registro?: RegistroTarjetaFirebase;
  historico?: {
    temperatura?: Record<string, number>;
    oxigeno?: Record<string, number>;
  };
  temperatura?: number;
  oxigeno?: number;
  ph?: number;
  tds?: number;
  ec?: number;
  nh4?: number;
  enUso?: boolean | string;
  estado?: string;
}

export interface NodoUsuarioFirebase {
  clave?: string;
  configurado?: boolean | string;
  conectado?: string;
  ultimoHeartbeat?: string | number;
  TANQUES?: Record<string, NodoTanqueFirebase>;
}
