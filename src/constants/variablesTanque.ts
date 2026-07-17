/** Variables que la ESP32 escribe en Firebase (lectura automática). */
export const VARIABLES_ESP32 = [
  { key: "oxigeno", label: "O₂", unidad: "mg/L", icono: "💨" },
  { key: "tds", label: "TDS", unidad: "ppm", icono: "💧" },
  { key: "ph", label: "pH", unidad: "", icono: "🧪" },
  { key: "temperatura", label: "Temp. agua", unidad: "°C", icono: "🌡" },
  {
    key: "temperaturaExterna",
    label: "Temp. externa",
    unidad: "°C",
    icono: "🌡",
  },
  { key: "flujo", label: "Flujo", unidad: "L/min", icono: "🌀" },
  { key: "humedad", label: "Humedad", unidad: "%", icono: "💦" },
] as const;

/** Variables que el usuario ingresa manualmente en la app. */
export const VARIABLES_USUARIO = [
  { key: "nitritos", label: "Nitritos", unidad: "mg/L", icono: "🔬" },
  { key: "nitratos", label: "Nitratos", unidad: "mg/L", icono: "🔬" },
  { key: "amoniaco", label: "Amoniaco", unidad: "mg/L", icono: "🔬" },
] as const;

export type ClaveVariableEsp32 = (typeof VARIABLES_ESP32)[number]["key"];
export type ClaveVariableUsuario = (typeof VARIABLES_USUARIO)[number]["key"];
