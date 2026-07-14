export interface PuntoHistorico {
  hora: string;
  valor: number;
}

function hashSemilla(texto: string): number {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = (hash << 5) - hash + texto.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Genera puntos horarios de prueba alrededor del valor actual (solo modo mock).
 */
export function generarHistorico24h(
  valorActual: number,
  semilla: string,
  variacion: number,
  minimo: number,
  maximo: number
): PuntoHistorico[] {
  const horas = 24;
  const base = hashSemilla(semilla);
  const ahora = new Date();

  return Array.from({ length: horas }, (_, indice) => {
    const horasAtras = horas - 1 - indice;
    const fecha = new Date(ahora.getTime() - horasAtras * 60 * 60 * 1000);
    const onda =
      Math.sin((indice + (base % 7)) * 0.55) * variacion * 0.45 +
      Math.cos((indice + (base % 5)) * 0.35) * variacion * 0.25;
    const tendencia = (indice - (horas - 1) / 2) * variacion * 0.02;
    const valor = Math.min(
      maximo,
      Math.max(minimo, valorActual + onda + tendencia)
    );

    return {
      hora: fecha.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      valor: Math.round(valor * 100) / 100,
    };
  });
}

/** Hay lectura en vivo desde la tarjeta ESP32. */
export function tanqueTieneLecturaEnVivo(tanque: {
  conectado: boolean;
  sensores: { oxigeno: number; temperatura: number };
}): boolean {
  if (!tanque.conectado) return false;
  return tanque.sensores.oxigeno > 0 || tanque.sensores.temperatura > 0;
}

/** Hay puntos en historico/ (puede ser simulación sin tarjeta en línea). */
export function tanqueTieneHistorico(
  historico: { oxigeno: PuntoHistorico[]; temperatura: PuntoHistorico[] },
): boolean {
  return historico.oxigeno.length > 0 || historico.temperatura.length > 0;
}
