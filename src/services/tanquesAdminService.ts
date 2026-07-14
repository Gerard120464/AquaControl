import { get, ref, remove, set, update } from "firebase/database";
import { obtenerDatabase } from "../config/firebase";
import type { NodoTanqueFirebase } from "../types/firebaseNodos";
import { tarjetaEnLinea } from "../utils/conexionTarjeta";
import { asegurarAccesoApp, marcarConfigurado } from "./usuarioService";

export function idTanque(numero: number): string {
  return `T-${String(numero).padStart(2, "0")}`;
}

export function numeroDesdeIdTanque(id: string): number {
  const match = id.match(/^T-(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

export function plantillaTanque(numero: number): NodoTanqueFirebase {
  const id = idTanque(numero);
  return {
    numero,
    nombre: id,
    enUso: true,
    estado: "normal",
    conectado: "0",
    temperatura: 0,
    oxigeno: 0,
    ph: 7,
    tds: 0,
    ec: 0,
    nh4: 0,
  };
}

export async function listarIdsTanques(usuario: string): Promise<string[]> {
  const db = obtenerDatabase();
  if (!db) return [];

  const snapshot = await get(ref(db, `${usuario}/TANQUES`));
  if (!snapshot.exists()) return [];

  return Object.keys(snapshot.val() as Record<string, unknown>).sort(
    (a, b) => numeroDesdeIdTanque(a) - numeroDesdeIdTanque(b),
  );
}

/**
 * Crea T-01 … T-N y variables en Firebase.
 * Solo si USUARIO + clave coinciden con lo registrado en Firebase.
 */
export async function crearTanquesIniciales(
  usuario: string,
  clave: string,
  cantidad: number,
): Promise<string[]> {
  const db = obtenerDatabase();
  if (!db) throw new Error("Firebase no configurado");
  await asegurarAccesoApp(usuario, clave);

  if (cantidad < 1 || cantidad > 24) {
    throw new Error("El número de tanques debe estar entre 1 y 24");
  }

  const existentes = await listarIdsTanques(usuario);
  if (existentes.length > 0) {
    throw new Error("Ya existen tanques. Usa Tanque (+) para agregar más.");
  }

  const ids: string[] = [];
  const payload: Record<string, NodoTanqueFirebase> = {};

  for (let i = 1; i <= cantidad; i++) {
    const id = idTanque(i);
    ids.push(id);
    payload[id] = plantillaTanque(i);
  }

  await set(ref(db, `${usuario}/TANQUES`), payload);
  await update(ref(db, usuario), { configurado: true, conectado: "0" });
  await marcarConfigurado(usuario);

  return ids;
}

/** Agrega un tanque nuevo (Tanque +). Requiere USUARIO + clave válidos. */
export async function agregarTanque(
  usuario: string,
  clave: string,
): Promise<string> {
  const db = obtenerDatabase();
  if (!db) throw new Error("Firebase no configurado");
  await asegurarAccesoApp(usuario, clave);

  const existentes = await listarIdsTanques(usuario);
  const siguiente =
    existentes.reduce(
      (max, id) => Math.max(max, numeroDesdeIdTanque(id)),
      0,
    ) + 1;

  const id = idTanque(siguiente);
  await set(ref(db, `${usuario}/TANQUES/${id}`), plantillaTanque(siguiente));
  return id;
}

/** Tanque sin tarjeta vinculada y con valores iniciales de plantilla. */
export function esTanqueVacio(nodo: NodoTanqueFirebase): boolean {
  if (tarjetaEnLinea(nodo)) return false;

  if (nodo.registro && Object.keys(nodo.registro).length > 0) return false;

  const numero = nodo.numero ?? numeroDesdeIdTanque(nodo.nombre ?? "");
  const base = plantillaTanque(numero > 0 ? numero : 1);

  const campos: (keyof NodoTanqueFirebase)[] = [
    "temperatura",
    "oxigeno",
    "ph",
    "tds",
    "ec",
    "nh4",
  ];

  for (const campo of campos) {
    const valor = nodo[campo];
    const defecto = base[campo];
    if (valor === undefined || valor === null) continue;
    if (Number(valor) !== Number(defecto)) return false;
  }

  return true;
}

export async function leerNodoTanque(
  usuario: string,
  tanqueId: string,
): Promise<NodoTanqueFirebase | null> {
  const db = obtenerDatabase();
  if (!db) return null;

  const snapshot = await get(ref(db, `${usuario}/TANQUES/${tanqueId}`));
  if (!snapshot.exists()) return null;
  return snapshot.val() as NodoTanqueFirebase;
}

export async function evaluarEliminacionTanque(
  usuario: string,
  tanqueId: string,
): Promise<{ puede: true } | { puede: false; motivo: string }> {
  const nodo = await leerNodoTanque(usuario, tanqueId);
  if (!nodo) {
    return { puede: false, motivo: "El tanque no existe en Firebase." };
  }

  if (!esTanqueVacio(nodo)) {
    return {
      puede: false,
      motivo:
        "No se puede borrar: tiene tarjeta vinculada o datos de sensores. Solo tanques vacíos.",
    };
  }

  const todos = await listarIdsTanques(usuario);
  if (todos.length <= 1) {
    return {
      puede: false,
      motivo: "Debe quedar al menos un tanque en la instalación.",
    };
  }

  return { puede: true };
}

/** Elimina un tanque vacío (sin tarjeta ni datos). Requiere USUARIO + clave válidos. */
export async function eliminarTanque(
  usuario: string,
  clave: string,
  tanqueId: string,
): Promise<void> {
  const db = obtenerDatabase();
  if (!db) throw new Error("Firebase no configurado");

  await asegurarAccesoApp(usuario, clave);

  const evaluacion = await evaluarEliminacionTanque(usuario, tanqueId);
  if (!evaluacion.puede) {
    throw new Error(evaluacion.motivo);
  }

  await remove(ref(db, `${usuario}/TANQUES/${tanqueId}`));
}
