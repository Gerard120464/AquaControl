import { validarAccesoApp } from "./usuarioService";
import {
  crearTanqueSiFalta,
  idTanque,
  leerNodoTanque,
} from "./tanquesAdminService";

export type ResultadoValidacionTarjeta =
  | { ok: true; tanqueId: string }
  | { ok: false; error: string };

/** Verifica USUARIO + clave de app en Firebase. */
export async function verificarAccesoTarjeta(
  usuario: string,
  claveApp: string,
): Promise<ResultadoValidacionTarjeta> {
  const usuarioNorm = usuario.trim().toUpperCase();
  const clave = claveApp.trim();

  if (!usuarioNorm || !clave) {
    return { ok: false, error: "Ingresa USUARIO y clave." };
  }

  const accesoOk = await validarAccesoApp(usuarioNorm, clave);
  if (!accesoOk) {
    return {
      ok: false,
      error: `USUARIO o clave no válidos (/${usuarioNorm}/clave en Firebase).`,
    };
  }

  return { ok: true, tanqueId: "" };
}

/** Verifica acceso y asegura que el tanque exista; si no, lo crea. */
export async function asegurarTanqueParaTarjeta(
  usuario: string,
  claveApp: string,
  numeroTanque: number,
): Promise<ResultadoValidacionTarjeta> {
  const acceso = await verificarAccesoTarjeta(usuario, claveApp);
  if (!acceso.ok) return acceso;

  const usuarioNorm = usuario.trim().toUpperCase();
  const tanqueId = idTanque(numeroTanque);

  try {
    const existente = await leerNodoTanque(usuarioNorm, tanqueId);
    if (!existente) {
      await crearTanqueSiFalta(usuarioNorm, claveApp.trim(), numeroTanque);
    }
    return { ok: true, tanqueId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo crear el tanque.",
    };
  }
}

export function resumenIdentidadTarjeta(config: {
  usuario: string;
  red: string;
  numeroTanque: number;
}): string {
  return `${config.usuario} · RED ${config.red} · tanque ${config.numeroTanque}`;
}
