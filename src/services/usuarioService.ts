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

export function mensajeUsuarioConectado(usuario: string): string {
  return `USUARIO CONECTADO — ${usuario.trim().toUpperCase()} verificado en Firebase.`;
}

export type ResultadoValidacionAcceso =
  | { ok: true; usuario: string; mensaje: string }
  | { ok: false; error: string };

export async function validarAccesoAppDetalle(
  usuario: string,
  clave: string,
): Promise<ResultadoValidacionAcceso> {
  const usuarioNorm = usuario.trim().toUpperCase();
  const claveNorm = clave.trim();

  if (!usuarioNorm || !claveNorm) {
    return { ok: false, error: "Ingresa USUARIO y clave." };
  }

  const datos = await leerUsuario(usuarioNorm);
  if (!datos) {
    return {
      ok: false,
      error: `USUARIO "${usuarioNorm}" no está creado en Firebase.`,
    };
  }

  const claveFirebase = leerClaveAppUsuario(datos);
  if (!claveFirebase) {
    return {
      ok: false,
      error: `USUARIO "${usuarioNorm}" existe pero no tiene clave en /${usuarioNorm}/clave.`,
    };
  }

  if (claveFirebase !== claveNorm) {
    return {
      ok: false,
      error: `Clave incorrecta para ${usuarioNorm}. Verifica /${usuarioNorm}/clave en Firebase.`,
    };
  }

  return {
    ok: true,
    usuario: usuarioNorm,
    mensaje: mensajeUsuarioConectado(usuarioNorm),
  };
}

export async function validarAccesoApp(
  usuario: string,
  clave: string,
): Promise<boolean> {
  const resultado = await validarAccesoAppDetalle(usuario, clave);
  return resultado.ok;
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
