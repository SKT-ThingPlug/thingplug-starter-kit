var util = require('util');
var EventEmitter = require('events').EventEmitter;
var mqtt = require('mqtt');

var MQTTClient = function(nodeID){
  if(!(this instanceof MQTTClient)){
    return new MQTTClient(nodeID);
  }
  var self = this;

  var client = mqtt.connect('mqtt://onem2m.sktiot.com');
	client.on('connect', function () {
		console.log('### mqtt connected ###');
		//client.subscribe("/oneM2M/req/+/+");
		client.subscribe("/oneM2M/req/+/"+ nodeID);
	});
  client.on('close', function(){
		console.log('### mqtt disconnected ###');
  });
  
	client.on('error', function(error){
    self.emit('error', error);
  });

	client.on('message', function(topic, message){
    self.emit('message', topic, message);
  });
  EventEmitter.call(this);
};
util.inherits(MQTTClient, EventEmitter);

module.exports = MQTTClient;
