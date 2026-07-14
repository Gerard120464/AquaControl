import { useCallback, useEffect, useState } from "react";
import {
  listarIdsTanques,
  numeroDesdeIdTanque,
} from "../services/tanquesAdminService";
import {
  enviarConfiguracionTarjetaBluetooth,
  esperarTarjetaEnLinea,
} from "../services/esp32Bluetooth";
import type { EstadoConexion } from "../types/conexion";

export function useConexionEsp32(usuario: string | null) {
  const [tanquesDisponibles, setTanquesDisponibles] = useState<string[]>([]);
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState("");
  const [red, setRed] = useState("");
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState<EstadoConexion>("inicial");
  const [mensaje, setMensaje] = useState("");

  const cargarTanques = useCallback(async () => {
    if (!usuario) {
      setTanquesDisponibles([]);
      return;
    }
    const ids = await listarIdsTanques(usuario);
    setTanquesDisponibles(ids);
    if (ids.length > 0 && !ids.includes(tanqueSeleccionado)) {
      setTanqueSeleccionado(ids[0]);
    }
  }, [usuario, tanqueSeleccionado]);

  useEffect(() => {
    cargarTanques();
  }, [cargarTanques]);

  const enviarConfiguracion = useCallback(
    async (opciones?: { simularBluetooth?: boolean }) => {
      if (!usuario) {
        setMensaje("Inicia sesión en Configuración primero.");
        return false;
      }
      if (!tanqueSeleccionado) {
        setMensaje("Crea tanques en Configuración antes de configurar una tarjeta.");
        return false;
      }
      if (!red.trim() || !clave.trim()) {
        setMensaje("Ingresa RED y CLAVE de la red WiFi.");
        return false;
      }

      const numeroTanque = numeroDesdeIdTanque(tanqueSeleccionado);
      if (numeroTanque < 1) {
        setMensaje("Número de tanque inválido.");
        return false;
      }

      setEstado("enviando_bluetooth");
      setMensaje(
        `Enviando RED, CLAVE y tanque Nº ${numeroTanque} por Bluetooth...`,
      );

      const resultado = await enviarConfiguracionTarjetaBluetooth(
        {
          red: red.trim(),
          clave: clave.trim(),
          numeroTanque,
        },
        { simular: opciones?.simularBluetooth === true },
      );

      if (!resultado.ok) {
        setEstado("error");
        setMensaje(resultado.error);
        return false;
      }

      setEstado("esperando_esp32");
      setMensaje(
        resultado.modo === "simulacion"
          ? `Simulación (${resultado.mensaje}). Esperando tarjeta ${numeroTanque} en línea...`
          : `Enviado. La tarjeta ${numeroTanque} debe conectar WiFi y escribir en T-${String(numeroTanque).padStart(2, "0")}.`,
      );

      const online = await esperarTarjetaEnLinea(usuario, numeroTanque);
      if (!online) {
        setEstado("error");
        setMensaje(`La tarjeta del tanque ${numeroTanque} no reportó conexión.`);
        return false;
      }

      setEstado("conectado");
      setMensaje(`Tarjeta del tanque Nº ${numeroTanque} en línea.`);
      return true;
    },
    [usuario, tanqueSeleccionado, red, clave],
  );

  const numeroSeleccionado = numeroDesdeIdTanque(tanqueSeleccionado);

  return {
    tanquesDisponibles,
    tanqueSeleccionado,
    setTanqueSeleccionado,
    numeroSeleccionado,
    red,
    setRed,
    clave,
    setClave,
    estado,
    mensaje,
    cargarTanques,
    enviarConfiguracion,
  };
}
