import { onValue, ref, type Unsubscribe } from "firebase/database";
import { FIREBASE_DATABASE_URL, obtenerDatabase } from "../config/firebase";
import type { PuntoHistorico } from "../utils/historicoSensores";

export type SensorHistorico = "temperatura" | "oxigeno";

const VENTANA_HISTORICO_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PUNTOS_GRAFICA = 288;

function normalizarValorHistorico(valor: unknown): number | null {
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function parsearClaveHora(clave: string): Date | null {
  const limpia = String(clave).trim();
  if (!/^\d{10}(\d{2})?$/.test(limpia)) return null;

  const anio = Number(limpia.slice(0, 4));
  const mes = Number(limpia.slice(4, 6)) - 1;
  const dia = Number(limpia.slice(6, 8));
  const hora = Number(limpia.slice(8, 10));
  const minuto = limpia.length === 12 ? Number(limpia.slice(10, 12)) : 0;

  if (anio < 2020 || anio > 2100 || mes < 0 || mes > 11 || dia < 1 || dia > 31) {
    return null;
  }

  const fecha = new Date(anio, mes, dia, hora, minuto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function convertirNodosAPuntos(
  nodos: Record<string, unknown> | null | undefined,
): PuntoHistorico[] {
  if (!nodos || typeof nodos !== "object" || Array.isArray(nodos)) return [];

  const desde = Date.now() - VENTANA_HISTORICO_MS;

  const todos = Object.entries(nodos)
    .map(([clave, valor]) => {
      const fecha = parsearClaveHora(clave);
      const numero = normalizarValorHistorico(valor);
      if (!fecha || numero === null) return null;
      return {
        fecha: fecha.getTime(),
        hora: fecha.toLocaleTimeString("es-CO", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        valor: numero,
      };
    })
    .filter((p) => p !== null)
    .sort((a, b) => a.fecha - b.fecha);

  let puntos = todos.filter((p) => p.fecha >= desde);

  if (puntos.length === 0 && todos.length > 0) {
    puntos = todos.slice(-MAX_PUNTOS_GRAFICA);
  } else if (puntos.length > MAX_PUNTOS_GRAFICA) {
    puntos = puntos.slice(-MAX_PUNTOS_GRAFICA);
  }

  return puntos.map(({ hora, valor }) => ({ hora, valor }));
}

function rutaHistoricoSensor(
  usuario: string,
  tanqueId: string,
  sensor: SensorHistorico,
): string {
  const u = usuario.trim().toUpperCase();
  const id = tanqueId.trim();
  return `${u}/TANQUES/${id}/historico/${sensor}`;
}

/** Lectura directa HTTP (reglas abiertas). Respaldo si el SDK no entrega datos. */
export async function cargarHistoricoSensorHttp(
  usuario: string,
  tanqueId: string,
  sensor: SensorHistorico,
): Promise<PuntoHistorico[]> {
  const ruta = rutaHistoricoSensor(usuario, tanqueId, sensor);
  const url = `${FIREBASE_DATABASE_URL}/${ruta}.json`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const nodos = (await res.json()) as Record<string, unknown> | null;
    return convertirNodosAPuntos(nodos ?? undefined);
  } catch {
    return [];
  }
}

export function suscribirHistoricoSensor(
  usuario: string,
  tanqueId: string,
  sensor: SensorHistorico,
  onDatos: (puntos: PuntoHistorico[]) => void,
): Unsubscribe | null {
  const db = obtenerDatabase();
  if (!db) return null;

  const ruta = ref(db, rutaHistoricoSensor(usuario, tanqueId, sensor));
  return onValue(
    ruta,
    (snapshot) => {
      const nodos = snapshot.val() as Record<string, unknown> | null;
      onDatos(convertirNodosAPuntos(nodos ?? undefined));
    },
    () => {
      void cargarHistoricoSensorHttp(usuario, tanqueId, sensor).then(onDatos);
    },
  );
}

/** Clave del intervalo de 10 min actual (redondeado hacia abajo). */
export function claveIntervalo10Min(fecha = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const minuto = Math.floor(fecha.getMinutes() / 10) * 10;
  return (
    String(fecha.getFullYear()) +
    p(fecha.getMonth() + 1) +
    p(fecha.getDate()) +
    p(fecha.getHours()) +
    p(minuto)
  );
}

/** @deprecated Usar claveIntervalo10Min. Mantiene compatibilidad con claves horarias. */
export function claveHoraActual(): string {
  return claveIntervalo10Min().slice(0, 10);
}
