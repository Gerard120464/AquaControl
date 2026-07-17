export type EstadoTanque = "normal" | "alarma";

export type EstadoEquipo = "encendido" | "apagado" | "espera" | "activa";

/** Lecturas automáticas desde la tarjeta ESP32. */
export interface SensoresEsp32 {
  oxigeno: number;
  tds: number;
  ph: number;
  temperatura: number;
  temperaturaExterna: number;
  flujo: number;
  humedad: number;
}

/** Valores de calidad del agua ingresados por el usuario. */
export interface VariablesUsuario {
  nitritos: number;
  nitratos: number;
  amoniaco: number;
}

export interface Sensores extends SensoresEsp32, VariablesUsuario {}

export interface EquiposTanque {
  recirculador: EstadoEquipo;
  nanoburbujas: EstadoEquipo;
  alimentador: EstadoEquipo;
  iluminacion: EstadoEquipo;
}

export interface ProduccionTanque {
  biomasa: number;
  peces: number;
  pesoPromedio: number;
  conversion: number;
}

export interface AlarmaTanque {
  mensaje: string;
  tipo: "ok" | "info" | "alerta";
}

export interface Tanque {
  id: string;
  nombre: string;
  enUso: boolean;
  estado: EstadoTanque;
  /** Tarjeta ESP32 reportando en Firebase */
  conectado: boolean;
  sensores: Sensores;
  equipos: EquiposTanque;
  produccion: ProduccionTanque;
  alarmas: AlarmaTanque[];
}
