AquaControl ESP32 — instalación

1. Copiar secrets.h.example → secrets.h y completar:
   - USUARIO_FIREBASE (ej. GERARD — mismo que la app)
   - API_KEY, DATABASE_URL, USER_EMAIL, USER_PASSWORD
   - BORRAR_EEPROM_AL_INICIAR: pon 1 antes de subir para pedir config de nuevo

   Configuracion iPhone (Safari, sin PC):
   1. Crea el tanque en la app (Configuracion) ANTES de configurar la tarjeta
   2. WiFi iPhone -> AquaControl-Setup / aquacontrol
   3. iOS debe mostrar "Iniciar sesion en la red Wi-Fi" (portal cautivo)
      Si no aparece: Safari -> http://192.168.4.1 (sin https)
   4. RED, clave WiFi 2.4 GHz, numero de tanque
   5. Guardar y conectar -> vuelve al WiFi normal del iPhone

   IMPORTANTE iPhone:
   - Bluetooth ESP32_BT NO funciona desde Safari ni desde la app web
   - Usa siempre el portal WiFi AquaControl-Setup
   - "Sin internet" en AquaControl-Setup es normal

   Tambien: Monitor Serie USB RED,CLAVE,numero (solo con PC)

2. Arduino IDE → ESP32 board → instalar librería "Firebase ESP Client"

   Opcional (borra toda la flash al subir):
   Herramientas → Erase All Flash Before Sketch Upload → Enabled

3. Flujo:
   a) Admin crea GERARD/clave en Firebase
   b) App: login + crear tanques (T-01, T-02…)
   c) iPhone: portal WiFi AquaControl-Setup -> http://192.168.4.1
   d) Tarjeta recibe: MiRed,passWiFi,1
   e) Firmware verifica /GERARD/TANQUES/T-01 existe → escribe sensores

Histórico 24 h (escrito por ESP32 cada lectura):

GERARD/TANQUES/T-01/
  conectado: "1"
  ultimoHeartbeat: "2026-07-09T12:30:00"   ← cada ~30 s (heartbeat)
  temperatura: 13.2
  historico/
    temperatura/
      2026070910: 13.1
      2026070911: 13.4
    oxigeno/
      2026070910: 8.5

Clave = YYYYMMDDHH (año mes día hora). Una lectura por hora.

secrets.h no se sube al repo (añadir a .gitignore si usas git en firmware).
