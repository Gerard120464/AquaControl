import { get, ref, update } from "firebase/database";
import { obtenerDatabase } from "../config/firebase";
import type { NodoUsuarioFirebase } from "../types/firebaseNodos";

export function leerClaveAppUsuario(
  datos: NodoUsuarioFirebase | null,
): string | null {
  if (!datos) return null;
  const raw = datos.clave ?? datos.Clave;
  if (raw == null || raw === "") return null;
  return String(raw).trim();
}

export async function leerUsuario(
  usuario: string,
): Promise<NodoUsuarioFirebase | null> {
  const db = obtenerDatabase();
  if (!db) return null;

  const snapshot = await get(ref(db, usuario));
  if (!snapshot.exists()) return null;
  return snapshot.val() as NodoUsuarioFirebase;
}

export async function validarAccesoApp(
  usuario: string,
  clave: string,
): Promise<boolean> {
  const datos = await leerUsuario(usuario);
  const claveFirebase = leerClaveAppUsuario(datos);
  if (!claveFirebase) return false;
  return claveFirebase === clave.trim();
}

/** Obligatorio antes de que la app escriba tanques o nodos en Firebase. */
export async function asegurarAccesoApp(
  usuario: string,
  clave: string,
): Promise<void> {
  const valido = await validarAccesoApp(usuario, clave);
  if (!valido) {
    throw new Error(
      "USUARIO o clave no válidos en Firebase. No se puede crear ni modificar tanques.",
    );
  }
}

export async function cambiarClaveApp(
  usuario: string,
  claveActual: string,
  claveNueva: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = obtenerDatabase();
  if (!db) return { ok: false, error: "Firebase no configurado" };

  const valida = await validarAccesoApp(usuario, claveActual);
  if (!valida) {
    return { ok: false, error: "La clave actual no es correcta" };
  }

  if (claveNueva.trim().length < 4) {
    return { ok: false, error: "La clave nueva debe tener al menos 4 caracteres" };
  }

  await update(ref(db, usuario), { clave: claveNueva });
  return { ok: true };
}

export async function marcarConfigurado(usuario: string): Promise<void> {
  const db = obtenerDatabase();
  if (!db) return;
  await update(ref(db, usuario), { configurado: true });
}

export async function contarTanques(usuario: string): Promise<number> {
  const datos = await leerUsuario(usuario);
  if (!datos?.TANQUES) return 0;
  return Object.keys(datos.TANQUES).length;
}
