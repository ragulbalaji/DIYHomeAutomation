/*
 * RAGUL BALAJI 2016 All Rights Reserved.
 * ESP8266 HOMEKIT FIRMWARE.
 */

#include <PubSubClient.h>
#include <ESP8266WiFi.h>
#include <Adafruit_NeoPixel.h>

#define PIN 4
Adafruit_NeoPixel strip = Adafruit_NeoPixel(16, PIN, NEO_GRB + NEO_KHZ800);

const char* ssid = "*******";
const char* password = "********";
const char* mqtt_server = "192.168.1.107";

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[50];
int value = 0;

int hue = 0;
float brightness = 0.0;
float saturation = 0.0;

#define BUFFER_SIZE 100

void setup() {
  pinMode(BUILTIN_LED, OUTPUT);
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  strip.begin();
  strip.show();
}

void setup_wifi() {

  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  String mymsg = "";
  float myfloat = 0.0;
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    mymsg += (char)payload[i];
    Serial.print((char)payload[i]);
  }
  Serial.println();

  if(mymsg == "on"){
    brightness = (brightness == 0.0 ? 1.0 : brightness);
  }else if(mymsg == "off"){
    brightness = (brightness != 0.0 ? 0.0 : brightness);
  }
  if ((char)payload[0] == 'B') {
    for (int i = 1; i < length; i++) {
      myfloat += (payload[i]-'0')*pow(10,length-i-1);
    }
    brightness = myfloat/100;
    Serial.println(brightness);
  }else if ((char)payload[0] == 'H') {
    for (int i = 1; i < length; i++) {
      myfloat += (payload[i]-'0')*pow(10,length-i-1);
    }
    hue = myfloat;
  }else if ((char)payload[0] == 'S') {
    for (int i = 1; i < length; i++) {
      myfloat += (payload[i]-'0')*pow(10,length-i-1);
    }
    saturation = myfloat;
  }

  for(int i=0; i<strip.numPixels(); i++) {
      strip.setPixelColor(i, HSVColor(hue,saturation,brightness));
  }
    strip.show();

  if ((char)payload[0] == '1') {
    digitalWrite(BUILTIN_LED, LOW);   // Turn the LED on (Note that LOW is the voltage level
    // but actually the LED is on; this is because
    // it is acive low on the ESP-01)
  } else if ((char)payload[0] == '0') {
    digitalWrite(BUILTIN_LED, HIGH);  // Turn the LED off by making the voltage HIGH
  }

}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP8266Client")) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish("ESP_OUT", "hello world");
      // ... and resubscribe
      client.subscribe("ESP_IN");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 60000) {
    lastMsg = now;
    ++value;
    snprintf (msg, 75, "hello world #%ld", value);
    Serial.print("Publish message: ");
    Serial.println(msg);
    client.publish("ESP_OUT", msg);
  }

}

uint32_t HSVColor(float h, float s, float v) {

 h = constrain(h, 0, 360);
  s = constrain(s, 0, 1);
  v = constrain(v, 0, 1);

  int i, b, p, q, t;
  float f;

  h /= 60.0;  // sector 0 to 5
  i = floor( h );
  f = h - i;  // factorial part of h

  b = v * 255;
  p = v * ( 1 - s ) * 255;
  q = v * ( 1 - s * f ) * 255;
  t = v * ( 1 - s * ( 1 - f ) ) * 255;

  switch( i ) {
    case 0:
      return strip.Color(b, t, p);
    case 1:
      return strip.Color(q, b, p);
    case 2:
      return strip.Color(p, b, t);
    case 3:
      return strip.Color(p, q, b);
    case 4:
      return strip.Color(t, p, b);
    default:
      return strip.Color(b, p, q);
  }
}
