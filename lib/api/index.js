var colors = require('colors');
var config = require('../../config');

var HTTPClient = require('../generic-http');
var httpClient = new HTTPClient(config);

var API = {};

API.createNode = function(nodeID, cb) {
  var headers = {
    'X-M2M-NM': nodeID, 
    'Content-Type': 'application/json;ty=14'
  };
  var body = {ni : nodeID};
  httpClient.createRequest('POST', '/ThingPlug',headers, body)
            .request(function(err,result){
    console.log(colors.green('node 생성 결과'));
    if(err) return cb(err,null);
    try{
      var nodeRI = JSON.parse(result.data).ri;
      console.log(colors.yellow('생성 node Resource ID : ') + nodeRI);
      return cb(err,nodeRI);
    } catch(e){
      return cb(e, null);
    }
  });
}

API.createRemoteCSE = function(nodeID, nodeRI, passCode, cb) {
  var headers = {
    'X-M2M-NM': nodeID, 
    'Content-Type': 'application/json;ty=16', 
    'passCode': passCode
  };
  var body = {
    cst : 3, //등록하는 CSE의 타입 (IN-CSE = 1, MN-CSE = 2, ASN-CSE = 3) (cseType == cst)
    csi : nodeID, //등록하는 CSE의 식별자 (CSE-ID == csi)
    poa : ['MQTT|'+nodeID],//등록하는 CSE의 물리적 접근 식별자 또는 주소 (pointOfAccess == poa)
    rr : true, //등록하는 CSE가 접근하는 한 객체 여부 표기 (requestReachability == rr)
    nl : nodeRI
  };
  httpClient.createRequest('POST', '/ThingPlug',headers, body)
            .request(function(err,result){
    console.log(colors.green('remoteCSE 생성 결과'));
    if(err) return cb(err,null);
    if(!result.headers.dkey) return cb('dKey not found', null);
    if(result.statusCode === 409){
      console.log('이미 생성된 remoteCSE 입니다.');
    }
    console.log('다비이스 키 : '+ result.headers.dkey);
    console.log('content-location: '+ result.headers['content-location']);//생성된 자원의 URI
    return cb(null, result.headers.dkey);
  });
}

API.createContainer = function(nodeID, containerName, dKey, cb){
  var headers = {
    'X-M2M-NM': containerName, 
    'Content-Type': 'application/json;ty=3',
    'locale' : 'ko',
    'dkey': dKey
  };
  var body = {
    containerType : 'heartbeat',
    heartbeatPeriod : 300
  };
  httpClient.createRequest('POST', '/ThingPlug/remoteCSE-'+nodeID, headers, body)
            .request(function(err,result){
    console.log(colors.green('container 생성 결과'));
    if(err) return cb(err,null);
    if(result.statusCode === 409){
      console.log('이미 생성된 container 입니다.');
    }
    console.log('content-location: '+ result.headers['content-location']);		//생성된 자원의 URI
    return cb(null, result);
  });
}

API.createMgmtCmd = function(mgmtCmd, dKey, cmdType, nodeRI, cb){
  var headers = {
    'X-M2M-NM': mgmtCmd,	//해당 요청으로 생성하게 되는 자원의 이름 (NM == Name)
    'Content-Type': 'application/json;ty=12',
    'locale' : 'ko',
    'dkey': dKey
  };
  var body = {
    cmt : cmdType,   //장치 제어 형태 (예, Firmware Update, Memory Check) / (cmt == cmdType)
    exe : true,             //장치 제어를 위한 Trigger Attribute (true/false) / (exe == execEnable))
    ext : nodeRI     //제어되는 장치의 식별자로 제어하고자 하는 장치의 node 자원 식별자를 명시함 (ext == exeTarget)
  };
  httpClient.createRequest('POST', '/ThingPlug',headers, body)
            .request( function(err,result){
    console.log(colors.green('4. mgmtCmd 생성 결과'));
    if(err) return cb(err,null);
    if(result.statusCode === 409){
      console.log('이미 생성된 container 입니다.');
    }
    console.log('content-location: '+ result.headers['content-location']);		//생성된 자원의 URI
    cb(null, result.headers);
  });
}
API.createContentInstance = function(nodeID, containerName, dKey, value){
  var headers = {
    'Content-Type': 'application/json;ty=4', 
    'dKey': dKey
  };
  var body = {
    cnf : 'text', //업로드 하는 데이터 타입의 정보 (cnf = contentInfo)
    con : value   //업로드 하는 데이터 (con == content)
  };
  var path = '/ThingPlug/remoteCSE-'+ nodeID+ '/container-'+ containerName;
  httpClient.createRequest('POST', path, headers, body)
            .request(function(err,result){
    if(err) return console.log(err);
    try{
      var data = JSON.parse(result.data);
      console.log('content : ' + data.con + ', resourceID : '+data.ri);
    }
    catch(e){
      console.err('JSON parse error: '+ result.data);
    }
  });
}

API.updateExecInstance = function(nodeID, mgmtCmdPrefix,dKey, ei){
  var headers = {
    'Content-Type': 'application/json', 
    'dKey': dKey,
	'locale': 'ko'
  };
  var body = {};
  var path = '/ThingPlug/mgmtCmd-' + mgmtCmdPrefix + nodeID + '/execInstance-'+ei;
  httpClient.createRequest('PUT', path, headers, body)
            .request(function(err,result){
    if(err) return console.log(err);
    try{
      var data = JSON.parse(result.data);
      console.log('처리한 resouceId : ' + data.ri);
      console.log('처리한 결과 execStatus : ' + data.exs);
      console.log(colors.red('#####################################'));
    }
    catch(e){
      console.err('JSON parse error: '+ result.data);
    }
  });
}

API.getLatestContainer = function(nodeID, containerName, cb){
  var headers = {
    locale: 'ko',
    uKey : config.uKey,
    'X-M2M-Origin': config.appID
  };
  var path = '/ThingPlug/remoteCSE-'+ nodeID+ '/container-'+ containerName + '/latest';
  httpClient.createRequest('GET', path, headers, null)
            .request(function(err,result){
    if(err) return cb(err);
		var data = JSON.parse(result.data);
    return cb(null, data);
  });
}

API.reqMgmtCmd = function(nodeID, mgmtCmdPrefix, cmd, cb){
  var headers = {
    uKey : config.uKey,
    'X-M2M-Origin': config.appID,
  };
  var body = {
    exra : cmd,			//제어 요청(일반적으로 원격 장치를 RPC호출)을 위한 Argument 정의 (exra == execReqArgs)
    exe : true						//제어 요청 Trigger 속성으로 해당 속성은 (True/False로 표현) (exe == execEnabler)
  };
  var path = '/ThingPlug/mgmtCmd-' + mgmtCmdPrefix + nodeID;
  httpClient.createRequest('PUT', path, headers, body)
            .request(function(err,result){
    if(err) return cb(err);
		var data = JSON.parse(result.data);
    return cb(null, data.exin[0].ri);
  });
}

API.getMgmtResults = function(nodeID, mgmtCmdPrefix, resourceID, cb){
  var headers = {
    locale: 'ko',
    uKey : config.uKey
  };
  var path = '/ThingPlug/mgmtCmd-'+ config.mgmtCmdPrefix + config.nodeID +'/execInstance-'+ resourceID;
  httpClient.createRequest('GET', path, headers, null)
            .request(function(err,result){
    if(err) return cb(err);
    var data = JSON.parse(result.data);
    return cb(null, data);
  });
}

module.exports = API;
