const util = require('util');
const EventEmitter = require('events').EventEmitter;
const mqtt = require('mqtt');
const xml2js = require('xml2js');
const builder = require('xmlbuilder');

const TY = {
  'container' : 3
 ,'contentInstance' : 4
 ,'execInstance' : 7
 ,'mgmtCmd' : 12
 ,'node' : 14
 ,'remoteCSE' : 16
};

const OP = {
  'CREATE' : 1
 ,'READ' : 2
 ,'UPDATE' : 3
 ,'DELETE' : 4
 ,'NOTIFY' : 5
};

const statusCode = {
  'OK' : '2000',
  'CREATED' : '2001',
  'DELETED' : '2002',
  'UPDATED' : '2004',
  'CONTENT_EMPTY' : '2100',
  'EXIST' : '4105'
};

function getXMLRoot(){
 return builder.create(
  'm2m:req',
  {version: '1.0', encoding: 'UTF-8', standalone: true}
 ,{pubID: null, sysID: null}
 ,{headless: true,
   allowSurrogateChars: false
  });
}

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low);
}

var MQTTClient = function(config){
  var options = {
    clientId : config.userID + '_' + new Date().getTime()
   ,username : config.userID
   ,password : config.uKey
   ,clean : true
  }
  var nodeRI = config.nodeRI || '';
  var dKey = config.dKey || '';

  var self = this;
  var client = mqtt.connect('mqtts://mqtt.sktiot.com', options);
  client.on('connect', function () {
    var reqTopic = util.format("/oneM2M/req_msg/+/%s", options.clientId);
    var respTopic = util.format("/oneM2M/resp/%s/+", options.clientId);
    client.subscribe(reqTopic);
    client.subscribe(respTopic);
    self.emit('connect');
  });

  client.on('close', function(){
    self.emit('close');
  });

  client.on('error', function(error){
    self.emit('error', error);
  });

  client.on('message', function(topic, message){
    message = message.toString();
    if (topic.indexOf('/req/')>0) {
      xml2js.parseString(message, function(err, xmlObj){
        if(err) return self.emit('error', err);
        var recv_cmd = xmlObj['m2m:req']['pc'][0]['exin'][0];
        self.emit('command', topic, recv_cmd);
      });
    }
    else if (topic.indexOf('/resp/')>0) {
      self.emit('resp', topic, message);
    }
    else{
      self.emit('message', topic, message);
    }
  });

  this.end = function(){
    client.end();
  }

  this.send = function(payload){
    var topic = util.format('/oneM2M/req/%s/%s', options.clientId, config.appEUI);
    client.publish(topic, payload, {qos: 1}, function(err){
      if(err) return self.emit('error', err);
    });
  }

  this.createNode = function(cb){
    var ri = self._createRI();
    var reqBody = {
      'op' : OP.CREATE
     ,'ty' : TY.node
     ,'to' : '/' + config.appEUI +'/'+ config.version
     ,'fr' : config.nodeID
     ,'ri' : ri
     ,'cty': 'application/vnd.onem2m-prsp+xml'
     ,'nm' : config.nodeID
     ,'pc' : "<nod><ni>"+config.nodeID+"</ni><mga>MQTT|"+config.nodeID+"</mga></nod>"
    }
    var payload = getXMLRoot().ele(reqBody).end();
    self.send(payload);
    self.once('resp', function(topic,res){
      if(res.indexOf(ri) > 0){
        xml2js.parseString(res, function(err, xmlObj){
          if(err) return self.emit('error', err);
          var resultCode = xmlObj['m2m:rsp']['rsc'][0];
          if((resultCode === statusCode.CREATED) ||
             (resultCode === statusCode.EXIST)) {
            var rsm = xmlObj['m2m:rsp']['RSM'];
            if(rsm) console.log(rsm);
            self.nodeRI = xmlObj['m2m:rsp']['pc'][0]['nod'][0]['ri'][0];
            return cb(null, self.nodeRI);
          }
          else{
            return cb({errCode:resultCode, errMessage:xmlObj['m2m:rsp']['RSM']});
          }
        });
      }
    });
  }
  this.createRemoteCSE = function(cb){
    var ri = self._createRI();
    var reqBody = {
      'op' : OP.CREATE
     ,'ty' : TY.remoteCSE
     ,'to' : '/' + config.appEUI +'/'+ config.version
     ,'fr' : config.nodeID
     ,'ri' : ri
     ,'passCode' : config.passCode
     ,'cty': 'application/vnd.onem2m-prsp+xml'
     ,'nm' : config.nodeID
     ,'pc' : "<csr><cst>3</cst><csi>"+config.nodeID+"</csi><rr>true</rr><nl>"+self.nodeRI+"</nl></csr>"
    }
    var payload = getXMLRoot().ele(reqBody).end();
    self.send(payload);
    self.once('resp', function(topic,res){
      if(res.indexOf(ri) > 0){
        xml2js.parseString(res, function(err, xmlObj){
          if(err) return self.emit('error', err);
          var resultCode = xmlObj['m2m:rsp']['rsc'][0];
          if((resultCode === statusCode.CREATED) ||
             (resultCode === statusCode.EXIST)) {
            var rsm = xmlObj['m2m:rsp']['RSM'];
            if(rsm) console.log(rsm);
            self.dKey = xmlObj['m2m:rsp']['dKey'][0];
            return cb(null, self.dKey);
          }
          else{
            return cb({errCode:resultCode, errMessage:xmlObj['m2m:rsp']['RSM']});
          }
        });
      }
    });
    
  }

  this.createContainer = function(containerName, cb) {
    var ri = self._createRI();
    var reqBody = {
      'op' : OP.CREATE
     ,'ty' : TY.container
     ,'to' : util.format('/%s/%s/remoteCSE-%s',config.appEUI, config.version, config.nodeID)
     ,'fr' : config.nodeID
     ,'ri' : ri
     ,'cty': 'application/vnd.onem2m-prsp+xml'
     ,'nm' : containerName
     ,'dKey' : self.dKey
     ,'pc' : '<cnt><lbl>con</lbl></cnt>'
    }
    var payload = getXMLRoot().ele(reqBody).end();
    self.send(payload);
    self.once('resp', function(topic,res){
      if(res.indexOf(ri) > 0){
        xml2js.parseString(res, function(err, xmlObj){
          var resultCode = xmlObj['m2m:rsp']['rsc'][0];
          if(err) return self.emit('error', err);
          if((resultCode === statusCode.CREATED) ||
             (resultCode === statusCode.EXIST)) {
            var rsm = xmlObj['m2m:rsp']['RSM'];
            if(rsm) console.log(rsm);
            return cb(null, resultCode );
          }
          else{
            return cb({errCode:resultCode, errMessage:xmlObj['m2m:rsp']['RSM']});
          }
        });
      }
    });
  }

  this.createMgmtCmd = function(command, cb) {
    var ri = self._createRI();
    var reqBody = {
      'op' : OP.CREATE
     ,'ty' : TY.mgmtCmd
     ,'to' : util.format('/%s/%s',config.appEUI, config.version)
     ,'fr' : config.nodeID
     ,'ri' : ri
     ,'cty': 'application/vnd.onem2m-prsp+xml'
     ,'nm' : config.nodeID+'_'+command
     ,'dKey' : self.dKey
     ,'pc' : "<mgc><cmt>"+command+"</cmt><exe>false</exe><ext>"+self.nodeRI+"</ext></mgc>"
    };
    var payload = getXMLRoot().ele(reqBody).end();
    self.send(payload);
    self.once('resp', function(topic,res){
      if(res.indexOf(ri) > 0){
        xml2js.parseString(res, function(err, xmlObj){
          var resultCode = xmlObj['m2m:rsp']['rsc'][0];
          if(err) return self.emit('error', err);
          if((resultCode === statusCode.CREATED) ||
             (resultCode === statusCode.EXIST)) {
            var rsm = xmlObj['m2m:rsp']['RSM'];
            if(rsm) console.log(rsm);
            return cb(null, resultCode );
          }
          else{
            return cb({errCode:resultCode, errMessage:xmlObj['m2m:rsp']['RSM']});
          }
        });
      }
    });
  }

  this.createContentInstance = function(container, value, cb) {
    var ri = self._createRI();
    var reqBody = {
      'op' : OP.CREATE
     ,'ty' : TY.contentInstance
     ,'to' : util.format('/%s/%s/remoteCSE-%s/container-%s'
                        ,config.appEUI, config.version, config.nodeID, container)
     ,'fr' : config.nodeID
     ,'ri' : ri
     ,'cty': 'application/vnd.onem2m-prsp+xml'
     ,'dKey' : self.dKey
     ,'pc' : "<cin><cnf>text</cnf><con>"+value+"</con></cin>"
    };
    var payload = getXMLRoot().ele(reqBody).end();
    self.send(payload);
    self.once('resp', function(topic,res){
      if(res.indexOf(ri) > 0){
        xml2js.parseString(res, function(err, xmlObj){
          var resultCode = xmlObj['m2m:rsp']['rsc'][0];
          if(err) return self.emit('error', err);
          if(resultCode === statusCode.CREATED) {
            var rsm = xmlObj['m2m:rsp']['RSM'];
            if(rsm) console.log(rsm);
            var st =  xmlObj['m2m:rsp']['pc'][0]['cin'][0]['st'];
            return cb(null, {'st': st, 'ri' :  xmlObj['m2m:rsp']['ri']});
          }
          else{
            return cb({errCode:resultCode, errMessage:xmlObj['m2m:rsp']['RSM']});
          }
        });
      }
    });
  }
  this.updateExecInstance = function(command, resourceID, cb) {
    var ri = self._createRI();
    var reqBody = {
      'op' : OP.UPDATE
     ,'ty' : TY.execInstance
     ,'to' : util.format('/%s/%s/mgmtCmd-%s_%s/execInstance-%s'
                        ,config.appEUI ,config.version ,config.nodeID, command, resourceID)
     ,'fr' : config.nodeID
     ,'ri' : ri
     ,'cty': 'application/vnd.onem2m-prsp+xml'
     ,'dKey' : self.dKey
     ,'pc' : "<exin><exs>3</exs><exr>0</exr></exin>"
    };
    var payload = getXMLRoot().ele(reqBody).end();
    self.send(payload);
    self.once('resp', function(topic,res){
      if(res.indexOf(ri) > 0){
        xml2js.parseString(res, function(err, xmlObj){
          var resultCode = xmlObj['m2m:rsp']['rsc'][0];
          if(err) return self.emit('error', err);
          if((resultCode === statusCode.UPDATED) ||
             (resultCode === statusCode.EXIST)) {
            var rsm = xmlObj['m2m:rsp']['RSM'];
            if(rsm) console.log(rsm);
            return cb(null, resultCode );
          }
          else{
            return cb({errCode:resultCode, errMessage:xmlObj['m2m:rsp']['RSM']});
          }
        });
      }
    });
  }

  this._createRI = function(){
    return config.nodeID + '_' + new Date().getTime();
  }
}
util.inherits(MQTTClient, EventEmitter);

module.exports = MQTTClient;
