export type EstadoTanque = "normal" | "alarma";

export type EstadoEquipo = "encendido" | "apagado" | "espera" | "activa";

export interface Sensores {
  temperatura: number;
  oxigeno: number;
  ph: number;
  tds: number;
  ec: number;
  nh4: number;
}

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
