/**
 * AquaControl ESP32 — firmware base
 *
 * Configuración tarjeta: RED,CLAVE_WIFI,USUARIO,CLAVE_APP,numeroTanque
 *   Ejemplo: TITO,wifiPass,GERARD,31910951,1 → tanque T-01
 *   Identidad tarjeta: USUARIO + RED + tanque
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
#include <DNSServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
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
#define EEPROM_USUARIO_ADDR  98
#define EEPROM_USUARIO_LEN   16

#define EEPROM_RED_LEN       32
#define EEPROM_CLAVE_LEN     64

#define BT_TIMEOUT_MS     120000
#define WIFI_TIMEOUT_MS    15000
#define HEARTBEAT_MS         30000
#define HISTORICO_INTERVAL_MS 600000 // temp/O2: un punto cada 10 min

const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -18000;
const int daylightOffset_sec = 0;

// Pines sensores (ajustar según hardware)
#define PIN_TEMPERATURA 26

// ==================== OBJETOS ====================
BluetoothSerial SerialBT;
WebServer portalWeb(80);
DNSServer dnsPortal;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

String redWifi;
String claveWifi;
int numeroTanque = 0;
String tanqueId;
String usuarioFirebase = USUARIO_FIREBASE;
String claveAppPendiente = "";
bool requiereValidarClaveApp = false;
String rutaTanqueBase;

bool wifiOk = false;
bool firebaseOk = false;
bool sistemaListo = false;
bool btConfigIniciado = false;
bool portalActivo = false;
bool conexionPendiente = false;
unsigned long ultimoHeartbeat = 0;
unsigned long ultimoHistorico = 0;
unsigned long ultimoAvisoConfig = 0;
unsigned long ultimoReintentoArranque = 0;
unsigned long pausaFirebaseHasta = 0;
bool firebaseBeginHecho = false;
String ultimoDiagnostico = "Iniciando...";

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
  usuarioFirebase = USUARIO_FIREBASE;
  Serial.println("EEPROM borrada — portal WiFi o Monitor Serie.");
}

void detenerPortalConfiguracion();
void iniciarPortalConfiguracion();
void registrarRutasPortal();
void servicioPortalClientes();
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
<p><b>Clave de app</b> ≠ <b>clave WiFi</b>. La app verifica USUARIO en Firebase.</p>
<form method="POST" action="/guardar">
<label>USUARIO (app)</label>
<input name="usuario" required maxlength="15" autocomplete="off" placeholder="GERARD" style="text-transform:uppercase">
<label>Clave de app (no es WiFi)</label>
<input name="clave_app" type="password" required maxlength="31" placeholder="Clave en Firebase /GERARD/clave">
<label>RED WiFi 2.4 GHz</label>
<input name="red" required maxlength="31" autocomplete="off" placeholder="Ej. TITO">
<label>Clave WiFi</label>
<input name="clave_wifi" type="password" required maxlength="63" placeholder="Contraseña de la red">
<label>Tanque Nº</label>
<input name="tanque" type="number" min="1" max="99" value="1" required>
<button type="submit">Verificar y conectar</button>
</form>
</body></html>
)rawliteral";

void enviarCabecerasPortal() {
  portalWeb.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  portalWeb.sendHeader("Pragma", "no-cache");
  portalWeb.sendHeader("Expires", "0");
  portalWeb.sendHeader("Connection", "close");
}

void handlePortalRoot() {
  enviarCabecerasPortal();
  portalWeb.send_P(200, "text/html", PAGINA_CONFIG);
}

void handlePortalCaptive() {
  // iOS Safari falla con 302 (error interno WebKit). Servir el formulario directo.
  handlePortalRoot();
}

void handlePortalAndroid204() {
  portalWeb.send(204, "text/plain", "");
}

void registrarRutasPortal() {
  portalWeb.on("/", HTTP_GET, handlePortalRoot);
  portalWeb.on("/guardar", HTTP_POST, handlePortalGuardar);
  portalWeb.on("/hotspot-detect.html", HTTP_GET, handlePortalCaptive);
  portalWeb.on("/library/test/success.html", HTTP_GET, handlePortalCaptive);
  portalWeb.on("/success.txt", HTTP_GET, handlePortalCaptive);
  portalWeb.on("/generate_204", HTTP_GET, handlePortalAndroid204);
  portalWeb.on("/connecttest.txt", HTTP_GET, handlePortalCaptive);
  portalWeb.on("/ncsi.txt", HTTP_GET, handlePortalCaptive);
  portalWeb.on("/fwlink", HTTP_GET, handlePortalCaptive);
  portalWeb.onNotFound([]() {
    handlePortalRoot();
  });
}

void handlePortalGuardar() {
  if (portalWeb.method() != HTTP_POST) {
    portalWeb.send(405, "text/plain", "POST");
    return;
  }

  String red = portalWeb.arg("red");
  String claveWifiForm = portalWeb.arg("clave_wifi");
  String usuarioForm = portalWeb.arg("usuario");
  String claveAppForm = portalWeb.arg("clave_app");
  String numStr = portalWeb.arg("tanque");
  usuarioForm.toUpperCase();
  String linea = red + "," + claveWifiForm + "," + usuarioForm + "," + claveAppForm + "," + numStr;

  if (!procesarLineaConfiguracion(linea)) {
    portalWeb.send(400, "text/html",
      "<html><body style='background:#0b1220;color:#fff;padding:24px'>"
      "<h1>Datos invalidos</h1><p><a href='/'>Volver</a></p></body></html>");
    return;
  }

  enviarCabecerasPortal();
  portalWeb.send(200, "text/html",
    "<html><body style='background:#0b1220;color:#e8eef8;font-family:system-ui;padding:24px'>"
    "<h1>Guardado</h1><p>Verificando <b>" + usuarioFirebase + "</b> · RED <b>" + redWifi + "</b> · tanque " + String(numeroTanque) + ".</p>"
    "<p>Espera unos segundos y vuelve al WiFi normal del iPhone.</p>"
    "<p>Si falla, reconecta a <b>" AP_SSID "</b> e intenta de nuevo.</p></body></html>");

  conexionPendiente = true;
}

void iniciarPortalConfiguracion() {
  if (portalActivo) return;

  WiFi.disconnect(true);
  delay(200);
  WiFi.mode(WIFI_AP);
  WiFi.setSleep(false);
  WiFi.softAPConfig(
    IPAddress(192, 168, 4, 1),
    IPAddress(192, 168, 4, 1),
    IPAddress(255, 255, 255, 0));
  bool apOk = WiFi.softAP(AP_SSID, AP_PASS, 6, 0, 4);
  delay(500);

  registrarRutasPortal();
  portalWeb.begin();

  dnsPortal.start(53, "*", WiFi.softAPIP());

  portalActivo = true;
  Serial.println("=== Portal iPhone (Safari) ===");
  Serial.print("AP activo: ");
  Serial.println(apOk ? "SI" : "NO");
  Serial.print("IP portal: ");
  Serial.println(WiFi.softAPIP());
  Serial.println("1. WiFi del iPhone -> " AP_SSID " / " AP_PASS);
  Serial.println("2. Safari -> " PORTAL_URL " (sin https)");
}

void detenerPortalConfiguracion() {
  if (!portalActivo) return;
  dnsPortal.stop();
  portalWeb.stop();
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_STA);
  portalActivo = false;
}

void servicioPortalClientes() {
  if (!portalActivo) return;
  for (int i = 0; i < 6; i++) {
    dnsPortal.processNextRequest();
    portalWeb.handleClient();
  }
}

void cargarDesdeEEPROM() {
  redWifi = leerEEPROM(EEPROM_RED_ADDR, EEPROM_RED_LEN);
  claveWifi = leerEEPROM(EEPROM_CLAVE_ADDR, EEPROM_CLAVE_LEN);
  numeroTanque = EEPROM.read(EEPROM_NUM_TANQUE);
  if (numeroTanque < 1 || numeroTanque > 99) numeroTanque = 0;
  String usuarioEeprom = leerEEPROM(EEPROM_USUARIO_ADDR, EEPROM_USUARIO_LEN);
  usuarioEeprom.trim();
  usuarioEeprom.toUpperCase();
  if (usuarioEeprom.length() > 0) {
    usuarioFirebase = usuarioEeprom;
  }
}

void guardarEnEEPROM() {
  guardarEEPROMString(EEPROM_RED_ADDR, redWifi, EEPROM_RED_LEN);
  guardarEEPROMString(EEPROM_CLAVE_ADDR, claveWifi, EEPROM_CLAVE_LEN);
  guardarEEPROMString(EEPROM_USUARIO_ADDR, usuarioFirebase, EEPROM_USUARIO_LEN);
  EEPROM.write(EEPROM_NUM_TANQUE, (uint8_t)numeroTanque);
  marcarEepromValida();
  Serial.println("EEPROM guardada (WiFi + usuario).");
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

String escaparJson(const String &texto) {
  String salida;
  for (unsigned int i = 0; i < texto.length(); i++) {
    char c = texto[i];
    if (c == '"') salida += "'";
    else if (c == '\\') salida += "/";
    else if (c >= 32) salida += c;
  }
  return salida;
}

String baseUrlFirebase() {
  String base = String(DATABASE_URL);
  if (!base.endsWith("/")) base += "/";
  return base;
}

int httpFirebaseGet(const String &ruta, String &cuerpo) {
  HTTPClient http;
  WiFiClientSecure client;
  client.setInsecure();

  String url = baseUrlFirebase() + ruta;
  http.setTimeout(12000);
  http.begin(client, url);
  int code = http.GET();
  cuerpo = http.getString();
  http.end();
  delay(30);
  return code;
}

int httpFirebasePut(const String &ruta, const String &cuerpoJson) {
  HTTPClient http;
  WiFiClientSecure client;
  client.setInsecure();

  String url = baseUrlFirebase() + ruta;
  http.setTimeout(12000);
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  int code = http.PUT(cuerpoJson);
  http.end();
  delay(30);
  return code;
}

/** Escribe diagnostico en Firebase sin Auth (reglas abiertas). La app lo lee en campo. */
bool publicarDiagnostico(const String &estado, const String &mensaje) {
  ultimoDiagnostico = mensaje;
  if (WiFi.status() != WL_CONNECTED) return false;

  String msg = escaparJson(mensaje);
  if (msg.length() > 180) msg = msg.substring(0, 180);
  String estadoEsc = escaparJson(estado);

  bool ok = false;

  {
    String body =
      "{\"estado\":\"" + estadoEsc +
      "\",\"mensaje\":\"" + msg +
      "\",\"tanque\":\"" + tanqueId +
      "\",\"actualizado\":" + String(millis()) + "}";

    int code = httpFirebasePut(usuarioFirebase + "/diagnostico.json", body);
    ok = code >= 200 && code < 300;
  }

  if (numeroTanque > 0) {
    String body =
      "{\"estado\":\"" + estadoEsc +
      "\",\"mensaje\":\"" + msg +
      "\",\"actualizado\":" + String(millis()) + "}";

    httpFirebasePut(usuarioFirebase + "/TANQUES/" + tanqueId + "/diagnostico.json", body);
  }

  Serial.println("[Diag app] " + estado + " -> " + mensaje);
  return ok;
}

String extraerValorClaveJson(const String &json) {
  int p = json.indexOf("\"clave\"");
  if (p < 0) p = json.indexOf("\"Clave\"");
  if (p < 0) return "";

  int sep = json.indexOf(':', p);
  if (sep < 0) return "";

  int i = sep + 1;
  while (i < (int)json.length() && (json[i] == ' ' || json[i] == '\t')) i++;

  if (i >= (int)json.length()) return "";

  if (json[i] == '"') {
    int fin = json.indexOf('"', i + 1);
    if (fin < 0) return "";
    return json.substring(i + 1, fin);
  }

  int fin = i;
  while (fin < (int)json.length() && json[fin] != ',' && json[fin] != '}') fin++;
  return json.substring(i, fin);
}

// ==================== CONFIGURACION TARJETA ====================
bool parsearConfiguracionTarjeta(const String &data) {
  int idx[5];
  int found = 0;
  int start = 0;

  for (int i = 0; i < (int)data.length() && found < 4; i++) {
    if (data[i] == ',') {
      idx[found++] = i;
    }
  }
  if (found != 4) return false;

  idx[4] = data.length();
  redWifi = data.substring(0, idx[0]);
  claveWifi = data.substring(idx[0] + 1, idx[1]);
  String usuario = data.substring(idx[1] + 1, idx[2]);
  String claveApp = data.substring(idx[2] + 1, idx[3]);
  String numStr = data.substring(idx[3] + 1, idx[4]);

  redWifi.trim();
  claveWifi.trim();
  usuario.trim();
  usuario.toUpperCase();
  claveApp.trim();
  numStr.trim();

  numeroTanque = numStr.toInt();
  if (redWifi.length() == 0 || claveWifi.length() == 0) return false;
  if (usuario.length() == 0 || claveApp.length() == 0) return false;
  if (numeroTanque < 1 || numeroTanque > 99) return false;

  usuarioFirebase = usuario;
  claveAppPendiente = claveApp;
  requiereValidarClaveApp = true;
  actualizarRutas();
  return true;
}

bool validarClaveAppHttp(const String &usuario, const String &claveApp) {
  if (WiFi.status() != WL_CONNECTED) return false;

  const char *rutas[] = {".json", "/Clave.json", "/clave.json"};
  String claveFb = "";

  for (int i = 0; i < 3; i++) {
    String body;
    String ruta = usuario + rutas[i];
    int code = httpFirebaseGet(ruta, body);

    Serial.printf("GET /%s -> HTTP %d\n", ruta.c_str(), code);

    if (code == 401 || code == 403) {
      Serial.println("Firebase bloquea lectura del usuario");
      return false;
    }

    if (code != 200) continue;
    if (body == "null" || body.length() == 0) continue;

    if (i == 0) {
      claveFb = extraerValorClaveJson(body);
    } else {
      claveFb = body;
      claveFb.trim();
      if (claveFb.startsWith("\"")) {
        claveFb.remove(0, 1);
        if (claveFb.endsWith("\"")) claveFb.remove(claveFb.length() - 1, 1);
      }
    }

    claveFb.trim();
    if (claveFb.length() == 0) continue;

    Serial.print("Clave en Firebase: [");
    Serial.print(claveFb);
    Serial.println("]");

    if (claveFb == claveApp) {
      Serial.print("USUARIO CONECTADO: ");
      Serial.println(usuario);
      return true;
    }

    Serial.println("Clave app NO coincide");
    return false;
  }

  Serial.println("USUARIO no encontrado en Firebase");
  return false;
}

bool procesarLineaConfiguracion(const String &data) {
  String linea = data;
  linea.trim();
  if (linea.length() == 0) return false;

  Serial.println("Config recibida (oculta claves)");

  if (!parsearConfiguracionTarjeta(linea)) {
    Serial.println("Formato: RED,CLAVE_WIFI,USUARIO,CLAVE_APP,numeroTanque");
    Serial.println("Ejemplo: TITO,wifiPass,GERARD,31910951,1");
    return false;
  }

  Serial.printf("Parsed -> USUARIO=%s RED=%s TANQUE=%d (%s)\n",
                usuarioFirebase.c_str(), redWifi.c_str(), numeroTanque, tanqueId.c_str());
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
    if (procesarLineaConfiguracion(data)) {
      conexionPendiente = true;
      return true;
    }
  }

  if (SerialBT.available()) {
    String data = leerLineaConfig(SerialBT);
    if (procesarLineaConfiguracion(data)) {
      SerialBT.println("OK");
      conexionPendiente = true;
      return true;
    }
  }

  return false;
}

void servicioModoConfiguracion() {
  iniciarPortalConfiguracion();
  // Sin Bluetooth en modo portal: libera RAM y evita fallos WebKit en iPhone.
  servicioPortalClientes();

  if (conexionPendiente) {
    conexionPendiente = false;
    if (!completarArranque()) {
      Serial.println("Conexion fallida — portal activo de nuevo.");
      if (!portalActivo) iniciarPortalConfiguracion();
      ultimoAvisoConfig = 0;
    }
    return;
  }

  if (millis() - ultimoAvisoConfig > 15000) {
    ultimoAvisoConfig = millis();
    Serial.printf(">>> Portal activo. Clientes WiFi: %d\n", WiFi.softAPgetStationNum());
    Serial.println(">>> iPhone: WiFi " AP_SSID " -> Safari " PORTAL_URL);
    Serial.println(">>> Si no abre: desactiva datos moviles y WiFi privado");
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
    publicarDiagnostico("error_wifi", "No conecta al WiFi. Usa portal AquaControl-Setup o revisa RED/clave.");
    Serial.println("WiFi fallo — abre portal " PORTAL_URL " desde iPhone.");
    iniciarPortalConfiguracion();
    return false;
  }

  publicarDiagnostico("wifi_ok", "WiFi OK. IP: " + WiFi.localIP().toString() + " — verificando " + usuarioFirebase + "...");

  if (requiereValidarClaveApp) {
    if (!validarClaveAppHttp(usuarioFirebase, claveAppPendiente)) {
      publicarDiagnostico(
        "error_usuario",
        "Clave incorrecta o USUARIO no creado: " + usuarioFirebase +
          ". Verifica /" + usuarioFirebase + "/clave en Firebase.");
      requiereValidarClaveApp = false;
      claveAppPendiente = "";
      iniciarPortalConfiguracion();
      return false;
    }
    requiereValidarClaveApp = false;
    claveAppPendiente = "";
    publicarDiagnostico(
      "usuario_ok",
      "USUARIO CONECTADO — " + usuarioFirebase + " verificado en Firebase.");
  }

  detenerPortalConfiguracion();

  guardarEnEEPROM();

  if (!iniciarFirebase()) {
    publicarDiagnostico("error_auth", "Firebase no conecto. Revisa usuario Auth en secrets.h (no es la clave de la app).");
    Serial.println("Firebase no disponible. Revisa secrets.h y reinicia.");
    return false;
  }

  if (!vincularTarjetaANodo()) {
    publicarDiagnostico("error_tanque", "Tanque " + tanqueId + " no existe. Crealo en la app (Configuracion).");
    Serial.println("Crea el tanque en la app (Configuracion) y reinicia.");
    return false;
  }

  publicarDiagnostico("online", "Tarjeta en linea. Escribiendo sensores y heartbeat.");

  publicarHistorico();
  publicarHeartbeat();
  ultimoHeartbeat = millis();
  ultimoHistorico = millis();

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

  detenerPortalConfiguracion();

  if (WiFi.status() == WL_CONNECTED && WiFi.SSID() == redWifi) {
    Serial.print("WiFi ya conectado. IP: ");
    Serial.println(WiFi.localIP());
    return true;
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

String claveIntervalo10Min() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    unsigned long bloque = (millis() / HISTORICO_INTERVAL_MS) % 1000000UL;
    char buf[16];
    sprintf(buf, "000000%06lu", bloque);
    return String(buf);
  }

  int minuto = (timeinfo.tm_min / 10) * 10;
  char buf[13];
  strftime(buf, sizeof(buf), "%Y%m%d%H", &timeinfo);
  char clave[13];
  sprintf(clave, "%s%02d", buf, minuto);
  return String(clave);
}

void guardarHistoricoSensor(const String &sensor, float valor) {
  String clave = claveIntervalo10Min();
  String path = rutaTanqueBase + "/historico/" + sensor + "/" + clave;
  escribirFirebaseFloat(path, valor);
}

void tokenStatusCallback(TokenInfo info) {
  if (info.status == token_status_ready) {
    Serial.println("Firebase: token listo");
    pausaFirebaseHasta = 0;
  } else if (info.status == token_status_on_request) {
    Serial.println("Firebase: solicitando token...");
  } else if (info.status == token_status_error) {
    Serial.print("Firebase AUTH error: ");
    Serial.println(info.error.message.c_str());

    String msg = info.error.message.c_str();
    String textoApp = "Firebase Auth fallo: " + msg;
    if (msg.indexOf("TOO_MANY_ATTEMPTS") >= 0) {
      pausaFirebaseHasta = millis() + 900000UL;
      textoApp = "Demasiados intentos Firebase. Espera 15 min y revisa email/password en secrets.h.";
    } else {
      pausaFirebaseHasta = millis() + 120000UL;
      textoApp = "Auth incorrecto. Crea usuario en Firebase Authentication (email/password).";
    }
    publicarDiagnostico("error_auth", textoApp);
  }
}

bool iniciarFirebase() {
  if (millis() < pausaFirebaseHasta) {
    static unsigned long ultimoAvisoPausa = 0;
    if (millis() - ultimoAvisoPausa > 30000) {
      ultimoAvisoPausa = millis();
      Serial.println("Firebase en pausa (espera antes de reintentar login)...");
    }
    return false;
  }

  if (!firebaseBeginHecho) {
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;
    config.token_status_callback = tokenStatusCallback;
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;

    Serial.println("Conectando Firebase...");
    Serial.println(String("DB: ") + DATABASE_URL);
    Serial.println("Usuario app: " + usuarioFirebase);
    Serial.println("Ruta tanque: " + rutaTanqueBase);
    Serial.println("Auth email: " + String(USER_EMAIL));

    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
    fbdo.setBSSLBufferSize(4096, 1024);
    firebaseBeginHecho = true;
  }

  for (int i = 0; i < 20; i++) {
    if (Firebase.ready()) {
      firebaseOk = true;
      Serial.println("Firebase conectado OK");
      publicarDiagnostico("firebase_ok", "Firebase conectado. Vinculando tanque " + tanqueId + "...");
      return true;
    }
    delay(500);
  }

  Serial.println("Firebase NO conecto (timeout 10s)");
  if (fbdo.errorReason().length() > 0) {
    Serial.print("Detalle: ");
    Serial.println(fbdo.errorReason());
  }
  pausaFirebaseHasta = millis() + 120000UL;
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
  Serial.println("Buscando nodo: " + rutaTanqueBase);
  if (Firebase.RTDB.get(&fbdo, rutaTanqueBase.c_str())) {
    bool existe = fbdo.dataType() != "null" && fbdo.dataType().length() > 0;
    Serial.println(existe ? "Nodo encontrado" : "Nodo vacio/null");
    return existe;
  }
  Serial.print("Error leyendo nodo: ");
  Serial.println(fbdo.errorReason());
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

void publicarHistorico() {
  if (!Firebase.ready()) return;

  float temp = leerTemperatura();
  float o2 = leerOxigeno();
  float ph = leerPh();

  // Un solo punto cada 10 min (misma clave sobrescribe si coincide el intervalo)
  guardarHistoricoSensor("temperatura", temp);
  guardarHistoricoSensor("oxigeno", o2);

  // Valor actual del dashboard (misma lectura, no cada 5 s)
  escribirFirebaseFloat(rutaTanqueBase + "/temperatura", temp);
  escribirFirebaseFloat(rutaTanqueBase + "/oxigeno", o2);
  escribirFirebaseFloat(rutaTanqueBase + "/ph", ph);

  Serial.printf("Lectura 10 min → T=%.1f O2=%.1f pH=%.1f clave %s\n",
                temp, o2, ph, claveIntervalo10Min().c_str());
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

  if (strlen(USER_PASSWORD) == 0 || strcmp(USER_PASSWORD, "PON_AQUI_LA_CONTRASEÑA_DEL_RESET") == 0) {
    Serial.println(">>> ERROR: USER_PASSWORD vacio en secrets.h");
    Serial.println(">>> Pon la contraseña de Firebase Authentication (email/password).");
  }

  EEPROM.begin(EEPROM_SIZE);

#if BORRAR_EEPROM_AL_INICIAR
  limpiarEEPROM();
  Serial.println("EEPROM borrada (BORRAR_EEPROM_AL_INICIAR=1).");
#else
  cargarDesdeEEPROM();
#endif

  if (eepromValida() && tieneConfiguracionTanque()) {
    Serial.println("Configuracion en EEPROM encontrada.");
    Serial.printf("RED=%s USUARIO=%s TANQUE=%d\n", redWifi.c_str(), usuarioFirebase.c_str(), numeroTanque);
    actualizarRutas();
    completarArranque();
  } else {
    Serial.println("Sin configuracion — portal iPhone o Monitor Serie.");
    ultimoAvisoConfig = 0;
  }
}

void loop() {
  if (!sistemaListo) {
    if (portalActivo || !tieneConfiguracionTanque()) {
      servicioModoConfiguracion();
    } else if (millis() - ultimoReintentoArranque > 60000) {
      ultimoReintentoArranque = millis();
      if (!completarArranque()) {
        Serial.println(">>> Reintento completo en 60 s");
      }
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

  if (ahora - ultimoHistorico >= HISTORICO_INTERVAL_MS) {
    ultimoHistorico = ahora;
    publicarHistorico();
  }

  delay(200);
}
