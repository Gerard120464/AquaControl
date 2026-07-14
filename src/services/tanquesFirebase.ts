import { onValue, ref, type Unsubscribe } from "firebase/database";
import { obtenerDatabase } from "../config/firebase";
import type { NodoTanqueFirebase } from "../types/firebaseNodos";
import type {
  AlarmaTanque,
  EquiposTanque,
  ProduccionTanque,
  Sensores,
  Tanque,
} from "../types/tanque";
import {
  contarTanquesEnLinea,
  INTERVALO_REVISION_CONEXION_MS,
  tarjetaEnLinea,
} from "../utils/conexionTarjeta";

const sensoresVacios: Sensores = {
  temperatura: 0,
  oxigeno: 0,
  ph: 0,
  tds: 0,
  ec: 0,
  nh4: 0,
};

const equiposVacios: EquiposTanque = {
  recirculador: "apagado",
  nanoburbujas: "apagado",
  alimentador: "apagado",
  iluminacion: "apagado",
};

const produccionVacia: ProduccionTanque = {
  biomasa: 0,
  peces: 0,
  pesoPromedio: 0,
  conversion: 0,
};

function numero(valor: unknown, fallback = 0): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : fallback;
}

function boolEnUso(valor: unknown): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "string") {
    const v = valor.toLowerCase();
    return v === "1" || v === "true" || v === "on" || v === "si";
  }
  if (typeof valor === "number") return valor === 1;
  return true;
}

function mapearTanque(id: string, nodo: NodoTanqueFirebase, ahora: number): Tanque {
  const sensores: Sensores = {
    temperatura: numero(nodo.temperatura, sensoresVacios.temperatura),
    oxigeno: numero(nodo.oxigeno, sensoresVacios.oxigeno),
    ph: numero(nodo.ph, sensoresVacios.ph),
    tds: numero(nodo.tds, sensoresVacios.tds),
    ec: numero(nodo.ec, sensoresVacios.ec),
    nh4: numero(nodo.nh4, sensoresVacios.nh4),
  };

  const enUso = boolEnUso(nodo.enUso);
  const estadoRaw = String(nodo.estado ?? "normal").toLowerCase();
  const estado = estadoRaw === "alarma" ? "alarma" : "normal";
  const nombre = nodo.nombre ?? id;
  const online = tarjetaEnLinea(nodo, ahora);

  const alarmas: AlarmaTanque[] = [];
  if (online) {
    alarmas.push({ mensaje: "Tarjeta en línea", tipo: "ok" });
  } else {
    alarmas.push({ mensaje: "Tarjeta sin señal", tipo: "alerta" });
  }
  if (!enUso) {
    alarmas.push({ mensaje: "Tanque fuera de uso", tipo: "info" });
  }
  if (nodo.registro?.actualizado) {
    alarmas.push({
      mensaje: `Registro: ${nodo.registro.red} / ${nodo.registro.tanque}`,
      tipo: "info",
    });
  }

  return {
    id,
    nombre,
    enUso,
    estado,
    conectado: online,
    sensores,
    equipos: equiposVacios,
    produccion: produccionVacia,
    alarmas,
  };
}

function mapearTanques(
  nodos: Record<string, NodoTanqueFirebase>,
  ahora: number,
): Tanque[] {
  return Object.entries(nodos)
    .map(([id, nodo]) => mapearTanque(id, nodo ?? {}, ahora))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function suscribirConRevision(
  emitir: () => void,
  onUnsubscribe: Unsubscribe,
): Unsubscribe {
  const intervalo = window.setInterval(emitir, INTERVALO_REVISION_CONEXION_MS);
  return () => {
    window.clearInterval(intervalo);
    onUnsubscribe();
  };
}

export function suscribirTanques(
  usuario: string,
  onDatos: (tanques: Tanque[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe | null {
  const db = obtenerDatabase();
  if (!db) return null;

  let ultimosNodos: Record<string, NodoTanqueFirebase> | null = null;

  const emitir = () => {
    if (!ultimosNodos) return;
    onDatos(mapearTanques(ultimosNodos, Date.now()));
  };

  const ruta = ref(db, `${usuario}/TANQUES`);
  const cancelarValor = onValue(
    ruta,
    (snapshot) => {
      if (!snapshot.exists()) {
        ultimosNodos = null;
        onDatos([]);
        return;
      }

      ultimosNodos = snapshot.val() as Record<string, NodoTanqueFirebase>;
      emitir();
    },
    (error) => onError?.(error),
  );

  return suscribirConRevision(emitir, cancelarValor);
}

export function suscribirEstadoEsp32(
  usuario: string,
  onEstado: (online: boolean, tanquesOnline: number) => void,
): Unsubscribe | null {
  const db = obtenerDatabase();
  if (!db) return null;

  let ultimosNodos: Record<string, NodoTanqueFirebase> | null = null;

  const emitir = () => {
    if (!ultimosNodos) {
      onEstado(false, 0);
      return;
    }

    const cantidad = contarTanquesEnLinea(ultimosNodos, Date.now());
    onEstado(cantidad > 0, cantidad);
  };

  const cancelarValor = onValue(ref(db, `${usuario}/TANQUES`), (snapshot) => {
    if (!snapshot.exists()) {
      ultimosNodos = null;
      onEstado(false, 0);
      return;
    }

    ultimosNodos = snapshot.val() as Record<string, NodoTanqueFirebase>;
    emitir();
  });

  return suscribirConRevision(emitir, cancelarValor);
}
