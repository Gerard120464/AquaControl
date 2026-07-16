import { useCallback, useState } from "react";
import {
  agregarTanque,
  listarIdsTanques,
  numeroDesdeIdTanque,
} from "../services/tanquesAdminService";
import {
  enviarConfiguracionTarjetaBluetooth,
  esperarTarjetaEnLinea,
} from "../services/esp32Bluetooth";
import {
  asegurarTanqueParaTarjeta,
  resumenIdentidadTarjeta,
  verificarAccesoTarjeta,
} from "../services/tarjetaConfigService";
import type { EstadoConexion } from "../types/conexion";

export type PasoConfigTarjeta = 1 | 2 | 3;

/**
 * Flujo tarjeta nueva:
 * 1) USUARIO + clave → verificar Firebase
 * 2) Elegir tanque existente o agregar uno
 * 3) RED + clave WiFi → enviar al ESP32
 */
export function useConexionEsp32() {
  const [paso, setPaso] = useState<PasoConfigTarjeta>(1);
  const [accesoVerificado, setAccesoVerificado] = useState(false);
  const [tanqueListo, setTanqueListo] = useState(false);

  const [tanquesDisponibles, setTanquesDisponibles] = useState<string[]>([]);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState("");
  const [usuario, setUsuario] = useState("");
  const [claveApp, setClaveApp] = useState("");
  const [red, setRed] = useState("");
  const [claveWifi, setClaveWifi] = useState("");
  const [estado, setEstado] = useState<EstadoConexion>("inicial");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const usuarioNorm = usuario.trim().toUpperCase();

  const recargarTanques = useCallback(async (u: string, clave: string) => {
    const verif = await verificarAccesoTarjeta(u, clave);
    if (!verif.ok) return verif;

    const ids = await listarIdsTanques(u);
    setTanquesDisponibles(ids);
    return { ok: true as const, ids };
  }, []);

  const verificarUsuarioClave = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    setEstado("verificando");

    const resultado = await recargarTanques(usuarioNorm, claveApp);
    setCargando(false);

    if (!resultado.ok) {
      setEstado("error");
      setMensaje(resultado.error);
      setAccesoVerificado(false);
      setPaso(1);
      return false;
    }

    setAccesoVerificado(true);
    setPaso(2);
    setEstado("inicial");
    setMensaje(
      resultado.ids.length > 0
        ? "Acceso OK. Selecciona un tanque o agrega uno nuevo."
        : "Acceso OK. Agrega un tanque para esta tarjeta.",
    );

    if (resultado.ids.length > 0) {
      setTanqueSeleccionado((actual) =>
        resultado.ids.includes(actual) ? actual : resultado.ids[0],
      );
    } else {
      setTanqueSeleccionado("");
      setTanqueListo(false);
    }

    return true;
  }, [usuarioNorm, claveApp, recargarTanques]);

  const confirmarTanque = useCallback((id: string) => {
    setTanqueSeleccionado(id);
    setTanqueListo(true);
    setPaso(3);
    setMensaje(`Tanque ${id} listo. Ingresa RED y clave WiFi del campo.`);
  }, []);

  const agregarNuevoTanque = useCallback(async () => {
    if (!accesoVerificado) return false;

    setCargando(true);
    setMensaje("Creando tanque en Firebase...");
    try {
      const nuevoId = await agregarTanque(usuarioNorm, claveApp.trim());
      const ids = await listarIdsTanques(usuarioNorm);
      setTanquesDisponibles(ids);
      confirmarTanque(nuevoId);
      setEstado("inicial");
      setMensaje(`Tanque ${nuevoId} creado. Ingresa RED y clave WiFi.`);
      return true;
    } catch (e) {
      setEstado("error");
      setMensaje(e instanceof Error ? e.message : "Error al crear tanque.");
      return false;
    } finally {
      setCargando(false);
    }
  }, [accesoVerificado, usuarioNorm, claveApp, confirmarTanque]);

  const enviarConfiguracion = useCallback(async () => {
    if (!accesoVerificado || !tanqueListo || !tanqueSeleccionado) {
      setMensaje("Completa los pasos 1 y 2 antes de enviar.");
      return false;
    }
    if (!red.trim() || !claveWifi.trim()) {
      setMensaje("Ingresa RED y clave WiFi.");
      return false;
    }

    const numeroTanque = numeroDesdeIdTanque(tanqueSeleccionado);
    if (numeroTanque < 1) {
      setMensaje("Tanque inválido.");
      return false;
    }

    setEstado("verificando");
    setMensaje("Verificando y asegurando tanque en Firebase...");

    const validacion = await asegurarTanqueParaTarjeta(
      usuarioNorm,
      claveApp.trim(),
      numeroTanque,
    );

    if (!validacion.ok) {
      setEstado("error");
      setMensaje(validacion.error);
      return false;
    }

    const config = {
      usuario: usuarioNorm,
      claveApp: claveApp.trim(),
      red: red.trim(),
      claveWifi: claveWifi.trim(),
      numeroTanque,
    };

    setEstado("enviando_bluetooth");
    setMensaje(`Enviando al ESP32: ${resumenIdentidadTarjeta(config)}`);

    const resultado = await enviarConfiguracionTarjetaBluetooth(config);

    if (!resultado.ok) {
      setEstado("error");
      setMensaje(resultado.error);
      return false;
    }

    setEstado("esperando_esp32");
    setMensaje(
      "Usa portal WiFi AquaControl-Setup o Monitor Serie USB con la línea copiada.",
    );

    const online = await esperarTarjetaEnLinea(usuarioNorm, numeroTanque);
    if (!online) {
      setEstado("error");
      setMensaje("La tarjeta aún no reporta conexión. Revisa diagnóstico abajo.");
      return false;
    }

    setEstado("conectado");
    setMensaje(`Tarjeta configurada: ${resumenIdentidadTarjeta(config)}`);
    return true;
  }, [
    accesoVerificado,
    tanqueListo,
    tanqueSeleccionado,
    red,
    claveWifi,
    usuarioNorm,
    claveApp,
  ]);

  const reiniciarFlujo = useCallback(() => {
    setPaso(1);
    setAccesoVerificado(false);
    setTanqueListo(false);
    setTanquesDisponibles([]);
    setTanqueSeleccionado("");
    setRed("");
    setClaveWifi("");
    setEstado("inicial");
    setMensaje("");
  }, []);

  const numeroSeleccionado = numeroDesdeIdTanque(tanqueSeleccionado);
  const wifiHabilitado = accesoVerificado && tanqueListo;

  return {
    paso,
    accesoVerificado,
    tanqueListo,
    wifiHabilitado,
    tanquesDisponibles,
    tanqueSeleccionado,
    setTanqueSeleccionado,
    numeroSeleccionado,
    usuario,
    setUsuario,
    claveApp,
    setClaveApp,
    red,
    setRed,
    claveWifi,
    setClaveWifi,
    estado,
    mensaje,
    cargando,
    verificarUsuarioClave,
    confirmarTanque,
    agregarNuevoTanque,
    enviarConfiguracion,
    reiniciarFlujo,
  };
}
