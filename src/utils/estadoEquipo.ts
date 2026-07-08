import type { EstadoEquipo } from "../types/tanque";

const etiquetasEquipo: Record<EstadoEquipo, string> = {
  encendido: "ENCENDIDO",
  apagado: "APAGADO",
  espera: "ESPERA",
  activa: "ACTIVA",
};

export function etiquetaEquipo(estado: EstadoEquipo): string {
  return etiquetasEquipo[estado];
}

export function claseEquipo(estado: EstadoEquipo): "on" | "off" {
  return estado === "apagado" || estado === "espera" ? "off" : "on";
}
