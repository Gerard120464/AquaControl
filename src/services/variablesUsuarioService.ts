import { ref, update } from "firebase/database";
import { obtenerDatabase } from "../config/firebase";
import type { VariablesUsuario } from "../types/tanque";
import { asegurarAccesoApp } from "./usuarioService";

export async function guardarVariablesUsuario(
  usuario: string,
  clave: string,
  tanqueId: string,
  valores: VariablesUsuario,
): Promise<void> {
  const db = obtenerDatabase();
  if (!db) throw new Error("Firebase no configurado");

  await asegurarAccesoApp(usuario, clave);

  await update(ref(db, `${usuario}/TANQUES/${tanqueId}`), {
    nitritos: valores.nitritos,
    nitratos: valores.nitratos,
    amoniaco: valores.amoniaco,
    variablesUsuarioActualizado: new Date().toISOString(),
  });
}
