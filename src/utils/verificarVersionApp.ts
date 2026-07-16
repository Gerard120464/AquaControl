import { APP_VERSION } from "../constants/appVersion";

const CLAVE_ASSET = "aquacontrol.assetJs";
const CLAVE_VERSION = "aquacontrol.appVersion";

function baseUrlApp(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
}

export async function verificarVersionDesplegada(): Promise<void> {
  try {
    const res = await fetch(`${baseUrlApp()}index.html`, { cache: "no-store" });
    if (!res.ok) return;

    const html = await res.text();
    const match = html.match(/\/assets\/(index-[\w-]+\.js)/);
    if (!match) return;

    const assetRemoto = match[1];
    const assetLocal = localStorage.getItem(CLAVE_ASSET);
    const versionLocal = localStorage.getItem(CLAVE_VERSION);

    localStorage.setItem(CLAVE_ASSET, assetRemoto);
    localStorage.setItem(CLAVE_VERSION, APP_VERSION);

    if (
      (assetLocal && assetLocal !== assetRemoto) ||
      (versionLocal && versionLocal !== APP_VERSION)
    ) {
      window.location.reload();
    }
  } catch {
    // Sin red: seguir con la versión en caché.
  }
}

/** iPhone / PWA: fuerza descarga del index.html y recarga. */
export function forzarActualizacionApp(): void {
  localStorage.removeItem(CLAVE_ASSET);
  localStorage.removeItem(CLAVE_VERSION);

  const base = baseUrlApp();
  const url = new URL(`${window.location.origin}${base}`, window.location.href);
  url.searchParams.set("v", String(Date.now()));
  window.location.replace(url.toString());
}
