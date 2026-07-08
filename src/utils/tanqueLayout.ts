export interface PosicionTanque {
  x: number;
  y: number;
  radio: number;
}

export interface LayoutTanques {
  ancho: number;
  alto: number;
  radio: number;
  posiciones: PosicionTanque[];
}

function calcularColumnas(cantidad: number): number {
  if (cantidad === 1) return 1;
  if (cantidad === 6) return 3;
  if (cantidad <= 4) return 2;
  if (cantidad <= 9) return 3;
  return 4;
}

/**
 * Calcula grilla y escala de tanques según la cantidad disponible.
 */
export function calcularLayoutTanques(
  cantidad: number,
  ancho = 700,
  alto = 400,
  compacto = false
): LayoutTanques {
  if (cantidad === 0) {
    return { ancho, alto, radio: 50, posiciones: [] };
  }

  const espacioTitulo = compacto ? 18 : 36;
  const margen = compacto ? 12 : 24;
  const anchoUtil = ancho - margen * 2;
  const altoUtil = alto - margen - espacioTitulo;

  const columnas = calcularColumnas(cantidad);
  const filas = Math.ceil(cantidad / columnas);
  const celdaAncho = anchoUtil / columnas;
  const celdaAlto = altoUtil / filas;

  const espacioExtraVertical = compacto ? 28 : 42;
  const maxRadioAncho = celdaAncho / 2 - (compacto ? 4 : 10);
  const maxRadioAlto = (celdaAlto - espacioExtraVertical) / 2 - (compacto ? 2 : 6);
  const radioMax = compacto ? 34 : 60;
  const radioMin = compacto ? 16 : 24;
  const radio = Math.max(radioMin, Math.min(radioMax, maxRadioAncho, maxRadioAlto));

  const posiciones = Array.from({ length: cantidad }, (_, indice) => {
    const columna = indice % columnas;
    const fila = Math.floor(indice / columnas);

    return {
      x: margen + celdaAncho * columna + celdaAncho / 2,
      y: espacioTitulo + celdaAlto * fila + celdaAlto / 2,
      radio,
    };
  });

  return { ancho, alto, radio, posiciones };
}
