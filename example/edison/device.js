var board = require('./config');
var Edison = require('./lib/edison-device');

var config = require('../../config');
var api = require('../../lib/api');
var MQTTClient = require('../../lib/mqtt_client');

var colors = require('colors');
var xml2js = require('xml2js');
var async = require('async');

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
    api.createContainer(config.nodeID, 'button', dKey, cb);
  },
  function createContainer(dKey, cb){
    console.log(colors.blue('3. container 생성 요청'));
    api.createContainer(config.nodeID, 'light', config.dKey, cb);
  },
  function createMgmtCmd(res, cb){
    console.log(colors.blue('4. mgmtCmd 생성 요청'));
    var mgmtCmd = config.mgmtCmdPrefix + config.nodeID;
    api.createMgmtCmd(mgmtCmd, config.dKey, config.cmdType, config.nodeRI, cb);
  }
], function processResult (err, result) {
    if(err){
      console.log('Registration Failure: ');
      return console.log(err);
    }
    console.log(colors.green('5. content Instance 주기적 생성 시작'));
    var edison = new Edison(board.sensor);
    edison.on('ready', function() {
      var mqttClient = new MQTTClient(config.nodeID);
      mqttClient.on('message', function(topic, message){
        var msgs = message.toString().split(',');
        var msg = msgs.join();
        xml2js.parseString( msg, function(err, xmlObj){
          if(err) return console.log(err);
          console.log(xmlObj);
          var req = xmlObj['m2m:req']['pc'][0]['exin'][0]['exra'][0];
          processCMD(req);
        });
      })
      edison.on('data', function(data){
        if(data.value){
          var containerName = data.source;
          var value = parseInt(data.value);
          api.createContentInstance(config.nodeID, containerName, config.dKey, value);
        }
      });
      edison.on('event', function(data){
        console.log(data);
        if(data.value){
          var containerName = data.source;
          var value = data.value;
          api.createContentInstance(config.nodeID, containerName, config.dKey, value);
        }
      });
    });
  function processCMD(req){
    try{
      var req = JSON.parse(req);
    }
    catch(e){
      console.log('Invalid JSON CMD');
    }
    edison.control(req.target, req.cmd);
  }
});

