/**
 * Carga histórico de prueba (24 h, cada 10 min) en Firebase Realtime Database.
 *
 * Uso: node scripts/seedHistoricoPrueba.mjs
 * Opcional: node scripts/seedHistoricoPrueba.mjs GERARD T-01
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const USUARIO = process.argv[2] ?? "GERARD";
const TANQUE = process.argv[3] ?? "T-01";
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_URL =
  process.env.VITE_FIREBASE_DATABASE_URL?.replace(/\/$/, "") ??
  "https://acuario-fa7d7.firebaseio.com";
const INTERVALO_MS = 10 * 60 * 1000;
const PUNTOS = (24 * 60) / 10; // 144

function pad(n) {
  return String(n).padStart(2, "0");
}

function claveIntervalo10Min(fecha) {
  const minuto = Math.floor(fecha.getMinutes() / 10) * 10;
  return (
    String(fecha.getFullYear()) +
    pad(fecha.getMonth() + 1) +
    pad(fecha.getDate()) +
    pad(fecha.getHours()) +
    pad(minuto)
  );
}

function generarSerie(base, variacion, minimo, maximo, fase = 0) {
  const ahora = Date.now();
  const datos = {};

  for (let i = 0; i < PUNTOS; i++) {
    const t = ahora - (PUNTOS - 1 - i) * INTERVALO_MS;
    const fecha = new Date(t);
    const onda =
      Math.sin((i + fase) * 0.35) * variacion * 0.5 +
      Math.cos((i + fase) * 0.18) * variacion * 0.3;
    const valor = Math.min(
      maximo,
      Math.max(minimo, base + onda + (i - PUNTOS / 2) * 0.01),
    );
    datos[claveIntervalo10Min(fecha)] = Math.round(valor * 100) / 100;
  }

  return datos;
}

async function escribir(ruta, payload) {
  const url = `${DATABASE_URL}/${ruta}.json`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`${res.status} ${ruta}: ${texto}`);
  }
}

const temperatura = generarSerie(27.2, 1.8, 24.5, 29.5, 2);
const oxigeno = generarSerie(8.4, 1.2, 6.5, 10.5, 5);
const claves = Object.keys(temperatura).sort();
const ultimaTemp = temperatura[claves[claves.length - 1]];
const ultimaO2 = oxigeno[claves[claves.length - 1]];

const base = `${USUARIO}/TANQUES/${TANQUE}`;

console.log(`Escribiendo ${PUNTOS} puntos en ${base}/historico/ ...`);

const historico = { temperatura, oxigeno };

await escribir(`${base}/historico/temperatura`, temperatura);
await escribir(`${base}/historico/oxigeno`, oxigeno);
await escribir(base, {
  conectado: "0",
  temperatura: ultimaTemp,
  oxigeno: ultimaO2,
});

const archivoLocal = join(
  __dirname,
  "..",
  "data",
  `historicoPrueba-${USUARIO}-${TANQUE}.json`,
);
writeFileSync(archivoLocal, JSON.stringify(historico, null, 2), "utf8");

console.log("Listo.");
console.log(`  temperatura: ${ultimaTemp} °C (${claves.length} puntos)`);
console.log(`  oxigeno: ${ultimaO2} mg/L`);
console.log(`  desde ${claves[0]} hasta ${claves[claves.length - 1]}`);
console.log(`  archivo local: ${archivoLocal}`);
console.log("");
console.log("Ver en Firebase Console → Realtime Database (NO Firestore):");
console.log(
  `  ${DATABASE_URL.replace("https://", "").replace(".firebaseio.com", "")} / ${base}/historico`,
);
