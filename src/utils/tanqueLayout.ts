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

/**
 * Calcula grilla y escala de tanques según la cantidad disponible.
 */
export function calcularLayoutTanques(
  cantidad: number,
  ancho = 700,
  alto = 400
): LayoutTanques {
  if (cantidad === 0) {
    return { ancho, alto, radio: 50, posiciones: [] };
  }

  const espacioTitulo = 36;
  const margen = 24;
  const anchoUtil = ancho - margen * 2;
  const altoUtil = alto - margen - espacioTitulo;

  const columnas =
    cantidad === 1 ? 1 : cantidad <= 4 ? 2 : cantidad <= 9 ? 3 : 4;
  const filas = Math.ceil(cantidad / columnas);
  const celdaAncho = anchoUtil / columnas;
  const celdaAlto = altoUtil / filas;

  const espacioExtraVertical = 42;
  const maxRadioAncho = celdaAncho / 2 - 10;
  const maxRadioAlto = (celdaAlto - espacioExtraVertical) / 2 - 6;
  const radio = Math.max(24, Math.min(60, maxRadioAncho, maxRadioAlto));

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
