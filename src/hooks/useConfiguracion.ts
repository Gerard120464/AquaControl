import { useCallback, useState } from "react";
import {
  agregarTanque,
  crearTanquesIniciales,
  eliminarTanque,
  listarIdsTanques,
} from "../services/tanquesAdminService";
import {
  cambiarClaveApp,
  contarTanques,
  validarAccesoApp,
} from "../services/usuarioService";
import { useSesion } from "./useSesion";

export function useConfiguracion() {
  const { sesion, guardarSesion, limpiarSesion } = useSesion();
  const [usuarioInput, setUsuarioInput] = useState(sesion?.usuario ?? "");
  const [claveInput, setClaveInput] = useState("");
  const [cantidadTanques, setCantidadTanques] = useState(4);
  const [tanques, setTanques] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const [claveActual, setClaveActual] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [claveNueva2, setClaveNueva2] = useState("");

  const refrescarTanques = useCallback(async (usuario: string) => {
    const ids = await listarIdsTanques(usuario);
    setTanques(ids);
    return ids;
  }, []);

  const iniciarSesion = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const ok = await validarAccesoApp(
        usuarioInput.trim().toUpperCase(),
        claveInput,
      );
      if (!ok) {
        setMensaje(
          "USUARIO o clave incorrectos. Verifica GERARD/clave en Firebase.",
        );
        return false;
      }

      const usuario = usuarioInput.trim().toUpperCase();
      guardarSesion({ usuario, clave: claveInput });
      await refrescarTanques(usuario);
      const total = await contarTanques(usuario);
      setMensaje(
        total > 0
          ? `Sesión iniciada. ${total} tanque(s) en Firebase.`
          : "Sesión iniciada. Define el número de tanques para crear la estructura.",
      );
      return true;
    } catch (error) {
      const texto =
        error instanceof Error ? error.message : "Error de conexión con Firebase";
      if (
        texto.includes("permission") ||
        texto.includes("PERMISSION") ||
        texto.includes("401")
      ) {
        setMensaje(
          "Firebase bloqueó el acceso (Rules). En Realtime Database → Rules, publica reglas de lectura/escritura y vuelve a intentar.",
        );
      } else {
        setMensaje(`Error: ${texto}`);
      }
      return false;
    } finally {
      setCargando(false);
    }
  }, [usuarioInput, claveInput, guardarSesion, refrescarTanques]);

  const crearInicial = useCallback(async () => {
    if (!sesion) {
      setMensaje("Inicia sesión primero.");
      return;
    }
    setCargando(true);
    setMensaje("");
    try {
      const ids = await crearTanquesIniciales(
        sesion.usuario,
        sesion.clave,
        cantidadTanques,
      );
      setTanques(ids);
      setMensaje(`Creados ${ids.length} tanques en Firebase: ${ids.join(", ")}`);
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "Error al crear tanques");
    } finally {
      setCargando(false);
    }
  }, [sesion, cantidadTanques]);

  const agregarUnTanque = useCallback(async () => {
    if (!sesion) {
      setMensaje("Inicia sesión primero.");
      return;
    }
    setCargando(true);
    setMensaje("");
    try {
      const id = await agregarTanque(sesion.usuario, sesion.clave);
      await refrescarTanques(sesion.usuario);
      setMensaje(`Tanque ${id} creado en Firebase.`);
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "Error al agregar tanque");
    } finally {
      setCargando(false);
    }
  }, [sesion, refrescarTanques]);

  const borrarTanque = useCallback(
    async (tanqueId: string) => {
      if (!sesion) {
        setMensaje("Inicia sesión primero.");
        return;
      }
      const confirmar = window.confirm(
        `¿Eliminar ${tanqueId}? Solo se permite si no tiene tarjeta ni datos.`,
      );
      if (!confirmar) return;

      setCargando(true);
      setMensaje("");
      try {
        await eliminarTanque(sesion.usuario, sesion.clave, tanqueId);
        await refrescarTanques(sesion.usuario);
        setMensaje(`${tanqueId} eliminado de Firebase.`);
      } catch (error) {
        setMensaje(
          error instanceof Error ? error.message : "Error al eliminar tanque",
        );
      } finally {
        setCargando(false);
      }
    },
    [sesion, refrescarTanques],
  );

  const actualizarClave = useCallback(async () => {
    if (!sesion) {
      setMensaje("Inicia sesión primero.");
      return;
    }
    if (claveNueva !== claveNueva2) {
      setMensaje("La clave nueva y su confirmación no coinciden.");
      return;
    }

    setCargando(true);
    setMensaje("");
    try {
      const resultado = await cambiarClaveApp(
        sesion.usuario,
        claveActual,
        claveNueva,
      );
      if (!resultado.ok) {
        setMensaje(resultado.error);
        return;
      }
      guardarSesion({ usuario: sesion.usuario, clave: claveNueva });
      setClaveActual("");
      setClaveNueva("");
      setClaveNueva2("");
      setMensaje("Clave de app actualizada en Firebase.");
    } finally {
      setCargando(false);
    }
  }, [sesion, claveActual, claveNueva, claveNueva2, guardarSesion]);

  const cerrarSesion = useCallback(() => {
    limpiarSesion();
    setTanques([]);
    setMensaje("Sesión cerrada.");
  }, [limpiarSesion]);

  return {
    sesion,
    usuarioInput,
    setUsuarioInput,
    claveInput,
    setClaveInput,
    cantidadTanques,
    setCantidadTanques,
    tanques,
    mensaje,
    cargando,
    claveActual,
    setClaveActual,
    claveNueva,
    setClaveNueva,
    claveNueva2,
    setClaveNueva2,
    iniciarSesion,
    crearInicial,
    agregarUnTanque,
    borrarTanque,
    actualizarClave,
    cerrarSesion,
    refrescarTanques,
  };
}
