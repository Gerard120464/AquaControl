import { onValue, ref, type Unsubscribe } from "firebase/database";
import { obtenerDatabase } from "../config/firebase";
import type { PuntoHistorico } from "../utils/historicoSensores";

export type SensorHistorico = "temperatura" | "oxigeno";

/**
 * Histórico en Firebase (escrito por ESP32 cada lectura):
 *
 * /{USUARIO}/TANQUES/T-01/
 *   temperatura: 13.2          ← valor actual
 *   historico/
 *     temperatura/
 *       202607091030: 13.1      ← clave = YYYYMMDDHHmm (cada 10 min, hora local)
 *       202607091040: 13.4
 *     oxigeno/
 *       202607091030: 8.5
 *
 * También se aceptan claves horarias legadas YYYYMMDDHH (10 dígitos).
 */

function parsearClaveHora(clave: string): Date | null {
  if (!/^\d{10}(\d{2})?$/.test(clave)) return null;
  const anio = Number(clave.slice(0, 4));
  const mes = Number(clave.slice(4, 6)) - 1;
  const dia = Number(clave.slice(6, 8));
  const hora = Number(clave.slice(8, 10));
  const minuto = clave.length === 12 ? Number(clave.slice(10, 12)) : 0;
  const fecha = new Date(anio, mes, dia, hora, minuto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function convertirNodosAPuntos(
  nodos: Record<string, number> | undefined,
): PuntoHistorico[] {
  if (!nodos) return [];

  const hace24h = Date.now() - 24 * 60 * 60 * 1000;

  return Object.entries(nodos)
    .map(([clave, valor]) => {
      const fecha = parsearClaveHora(clave);
      if (!fecha || fecha.getTime() < hace24h) return null;
      const numero = Number(valor);
      if (!Number.isFinite(numero)) return null;
      return {
        fecha: fecha.getTime(),
        hora: fecha.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        valor: numero,
      };
    })
    .filter((p) => p !== null)
    .sort((a, b) => a.fecha - b.fecha)
    .map(({ hora, valor }) => ({ hora, valor }));
}

export function suscribirHistoricoSensor(
  usuario: string,
  tanqueId: string,
  sensor: SensorHistorico,
  onDatos: (puntos: PuntoHistorico[]) => void,
): Unsubscribe | null {
  const db = obtenerDatabase();
  if (!db) return null;

  const ruta = ref(db, `${usuario}/TANQUES/${tanqueId}/historico/${sensor}`);
  return onValue(ruta, (snapshot) => {
    const nodos = snapshot.val() as Record<string, number> | null;
    onDatos(convertirNodosAPuntos(nodos ?? undefined));
  });
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
