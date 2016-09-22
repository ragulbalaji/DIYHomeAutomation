var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: '192.168.1.107',
  clientId: 'ESPLIGHT_MQTT_PUB'
};
var client = mqtt.connect(options);

var ESP_LIGHT = {
  powerOn: false,
  brightness: 100, // percentage
  hue: 0,
  saturation: 0,
  
  setPowerOn: function(on) { 
    console.log("Turning the ESPLIGHT %s!", on ? "on" : "off");
    client.publish('ESP_IN', (on ? "on" : "off"));
    if(on){
    	ESP_LIGHT.brightness = 100;
    }else{
    	ESP_LIGHT.brightness = 0;
    }
    ESP_LIGHT.powerOn = on;
  },
  setBrightness: function(brightness) {
    console.log("Setting ESPLIGHT brightness to %s", brightness);
	 client.publish('ESP_IN', "B"+String(brightness));
    ESP_LIGHT.brightness = brightness;
  },
  setHue: function(hue){
    console.log("Setting light Hue to %s", hue);
    client.publish('ESP_IN',"H"+String(hue));
    ESP_LIGHT.hue = hue;
  },
  setSaturation: function(saturation){
    console.log("Setting light Saturation to %s", saturation);
    client.publish('ESP_IN',"S"+String(saturation));
    ESP_LIGHT.saturation = saturation;
  },
  identify: function() {
    console.log("Identify the light!");
  }
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "light".
var lightUUID = uuid.generate('hap-nodejs:accessories:light');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake light.
var light = exports.accessory = new Accessory('Light', lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
light.username = "e5:08:26:61:14:32";
light.pincode = "123-45-678";

// set some basic properties (these values are arbitrary and setting them is optional)
light
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Ragul Balaji Inc.")
  .setCharacteristic(Characteristic.Model, "ESP8266 v1.0")
  .setCharacteristic(Characteristic.SerialNumber, "AutomaticaSolutions");

// listen for the "identify" event for this Accessory
light.on('identify', function(paired, callback) {
  ESP_LIGHT.identify();
  callback(); // success
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
light
  .addService(Service.Lightbulb, "ESPLight") // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    ESP_LIGHT.setPowerOn(value);
    callback(); // Our fake Light is synchronous - this value has been successfully set
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
light
  .getService(Service.Lightbulb)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    
    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.
    
    var err = null; // in case there were any problems
    
    if (ESP_LIGHT.powerOn) {
      console.log("ESPLIGHT on? Yes.");
      callback(err, true);
    }
    else {
      console.log("ESPLIGHT on? No.");
      callback(err, false);
    }
  });

// also add an "optional" Characteristic for Brightness
light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Brightness)
  .on('get', function(callback) {
    callback(null, ESP_LIGHT.brightness);
  })
  .on('set', function(value, callback) {
    ESP_LIGHT.setBrightness(value);
    callback();
  })
  
light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Hue)
  .on('get',function(callback){
   callback(null,ESP_LIGHT.hue);
   })
   .on('set',function(value,callback){
   ESP_LIGHT.setHue(value);
   callback();   
   })

light
  .getService(Service.Lightbulb)
  .addCharacteristic(Characteristic.Saturation)
  .on('get',function(callback){
   callback(null,ESP_LIGHT.saturation);
   })
   .on('set',function(value,callback){
   ESP_LIGHT.setSaturation(value);
   callback();   
   })