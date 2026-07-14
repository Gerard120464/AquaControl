# Histórico de prueba — GERARD / T-01

Datos ficticios: **últimas 24 h**, lectura **cada 10 minutos** (144 puntos por sensor).

## Dónde verlos en Firebase Console

AquaControl usa **Realtime Database**, no Firestore.

1. Abre [Firebase Console](https://console.firebase.google.com/) → proyecto **acuario-fa7d7**
2. Menú izquierdo: **Build** → **Realtime Database** (no "Firestore")
3. Navega a esta ruta:

```
GERARD
  └── TANQUES
        └── T-01
              ├── temperatura: 28.64        ← valor actual
              ├── oxigeno: 9.73
              └── historico
                    ├── temperatura
                    │     ├── 202607081200: 27.57
                    │     ├── 202607081210: 27.73
                    │     └── … (144 claves)
                    └── oxigeno
                          ├── 202607081200: 8.49
                          └── … (144 claves)
```

**Enlace directo (Realtime Database):**  
https://console.firebase.google.com/project/acuario-fa7d7/database/acuario-fa7d7-default-rtdb/data/~2FGERARD~2FTANQUES~2FT-01~2Fhistorico

## Formato de cada clave

`YYYYMMDDHHmm` — año, mes, día, hora y minuto (intervalos de 10 min: 00, 10, 20…).

Ejemplo: `202607091150` = 9 jul 2026, 11:50

## Archivo local

`historicoPrueba-GERARD-T01.json` — copia del nodo `historico` para revisar o reimportar.

## Volver a cargar en Firebase

```bash
node scripts/seedHistoricoPrueba.mjs GERARD T-01
```
