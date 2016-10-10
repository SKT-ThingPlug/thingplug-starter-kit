const async = require('async');
const MQTTClient = require('../../lib/mqtt_client');
const config = require('../../config');
const colors = require('colors');
const util = require('util');

var board = require('./config');
var Edison = require('./lib/edison-device');

var device = new MQTTClient(config);
device.on('connect', function(){
  console.log('ThingPlug MQTT Connected');
  device.on('command', function(topic,cmd){
    console.log('recv cmd :' + topic +':'+ cmd.exra[0]);
    processCMD(cmd);
    device.updateExecInstance(cmd.cmt[0], cmd.ri[0], function(err,result){});
  });
  initialSetup(function(err,result){
    if(err) {
      console.log(err);
      return device.end();
    }
    console.log(colors.green('5. content Instance 주기적 생성 시작'));
    var edison = new Edison(board.sensor);
    edison.on('ready', function() {
      // 1. Load light sensor data from Edison board and upload it to ThingPlug
      edison.on('data', function(data){
        if(data.value){
          var containerName = data.source;
          var value = parseInt(data.value);
          console.log(value);
          device.createContentInstance(containerName, value, function(err, result){});
        }
      });
      // 2. Button events are recorded to ThingPlug
      edison.on('event', function(data){
        console.log(data);
        if(data.value){
          var containerName = data.source;
          var value = data.value;
          console.log(value);
          device.createContentInstance(containerName, value, function(err, result){});
        }
      });
    });
  });
})

function initialSetup(cb) {
  async.waterfall([
    function createNode(cb){
      console.log(colors.blue('1. Create Node'));
      device.createNode(cb);
    },
    function createRemoteCSE(nodeRI, cb){
      console.log(colors.blue('2. Create remoceCSE'));
      device.createRemoteCSE(cb);
    },
    function createContainer(dKey, cb){
      console.log(colors.blue('3-1. Create Container for button events'));
      device.createContainer('button', cb);
    },
    function createContainer(res, cb){
      console.log(colors.blue('3-2. Create Container for light sensor'));
      device.createContainer('light', cb);
    },
    function createMgmtCmd(res, cb){
      console.log(colors.blue('4. mgmtCmd 생성 요청'));
      device.createMgmtCmd(config.command, cb);
    }
  ], function processResult (err, result) {
    return cb(err,result);
  });
}

function processCMD(cmd) {
  try{
    var req = JSON.parse(cmd.exra[0]);
    edison.control(req.target, req.cmd);
  }
  catch(e){
    console.log('Invalid JSON CMD');
  }
}
