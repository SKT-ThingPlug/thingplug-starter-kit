const async = require('async');
const MQTTClient = require('./lib/mqtt_client');
const config = require('./config');
const colors = require('colors');
const api = require('./lib/api');

var device = new MQTTClient(config);
device.on('connect', function(){
  console.log('ThingPlug MQTT Connected');
  device.on('command', function(topic,message){
    console.log('recv cmd :' + topic +':'+ message);
  });
  initialSetup(function(err,result){
    if(err) {
      console.log(err);
      return device.end();
    }
    console.log(colors.green('5. content Instance 주기적 생성 시작'));
    setInterval( function(){
      var value = Math.floor(Math.random() * 5);
      api.createContentInstance(config.nodeID, config.containerName,
                                config.dKey, value, function(err, result){
        if(err) console.log(err)
        else console.log(result);
      });
    },1000);
  });
})

function initialSetup(cb) {
  async.waterfall([
    function createNode(cb){
      console.log(colors.blue('1. node 생성 요청'));
      api.createNode(config.nodeID, cb);
    },
    function createRemoteCSE(nodeRI, cb){
      console.log(colors.blue('2. remoceCSE 생성 요청'));
      config.nodeRI = nodeRI;
      api.createRemoteCSE(config.nodeID, config.nodeRI, config.passCode, cb);
    },
    function createContainer(dKey, cb){
      console.log(colors.blue('3. container 생성 요청'));
      config.dKey = dKey;
      api.createContainer(config.nodeID, config.containerName, dKey, cb);
    },
    function createMgmtCmd(res, cb){
      console.log(colors.blue('4. mgmtCmd 생성 요청'));
      api.createMgmtCmd(config.nodeID, config.command, config.dKey, config.nodeRI, cb);
    }
  ], function processResult (err, result) {
    return cb(err,result);
  });
}

//device.end();
