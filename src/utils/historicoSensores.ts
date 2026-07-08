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
 * Genera puntos horarios de prueba alrededor del valor actual.
 * Al conectar Firebase, reemplazar por lecturas reales.
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
