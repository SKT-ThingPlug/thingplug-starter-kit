const http = require('http');
const _ = require('underscore');
const keepAliveAgent = new http.Agent({ keepAlive: true });

const resultCodeTable = {
  200 : 'OK',
  201 : 'CREATED',
  409 : 'Already Registered'
};

var HTTP = function(config){
  this.config = config;
  this.baseReq = {
    options:{
      host: 'onem2m.sktiot.com',
      port: '9000',
      path : '/ThingPlug',
      method: 'POST',
      keepAlive : true,
      headers : {
        'X-M2M-Origin': config.nodeID,
        'Accept': 'application/json',
      }
    },
    body: null
  };
  this.req = {};
};

HTTP.prototype.createRequest = function(method, path, headers, body) {
  function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
  }
  this.req = JSON.parse(JSON.stringify(this.baseReq));
  _.extend(this.req.options.headers, headers);
  this.req.options.headers['X-M2M-RI'] = randomInt(100000, 999999);
  this.req.body = body;
  this.req.options.method = method;
  this.req.options.path = path;
  this.req.options.agent = keepAliveAgent;
  return this;
}

HTTP.prototype.request = function(cb){
  var req = http.request(this.req.options, function(res){
    res.setEncoding('utf8');
    if(!resultCodeTable[res.statusCode]){
      var err = { 
        statusCode : res.statusCode, 
      };
      return cb(err,null);
    }
    res.on('data', function(chunk){
      var result = {
        statusCode : res.statusCode,
        headers : res.headers,
        data: chunk,
        requestArgs : this.req
      };
      return cb(null, result);
    });
  });
  req.on('error', function(e){
    return cb({error:e.message, options: args.options});
  });
  var body = this.req.body;
  if(body){
    if(typeof body !== 'string'){
      req.write(JSON.stringify(body));
    }
    else{
      req.write(body);
    }
  }
  req.end();
}

module.exports = HTTP;
