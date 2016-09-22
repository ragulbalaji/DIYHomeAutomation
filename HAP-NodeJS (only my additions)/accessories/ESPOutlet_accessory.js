var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var err = null;
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: '192.168.1.107',
  clientId: 'ESPOUTLET_MQTT_PUB'
};
var client = mqtt.connect(options);

var ESP_OUTLET = {
    setPowerOn: function(on) {
    console.log("Turning the ESPOUTLET %s!...", on ? "on" : "off");
    if (on) {
          ESP_OUTLET.powerOn = true;
          if(err) { return console.log(err); }
          client.publish('ESP_IN', '1');
          //console.log("...outlet is now on.");
    } else {
          ESP_OUTLET.powerOn = false;
          if(err) { return console.log(err); }
          client.publish('ESP_IN', '0');
          //console.log("...outlet is now off.");
    }
  },
    identify: function() {
    console.log("Identify the outlet.");
    }
}

var outletUUID = uuid.generate('hap-nodejs:accessories:Outlet');

var outlet = exports.accessory = new Accessory('Outlet', outletUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
outlet.username = "1A:2B:3C:4D:5D:FF";
outlet.pincode = "123-45-678";

// set some basic properties (these values are arbitrary and setting them is optional)
outlet
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Ragul Balaji Inc.")
  .setCharacteristic(Characteristic.Model, "ESP8266 V1.0")
  .setCharacteristic(Characteristic.SerialNumber, "AutomaticaSolutions");

// listen for the "identify" event for this Accessory
outlet.on('identify', function(paired, callback) {
  ESP_OUTLET.identify();
  callback(); // success
});

// Add the actual outlet Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
outlet
  .addService(Service.Outlet, "ESPOutlet") // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    ESP_OUTLET.setPowerOn(value);
    callback(); // Our fake Outlet is synchronous - this value has been successfully set
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
outlet
  .getService(Service.Outlet)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {

    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.

    var err = null; // in case there were any problems

    if (ESP_OUTLET.powerOn) {
      console.log("ESPOUTLET on? Yes.");
      callback(err, true);
    }
    else {
      console.log("ESPOUTLET on? No.");
      callback(err, false);
    }
  }); 
