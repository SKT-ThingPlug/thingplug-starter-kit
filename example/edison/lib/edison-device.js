var five = require('johnny-five');
var Edison = require('edison-io');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// Sensor Info
// Sensor Name : UUID
// PIN : PIN_NUMBER
// Sensor Type : led, light, ...
// Access : DR, DW, AR, AW
var EdisonDevice = function(config) {
  var self = this;
  this.sensors = {};
  this.names = [];
  var board = new five.Board({
    io: new Edison()
  });
  board.on('ready', function() {
    configBoard(config);
    self.emit('ready',null);
  });
  var configBoard = function(components){
    components.forEach(function(item){
      self.sensors[item.name] = {}; 
      self.names.push(item.name);
      var pin = item.pin;
      switch(item.category){
        case 'button':
          var button = new five.Button(pin);
          button.on('press', function(){
            self.emit('event', {source: 'button', value: 'press'});
          });
          button.on('release', function(){
            self.emit('event', {source: 'button', value: 'release'});
          });
          self.sensors[item.name].instance = button;
          break;
        case 'led':
          var led = new five.Led(pin);
          self.sensors[item.name].instance = led;
          self.sensors[item.name].action = {
            on : function(){led.on();},
            off : function(){led.off();},
            blink : function(delay){led.blink(delay)}
          };
          break;
        case 'light':
          var light = new five.Sensor({pin:pin,freq:1000});
          light.on('data', function(){
            self.emit('data', {source : 'light', value: this.value});
          });
          self.sensors[item.name].instance = light;
          break;
      }
    });
  }
}
util.inherits(EdisonDevice, EventEmitter);

EdisonDevice.prototype.control = function (name, command, params) {
  if(!this.sensors[name].action) {
    return  console.log('No actions available for this sensor: '+name);
  }
  this.sensors[name].action[command](params);
}


module.exports = EdisonDevice;
