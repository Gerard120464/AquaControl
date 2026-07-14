/**
 * AquaControl ESP32 — firmware base
 *
 * Bluetooth (desde app): RED,CLAVE,numeroTanque
 *   Ejemplo: MiRedWiFi,pass123,1  → tanque 1 → nodo T-01
 *
 * La APP crea /{USUARIO}/TANQUES/T-0N/ en Firebase.
 * Esta tarjeta NO crea tanques; verifica que el nodo exista y escribe sensores.
 *
 * Requiere: secrets.h (ver secrets.h.example)
 * Librerías: Firebase ESP Client, BluetoothSerial, EEPROM, WiFi
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <BluetoothSerial.h>
#include <EEPROM.h>
#include <Firebase_ESP_Client.h>

#include <time.h>

#include "secrets.h"

#ifndef BORRAR_EEPROM_AL_INICIAR
#define BORRAR_EEPROM_AL_INICIAR 0
#endif

// ==================== CONFIGURACIÓN ====================
#define BT_NOMBRE "ESP32_BT"
#define AP_SSID "AquaControl-Setup"
#define AP_PASS "aquacontrol"
#define PORTAL_URL "http://192.168.4.1"
#define EEPROM_SIZE 512

#define EEPROM_RED_ADDR       0
#define EEPROM_CLAVE_ADDR    32
#define EEPROM_NUM_TANQUE    96   // 1 byte
#define EEPROM_VALID_ADDR    97   // 0xA5 = configurado

#define EEPROM_RED_LEN       32
#define EEPROM_CLAVE_LEN     64

#define BT_TIMEOUT_MS     120000
#define WIFI_TIMEOUT_MS    15000
#define HEARTBEAT_MS       30000
#define SENSOR_INTERVAL_MS  5000

const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -18000;
const int daylightOffset_sec = 0;

// Pines sensores (ajustar según hardware)
#define PIN_TEMPERATURA 26

// ==================== OBJETOS ====================
BluetoothSerial SerialBT;
WebServer portalWeb(80);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

String redWifi;
String claveWifi;
int numeroTanque = 0;
String tanqueId;
String usuarioFirebase = USUARIO_FIREBASE;
String rutaTanqueBase;

bool wifiOk = false;
bool firebaseOk = false;
bool sistemaListo = false;
bool btConfigIniciado = false;
bool portalActivo = false;
unsigned long ultimoHeartbeat = 0;
unsigned long ultimoSensor = 0;
unsigned long ultimoAvisoConfig = 0;

// ==================== EEPROM ====================
String leerEEPROM(int addr, int maxLen) {
  String valor;
  for (int i = 0; i < maxLen; i++) {
    char c = EEPROM.read(addr + i);
    if (c == 0 || c == 255) break;
    valor += c;
  }
  return valor;
}

void guardarEEPROMString(int addr, const String &dato, int maxLen) {
  for (int i = 0; i < maxLen; i++) {
    char c = (i < (int)dato.length()) ? dato[i] : 0;
    EEPROM.write(addr + i, c);
  }
}

bool eepromValida() {
  return EEPROM.read(EEPROM_VALID_ADDR) == 0xA5;
}

void marcarEepromValida() {
  EEPROM.write(EEPROM_VALID_ADDR, 0xA5);
  EEPROM.commit();
}

void limpiarEEPROM() {
  for (int i = 0; i < EEPROM_SIZE; i++) {
    EEPROM.write(i, 0);
  }
  EEPROM.commit();
  redWifi = "";
  claveWifi = "";
  numeroTanque = 0;
  Serial.println("EEPROM borrada — portal WiFi o Bluetooth.");
}

void detenerPortalConfiguracion();
void iniciarPortalConfiguracion();
bool completarArranque();
bool procesarLineaConfiguracion(const String &data);

const char PAGINA_CONFIG[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AquaControl</title>
<style>
body{font-family:system-ui,sans-serif;background:#0b1220;color:#e8eef8;padding:20px;margin:0}
h1{font-size:1.25rem;color:#69b3ff;margin-top:0}
p{color:#9eb0cc;line-height:1.4}
label{display:block;margin:14px 0 6px;color:#b9c7de;font-size:.9rem}
input{width:100%;padding:12px;border-radius:8px;border:1px solid #2a3f5f;background:#111a2b;color:#fff;box-sizing:border-box;font-size:16px}
button{width:100%;margin-top:18px;padding:14px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-size:1rem;font-weight:600}
</style></head><body>
<h1>Configurar tarjeta AquaControl</h1>
<p>Red WiFi <b>2.4 GHz</b> del campo (no 5 GHz).</p>
<form method="POST" action="/guardar">
<label>Nombre de la red (RED)</label>
<input name="red" required maxlength="31" autocomplete="off" placeholder="Ej. TITO">
<label>Clave WiFi</label>
<input name="clave" type="password" required maxlength="63" placeholder="Contraseña">
<label>Tanque Nº</label>
<input name="tanque" type="number" min="1" max="99" value="1" required>
<button type="submit">Guardar y conectar</button>
</form>
</body></html>
)rawliteral";

void handlePortalRoot() {
  portalWeb.send_P(200, "text/html", PAGINA_CONFIG);
}

void handlePortalGuardar() {
  if (portalWeb.method() != HTTP_POST) {
    portalWeb.send(405, "text/plain", "POST");
    return;
  }

  String red = portalWeb.arg("red");
  String clave = portalWeb.arg("clave");
  String numStr = portalWeb.arg("tanque");
  String linea = red + "," + clave + "," + numStr;

  if (!procesarLineaConfiguracion(linea)) {
    portalWeb.send(400, "text/html",
      "<html><body style='background:#0b1220;color:#fff;padding:24px'>"
      "<h1>Datos invalidos</h1><p><a href='/'>Volver</a></p></body></html>");
    return;
  }

  detenerPortalConfiguracion();
  portalWeb.send(200, "text/html",
    "<html><body style='background:#0b1220;color:#e8eef8;font-family:system-ui;padding:24px'>"
    "<h1>Guardado</h1><p>Conectando a <b>" + redWifi + "</b> (tanque " + String(numeroTanque) + ").</p>"
    "<p>Ya puedes volver al WiFi normal del iPhone.</p></body></html>");
}

void iniciarPortalConfiguracion() {
  if (portalActivo) return;

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASS);

  portalWeb.on("/", HTTP_GET, handlePortalRoot);
  portalWeb.on("/guardar", HTTP_POST, handlePortalGuardar);
  portalWeb.onNotFound([]() {
    portalWeb.sendHeader("Location", "/");
    portalWeb.send(302, "text/plain", "");
  });
  portalWeb.begin();

  portalActivo = true;
  Serial.println("=== Portal iPhone (Safari) ===");
  Serial.println("1. WiFi del iPhone -> " AP_SSID " / " AP_PASS);
  Serial.println("2. Safari -> " PORTAL_URL);
}

void detenerPortalConfiguracion() {
  if (!portalActivo) return;
  portalWeb.stop();
  WiFi.softAPdisconnect(true);
  portalActivo = false;
}

void cargarDesdeEEPROM() {
  redWifi = leerEEPROM(EEPROM_RED_ADDR, EEPROM_RED_LEN);
  claveWifi = leerEEPROM(EEPROM_CLAVE_ADDR, EEPROM_CLAVE_LEN);
  numeroTanque = EEPROM.read(EEPROM_NUM_TANQUE);
  if (numeroTanque < 1 || numeroTanque > 99) numeroTanque = 0;
}

void guardarEnEEPROM() {
  guardarEEPROMString(EEPROM_RED_ADDR, redWifi, EEPROM_RED_LEN);
  guardarEEPROMString(EEPROM_CLAVE_ADDR, claveWifi, EEPROM_CLAVE_LEN);
  EEPROM.write(EEPROM_NUM_TANQUE, (uint8_t)numeroTanque);
  marcarEepromValida();
  Serial.println("EEPROM guardada (WiFi OK).");
}

String idTanqueDesdeNumero(int numero) {
  char buf[8];
  sprintf(buf, "T-%02d", numero);
  return String(buf);
}

void actualizarRutas() {
  tanqueId = idTanqueDesdeNumero(numeroTanque);
  rutaTanqueBase = "/" + usuarioFirebase + "/TANQUES/" + tanqueId;
}

// ==================== BLUETOOTH ====================
bool parsearBluetooth(const String &data) {
  int c1 = data.indexOf(',');
  if (c1 < 0) return false;
  int c2 = data.indexOf(',', c1 + 1);
  if (c2 < 0) return false;

  redWifi = data.substring(0, c1);
  claveWifi = data.substring(c1 + 1, c2);
  String numStr = data.substring(c2 + 1);

  redWifi.trim();
  claveWifi.trim();
  numStr.trim();

  numeroTanque = numStr.toInt();
  if (redWifi.length() == 0 || claveWifi.length() == 0) return false;
  if (numeroTanque < 1 || numeroTanque > 99) return false;

  actualizarRutas();
  return true;
}

bool procesarLineaConfiguracion(const String &data) {
  String linea = data;
  linea.trim();
  if (linea.length() == 0) return false;

  Serial.println("Config recibida: " + linea);

  if (!parsearBluetooth(linea)) {
    Serial.println("Formato invalido. Usa: RED,CLAVE,numeroTanque");
    Serial.println("Ejemplo: TITO,miClave123,1");
    return false;
  }

  Serial.printf("Parsed -> RED=%s TANQUE=%d (%s)\n",
                redWifi.c_str(), numeroTanque, tanqueId.c_str());
  return true;
}

String leerLineaConfig(Stream &stream) {
  String linea = stream.readStringUntil('\n');
  linea.replace("\r", "");
  linea.trim();
  return linea;
}

void asegurarBluetoothConfig() {
  if (btConfigIniciado) return;
  if (SerialBT.begin(BT_NOMBRE)) {
    btConfigIniciado = true;
    Serial.println("Bluetooth ESP32_BT activo.");
  } else {
    Serial.println("Bluetooth no disponible — usa Monitor Serie USB.");
  }
}

bool revisarEntradaConfiguracion() {
  if (Serial.available()) {
    String data = leerLineaConfig(Serial);
    if (procesarLineaConfiguracion(data)) return true;
  }

  if (SerialBT.available()) {
    String data = leerLineaConfig(SerialBT);
    if (procesarLineaConfiguracion(data)) {
      SerialBT.println("OK");
      return true;
    }
  }

  return false;
}

void servicioModoConfiguracion() {
  iniciarPortalConfiguracion();
  asegurarBluetoothConfig();
  portalWeb.handleClient();

  if (millis() - ultimoAvisoConfig > 15000) {
    ultimoAvisoConfig = millis();
    Serial.println(">>> iPhone: WiFi " AP_SSID " -> Safari " PORTAL_URL);
    Serial.println(">>> PC: Monitor Serie RED,CLAVE,numero");
  }

  revisarEntradaConfiguracion();
}

bool tieneConfiguracionTanque() {
  return redWifi.length() > 0 && claveWifi.length() > 0 && numeroTanque >= 1;
}

bool completarArranque() {
  if (!tieneConfiguracionTanque()) return false;

  actualizarRutas();

  wifiOk = conectarWiFi();
  if (!wifiOk) {
    Serial.println("WiFi fallo — abre portal " PORTAL_URL " desde iPhone.");
    iniciarPortalConfiguracion();
    return false;
  }

  detenerPortalConfiguracion();

  guardarEnEEPROM();

  if (!iniciarFirebase()) {
    Serial.println("Firebase no disponible. Revisa secrets.h y reinicia.");
    return false;
  }

  if (!vincularTarjetaANodo()) {
    Serial.println("Crea el tanque en la app (Configuracion) y reinicia.");
    return false;
  }

  publicarSensores();
  publicarHeartbeat();
  ultimoHeartbeat = millis();
  ultimoSensor = millis();

  if (btConfigIniciado) {
    SerialBT.end();
    btConfigIniciado = false;
  }

  detenerPortalConfiguracion();

  sistemaListo = true;
  Serial.println("Operacion normal iniciada.");
  return true;
}

// ==================== WiFi / Firebase ====================
bool conectarWiFi() {
  if (redWifi.length() == 0 || claveWifi.length() == 0) {
    Serial.println("RED o CLAVE vacíos");
    return false;
  }

  Serial.println("Conectando WiFi: " + redWifi);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(300);
  WiFi.begin(redWifi.c_str(), claveWifi.c_str());

  unsigned long inicio = millis();
  while (millis() - inicio < WIFI_TIMEOUT_MS) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("WiFi OK. IP: ");
      Serial.println(WiFi.localIP());
      configurarNTP();
      return true;
    }
    delay(200);
  }

  Serial.println("WiFi falló — no se guarda EEPROM");
  return false;
}

void configurarNTP() {
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 10000)) {
    Serial.println("Hora NTP sincronizada");
  } else {
    Serial.println("NTP no disponible — histórico usará hora aproximada");
  }
}

String claveHoraActual() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    unsigned long h = (millis() / 3600000UL) % 1000000UL;
    char buf[16];
    sprintf(buf, "000000%04lu", h);
    return String(buf);
  }
  char buf[12];
  strftime(buf, sizeof(buf), "%Y%m%d%H", &timeinfo);
  return String(buf);
}

void guardarHistoricoSensor(const String &sensor, float valor) {
  String clave = claveHoraActual();
  String path = rutaTanqueBase + "/historico/" + sensor + "/" + clave;
  escribirFirebaseFloat(path, valor);
}

bool iniciarFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  fbdo.setBSSLBufferSize(4096, 1024);

  for (int i = 0; i < 10; i++) {
    if (Firebase.ready()) {
      firebaseOk = true;
      Serial.println("Firebase conectado");
      return true;
    }
    delay(500);
  }

  Serial.println("Firebase no disponible");
  return false;
}

bool escribirFirebase(const String &path, const String &valor) {
  if (!Firebase.ready()) return false;
  return Firebase.RTDB.setString(&fbdo, path.c_str(), valor.c_str());
}

bool escribirFirebaseFloat(const String &path, float valor) {
  if (!Firebase.ready()) return false;
  return Firebase.RTDB.setFloat(&fbdo, path.c_str(), valor);
}

bool nodoTanqueExiste() {
  if (!Firebase.ready()) return false;
  if (Firebase.RTDB.get(&fbdo, rutaTanqueBase.c_str())) {
    return fbdo.dataType() != "null" && fbdo.dataType().length() > 0;
  }
  return false;
}

String macTarjeta() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char buf[18];
  sprintf(buf, "%02X:%02X:%02X:%02X:%02X:%02X",
          mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(buf);
}

String timestampHeartbeat() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return String(millis());
  }
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(buf);
}

void marcarDesconectadoFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!Firebase.ready() && !iniciarFirebase()) return;
  if (!Firebase.ready()) return;

  escribirFirebase(rutaTanqueBase + "/conectado", "0");
  Serial.println("Firebase → conectado=0 (sin señal)");
}

void publicarHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    wifiOk = false;
    return;
  }

  if (!Firebase.ready()) {
    if (!iniciarFirebase()) return;
  }

  String ts = timestampHeartbeat();
  escribirFirebase(rutaTanqueBase + "/conectado", "1");
  escribirFirebase(rutaTanqueBase + "/ultimoHeartbeat", ts);
  escribirFirebase("/" + usuarioFirebase + "/conectado", "1");
  escribirFirebase("/" + usuarioFirebase + "/ultimoHeartbeat", ts);
  Serial.println("Heartbeat → " + ts);
}

void heartbeat() {
  publicarHeartbeat();
}

bool vincularTarjetaANodo() {
  if (!nodoTanqueExiste()) {
    Serial.println("ERROR: el nodo no existe en Firebase.");
    Serial.println("La app debe crear " + rutaTanqueBase + " primero.");
    Serial.println("Ve a Configuración → número de tanques.");
    return false;
  }

  Serial.println("Nodo encontrado: " + rutaTanqueBase);

  String regBase = rutaTanqueBase + "/registro";
  escribirFirebase(regBase + "/red", redWifi);
  escribirFirebase(regBase + "/claveWifi", claveWifi);
  escribirFirebase(regBase + "/tanque", tanqueId);
  escribirFirebase(regBase + "/numero", String(numeroTanque));
  escribirFirebase(regBase + "/mac", macTarjeta());
  escribirFirebase(regBase + "/actualizado", String(millis()));

  escribirFirebase(rutaTanqueBase + "/conectado", "1");
  escribirFirebase(rutaTanqueBase + "/numero", String(numeroTanque));
  escribirFirebase(rutaTanqueBase + "/ultimoHeartbeat", timestampHeartbeat());
  escribirFirebase("/" + usuarioFirebase + "/conectado", "1");
  escribirFirebase("/" + usuarioFirebase + "/ultimoHeartbeat", timestampHeartbeat());

  Serial.println("Tarjeta vinculada al tanque " + tanqueId);
  return true;
}

// ==================== SENSORES (placeholder) ====================
float leerTemperatura() {
  // TODO: reemplazar con sensor real (DS18B20, DHT, etc.)
  return 20.0 + (numeroTanque * 0.5);
}

float leerOxigeno() {
  return 8.5;
}

float leerPh() {
  return 7.0;
}

void publicarSensores() {
  if (!Firebase.ready()) return;

  float temp = leerTemperatura();
  float o2 = leerOxigeno();
  float ph = leerPh();

  escribirFirebaseFloat(rutaTanqueBase + "/temperatura", temp);
  escribirFirebaseFloat(rutaTanqueBase + "/oxigeno", o2);
  escribirFirebaseFloat(rutaTanqueBase + "/ph", ph);

  guardarHistoricoSensor("temperatura", temp);
  guardarHistoricoSensor("oxigeno", o2);

  Serial.printf("Sensores → T=%.1f O2=%.1f pH=%.1f (histórico %s)\n",
                temp, o2, ph, claveHoraActual().c_str());
}

void monitorearWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiOk) {
      wifiOk = false;
      firebaseOk = false;
      marcarDesconectadoFirebase();
    }
    Serial.println("WiFi perdido — reconectando...");
    if (conectarWiFi()) {
      wifiOk = true;
      if (iniciarFirebase()) {
        publicarHeartbeat();
        ultimoHeartbeat = millis();
      }
    }
  }
}

// ==================== SETUP / LOOP ====================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== AquaControl ESP32 ===");

  EEPROM.begin(EEPROM_SIZE);

#if BORRAR_EEPROM_AL_INICIAR
  limpiarEEPROM();
  Serial.println("EEPROM borrada (BORRAR_EEPROM_AL_INICIAR=1).");
#else
  cargarDesdeEEPROM();
#endif

  if (eepromValida() && tieneConfiguracionTanque()) {
    Serial.println("Configuracion en EEPROM encontrada.");
    completarArranque();
  } else {
    Serial.println("Sin configuracion — portal iPhone o Monitor Serie.");
    ultimoAvisoConfig = 0;
  }
}

void loop() {
  if (!sistemaListo) {
    if (tieneConfiguracionTanque()) {
      completarArranque();
    } else {
      servicioModoConfiguracion();
    }
    delay(50);
    return;
  }

  monitorearWiFi();

  unsigned long ahora = millis();

  if (ahora - ultimoHeartbeat >= HEARTBEAT_MS) {
    ultimoHeartbeat = ahora;
    heartbeat();
  }

  if (ahora - ultimoSensor >= SENSOR_INTERVAL_MS) {
    ultimoSensor = ahora;
    publicarSensores();
  }

  delay(200);
}
