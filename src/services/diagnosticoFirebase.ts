import { onValue, ref, type Unsubscribe } from "firebase/database";
import { obtenerDatabase } from "../config/firebase";
import type { DiagnosticoTarjetaFirebase } from "../types/firebaseNodos";

export function suscribirDiagnosticoUsuario(
  usuario: string,
  onDatos: (dato: DiagnosticoTarjetaFirebase | null) => void,
): Unsubscribe | null {
  const db = obtenerDatabase();
  if (!db) return null;

  return onValue(ref(db, `${usuario}/diagnostico`), (snap) => {
    onDatos((snap.val() as DiagnosticoTarjetaFirebase | null) ?? null);
  });
}

export function suscribirDiagnosticoTanque(
  usuario: string,
  tanqueId: string,
  onDatos: (dato: DiagnosticoTarjetaFirebase | null) => void,
): Unsubscribe | null {
  const db = obtenerDatabase();
  if (!db) return null;

  return onValue(ref(db, `${usuario}/TANQUES/${tanqueId}/diagnostico`), (snap) => {
    onDatos((snap.val() as DiagnosticoTarjetaFirebase | null) ?? null);
  });
}

export function etiquetaEstadoDiagnostico(estado?: string): string {
  switch (estado) {
    case "online":
    case "firebase_ok":
    case "wifi_ok":
    case "usuario_ok":
      return "OK";
    case "error_auth":
      return "Error Auth";
    case "error_wifi":
      return "Error WiFi";
    case "error_usuario":
      return "Usuario/clave app";
    case "error_tanque":
      return "Falta tanque";
    default:
      return estado ?? "—";
  }
}

export function claseEstadoDiagnostico(estado?: string): "ok" | "alerta" | "info" {
  if (estado === "online" || estado === "firebase_ok" || estado === "usuario_ok") return "ok";
  if (estado?.startsWith("error_")) return "alerta";
  return "info";
}
