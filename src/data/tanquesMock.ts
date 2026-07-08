import type { Tanque } from "../types/tanque";

/**
 * Datos de prueba. Cuando conectes Firebase, reemplaza esta lista
 * por los tanques que existan en la base de datos.
 */
export const tanquesMock: Tanque[] = [
  {
    id: "tanque-01",
    nombre: "T-01",
    estado: "normal",
    sensores: {
      temperatura: 13.2,
      oxigeno: 9.8,
      ph: 7.2,
      tds: 112,
      ec: 215,
      nh4: 0.01,
    },
    equipos: {
      recirculador: "encendido",
      nanoburbujas: "encendido",
      alimentador: "espera",
      iluminacion: "activa",
    },
    produccion: {
      biomasa: 520,
      peces: 3250,
      pesoPromedio: 160,
      conversion: 1.08,
    },
    alarmas: [
      { mensaje: "Sin alarmas activas", tipo: "ok" },
      { mensaje: "Temperatura dentro del rango", tipo: "info" },
      { mensaje: "Oxígeno estable", tipo: "info" },
    ],
  },
  {
    id: "tanque-02",
    nombre: "T-02",
    estado: "normal",
    sensores: {
      temperatura: 12.4,
      oxigeno: 8.9,
      ph: 7.05,
      tds: 124,
      ec: 228,
      nh4: 0.02,
    },
    equipos: {
      recirculador: "encendido",
      nanoburbujas: "apagado",
      alimentador: "espera",
      iluminacion: "activa",
    },
    produccion: {
      biomasa: 480,
      peces: 2980,
      pesoPromedio: 155,
      conversion: 1.12,
    },
    alarmas: [
      { mensaje: "Sin alarmas activas", tipo: "ok" },
      { mensaje: "Nanoburbujas apagadas", tipo: "info" },
      { mensaje: "Oxígeno dentro del rango", tipo: "info" },
    ],
  },
  {
    id: "tanque-03",
    nombre: "T-03",
    estado: "alarma",
    sensores: {
      temperatura: 15.8,
      oxigeno: 6.4,
      ph: 6.82,
      tds: 155,
      ec: 294,
      nh4: 0.08,
    },
    equipos: {
      recirculador: "encendido",
      nanoburbujas: "encendido",
      alimentador: "apagado",
      iluminacion: "activa",
    },
    produccion: {
      biomasa: 610,
      peces: 4100,
      pesoPromedio: 148,
      conversion: 1.25,
    },
    alarmas: [
      { mensaje: "Oxígeno bajo — revisar aireación", tipo: "alerta" },
      { mensaje: "Temperatura elevada", tipo: "alerta" },
      { mensaje: "NH₄ por encima del límite", tipo: "alerta" },
    ],
  },
  {
    id: "tanque-04",
    nombre: "T-04",
    estado: "normal",
    sensores: {
      temperatura: 11.9,
      oxigeno: 10.4,
      ph: 7.38,
      tds: 98,
      ec: 194,
      nh4: 0.01,
    },
    equipos: {
      recirculador: "encendido",
      nanoburbujas: "encendido",
      alimentador: "encendido",
      iluminacion: "apagado",
    },
    produccion: {
      biomasa: 390,
      peces: 2450,
      pesoPromedio: 172,
      conversion: 0.98,
    },
    alarmas: [
      { mensaje: "Sin alarmas activas", tipo: "ok" },
      { mensaje: "Iluminación apagada", tipo: "info" },
      { mensaje: "Parámetros óptimos", tipo: "info" },
    ],
  },
  {
    id: "tanque-05",
    nombre: "T-05",
    estado: "normal",
    sensores: {
      temperatura: 13.6,
      oxigeno: 9.1,
      ph: 7.15,
      tds: 108,
      ec: 208,
      nh4: 0.015,
    },
    equipos: {
      recirculador: "espera",
      nanoburbujas: "encendido",
      alimentador: "espera",
      iluminacion: "activa",
    },
    produccion: {
      biomasa: 275,
      peces: 1820,
      pesoPromedio: 151,
      conversion: 1.05,
    },
    alarmas: [
      { mensaje: "Sin alarmas activas", tipo: "ok" },
      { mensaje: "Recirculador en espera", tipo: "info" },
      { mensaje: "Oxígeno estable", tipo: "info" },
    ],
  },
];
