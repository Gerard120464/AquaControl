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
 *       ── ESP32 (automático) ──
 *       oxigeno, tds, ph, temperatura, temperaturaExterna, flujo, humedad
 *       ── Usuario (manual) ──
 *       nitritos, nitratos, amoniaco
 *       registro/  ← ficha de la tarjeta al vincularse (red, MAC…)
 *       historico/  ← tendencia temp/O2 cada 10 min (clave YYYYMMDDHHmm)
 */

export interface RegistroTarjetaFirebase {
  red?: string;
  claveWifi?: string;
  tanque?: string;
  mac?: string;
  actualizado?: string;
}

export interface DiagnosticoTarjetaFirebase {
  estado?: string;
  mensaje?: string;
  tanque?: string;
  actualizado?: string | number;
}

export interface NodoTanqueFirebase {
  numero?: number;
  nombre?: string;
  conectado?: string | number | boolean;
  /** ISO local o epoch — la ESP32 lo actualiza cada heartbeat (~30 s). */
  ultimoHeartbeat?: string | number;
  registro?: RegistroTarjetaFirebase;
  diagnostico?: DiagnosticoTarjetaFirebase;
  historico?: {
    temperatura?: Record<string, number>;
    oxigeno?: Record<string, number>;
  };
  /** ESP32 */
  oxigeno?: number;
  tds?: number;
  ph?: number;
  temperatura?: number;
  temperaturaExterna?: number;
  flujo?: number;
  humedad?: number;
  /** Usuario */
  nitritos?: number;
  nitratos?: number;
  amoniaco?: number;
  /** Compatibilidad con nodos antiguos */
  ec?: number;
  nh4?: number;
  enUso?: boolean | string;
  estado?: string;
}

export interface NodoUsuarioFirebase {
  clave?: string | number;
  /** Variante con mayúscula (ej. FINCA1/Clave). */
  Clave?: string | number;
  configurado?: boolean | string;
  conectado?: string;
  ultimoHeartbeat?: string | number;
  diagnostico?: DiagnosticoTarjetaFirebase;
  TANQUES?: Record<string, NodoTanqueFirebase>;
}
