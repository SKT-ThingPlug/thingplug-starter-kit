'use strict';

var colors = require('colors');
var parseString = require('xml2js').parseString;
var httpReq = require('./promise-http').request;

var optionData = require('./config');

console.log(colors.green('### ThingPlug Device###'));
if(typeof optionData == 'undefined') {
  console.log(colors.red('먼저 config.js를 열어 optionData를 설정하세요. README.md에 Starterkit 실행 방법이 설명되어 있습니다.'));
  return;
}

// Request ID를 생성하기 위한 RandomInt Function
function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low);
}

// 1. node 생성
httpReq({
  options: {
    host : 'sandbox.sktiot.com',
    port: '9000',
    path : '/ThingPlug',
    method: 'POST',
    headers : {
      'X-M2M-Origin': optionData.node_ID,				//해당 요청 메시지 송신자의 식별자
      'X-M2M-RI': randomInt(100000, 999999),		//해당 요청 메시지에 대한 고유 식별자 (RI == Request ID) / 해당 식별자는 CSE가 자동 생성
      'X-M2M-NM': optionData.node_ID,           //해당 요청으로 생성하게 되는 자원의 이름 (NM == Name)
      'Accept': 'application/json',
      'Content-Type': 'application/json;ty=14', //ty는 생성하고자 하는 Resource Type의 식별자 (ty == 14은 node를 의미함)
    }
  },
  body : {
    ni: optionData.node_ID						//등록한 장치의 식별자 (ni == nodeID)
  }
}).then(function(result){
  console.log(colors.blue('1. node 생성 요청 내용'));
  //console.log(result.requestArgs);
  console.log(colors.green('1. node 생성 결과'));
  if(result.statusCode == 409){
    console.log('이미 생성된 node resource ID 입니다.');
  }
  optionData.nodeRI = JSON.parse(result.data).ri;
  console.log(colors.yellow('생성 node Resource ID : ') + optionData.nodeRI);

  // 2. remoteCSE생성 요청(기기등록)
  return httpReq({
    options: {
      host : 'sandbox.sktiot.com',
      port: '9000',
      path : '/ThingPlug',														//rty는 생성하고자 하는 Resource Type의 식별자 (rty == 16은 remoteCSE를 의미함)
      method: 'POST',
      headers : {
        'X-M2M-Origin': optionData.node_ID,										//해당 요청 메시지 송신자의 식별자
        'X-M2M-RI': randomInt(100000, 999999),									//해당 요청 메시지에 대한 고유 식별자 (RI == Request ID) / 해당 식별자는 CSE가 자동 생성
        'X-M2M-NM': optionData.node_ID,											//해당 요청으로 생성하게 되는 자원의 이름 (NM == Name)
        'passCode': optionData.passCode,
        'Accept': 'application/json',
        'Content-Type': 'application/json;ty=16'
      }
    },
    body : {
      cst : 3,      															//등록하는 CSE의 타입 (IN-CSE = 1, MN-CSE = 2, ASN-CSE = 3) (cseType == cst)
      csi : optionData.node_ID, 												//등록하는 CSE의 식별자 (CSE-ID == csi)
      poa : ['MQTT|'+optionData.node_ID], 										//등록하는 CSE의 물리적 접근 식별자 또는 주소 (pointOfAccess == poa)
      rr : true,  																//등록하는 CSE가 접근하는 한 객체 여부 표기 (requestReachability == rr)
      nl : optionData.nodeRI
    }
  });

}).then(function(result){
  console.log(colors.green('2. remoteCSE 생성 결과'));
  if(result.statusCode == 409){
    console.log('이미 생성된 remoteCSE 입니다.');
  }
  if(result.headers.dkey){
    console.log('다비이스 키 : '+ result.headers.dkey);
    console.log('content-location: '+ result.headers['content-location']);		//생성된 자원의 URI
    optionData['dKey'] = result.headers.dkey;
  }
  // MQTT Connect
  return new Promise(function(resolve, reject){
    var msgTest;
    var mqtt = require('mqtt');
    var client  = mqtt.connect('mqtt://sandbox.sktiot.com');

    client.on('connect', function () {
      console.log('### mqtt connected ###');
      client.subscribe("/oneM2M/req/+/"+ optionData.node_ID);
      resolve();
    });

    client.on('error', function(error){
      reject(error);
    });

    client.on('message', function (topic, message) {
      // message is Buffer
      var msgs = message.toString().split(',');
      console.log(colors.red('#####################################'));
      console.log(colors.red('MQTT 수신');
      parseString( msgs[0], function(err, xmlObj){
        if(!err){
          console.log(xmlObj['m2m:req']['pc'][0]['exin'][0]['ri'][0]);
          updateExecInstance(xmlObj['m2m:req']['pc'][0]['exin'][0]['ri'][0]);
        }
      });
      console.log(colors.red('#####################################'));
    });
  });
}).then(function(result){

  // 3. container 생성 요청
  return httpReq({
    options: {
      host : 'sandbox.sktiot.com',
      port: '9000',
      path : '/ThingPlug/remoteCSE-'+ optionData.node_ID,				//rty == 3은 생성하고자 하는 container 자원을 의미함
      method: 'POST',
      headers : {
        'X-M2M-Origin': optionData.node_ID,										//해당 요청 메시지 송신자의 식별자
        'X-M2M-RI': randomInt(100000, 999999),									//해당 요청 메시지에 대한 고유 식별자 (RI == Request ID) / 해당 식별자는 CSE가 자동 생성
        'X-M2M-NM': optionData.container_name,									//해당 요청으로 생성하게 되는 자원의 이름 (NM == Name)
        'dkey' : optionData['dKey'],
        'locale': 'ko',
        'Accept': 'application/json',
        'Content-Type': 'application/json;ty=3'
      }
    },
    body : {
      containerType : 'heartbeat',
      heartbeatPeriod : 300
    }
  });
}).then(function(result){
  console.log(colors.green('3. container 생성 결과'));
  if(result.statusCode == 409){
    console.log('이미 생성된 container 입니다.');
  }
  console.log('content-location: '+ result.headers['content-location']);		//생성된 자원의 URI


  // 4. 장치 제어를 위한 device mgmtCmd 리소스 생성
  return httpReq({
    options: {
      host : 'sandbox.sktiot.com',
      port: '9000',
      path : '/ThingPlug',				//rty == 12는 생성하고자 하는 mgmtCmd 자원을 의미함
      method: 'POST',
      headers : {
        Accept: 'application/json',
        locale: 'ko',
        dkey : optionData['dKey'],
        'X-M2M-Origin': optionData.node_ID,										//해당 요청 메시지 송신자의 식별자
        'X-M2M-RI': randomInt(100000, 999999),							  //해당 요청 메시지에 대한 고유 식별자 (RI == Request ID) / 해당 식별자는 CSE가 자동 생성
        'X-M2M-NM': optionData.mgmtCmd_prefix + optionData.node_ID,	//해당 요청으로 생성하게 되는 자원의 이름 (NM == Name)
        'Content-Type': 'application/json;ty=12'
      }
    },
    body: {
      cmt : optionData.cmdType,   //장치 제어 형태 (예, Firmware Update, Memory Check) / (cmt == cmdType)
      exe : true,                 //장치 제어를 위한 Trigger Attribute (true/false) / (exe == execEnable))
      ext : optionData.nodeRI     //제어되는 장치의 식별자로 제어하고자 하는 장치의 node 자원 식별자를 명시함 (ext == exeTarget)
    }
  });
}).then(function(result){
  console.log(colors.green('4. mgmtCmd 생성 결과'));
  if(result.statusCode == 409){
    console.log('이미 생성된 mgmtCmd 입니다.');
  }
  console.log('content-location: '+ result.headers['content-location']);		//생성된 자원의 URI
  if(result.headers){
    console.log(colors.green('5. content Instance 주기적 생성 시작'));
    setContentInterval();
  }
}).catch(function(err){
  console.log(err);
});


function setContentInterval(){
  setInterval(function(){
    // 5. content Instance 생성
    var value = Math.floor(Math.random() * 40);
    httpReq({
      options : {
        host : 'sandbox.sktiot.com',
        port: '9000',
        path : '/ThingPlug/remoteCSE-'+ optionData.node_ID+ '/container-'+optionData.container_name,		//rty == 4는 생성하고자 하는 contentInstance 자원을 의미함
        method: 'POST',
        headers : {
          Accept: 'application/json',
          locale: 'ko',
          'X-M2M-Origin': optionData.node_ID,
          'X-M2M-RI': randomInt(100000, 999999),
          'Content-Type': 'application/json;ty=4',
          dKey : optionData['dKey']
        }
      },
      body : {
        cnf : 'text', //업로드 하는 데이터 타입의 정보 (cnf = contentInfo)
        con : value   //업로드 하는 데이터 (con == content)
      }
    }).then(function(result){
      //console.log(result.requestArgs);
      //console.log('#####################################');
      //console.log(result.headers);
      //console.log(result.data);
      var data = JSON.parse(result.data);
      console.log('content : ' + data.con + ', resourceID : '+data.ri);
    }).catch(function(err){
      console.log(err);
    });
  },1000);
}


function updateExecInstance(ei){
  httpReq({ // ### execInstance Update(PUT) - execStatus 변경됨
    options: {
      host : 'sandbox.sktiot.com',
      port: '9000',
      path : '/ThingPlug/mgmtCmd-' + optionData.mgmtCmd_prefix + optionData.node_ID + '/execInstance-'+ei,
      method: 'PUT',
      headers : {
        Accept: 'application/json',
        dKey : optionData.dKey,
        'X-M2M-Origin': optionData.node_ID,
        'X-M2M-RI': randomInt(100000, 999999),
        'Content-Type': 'application/json',
        locale: 'ko'
      }
    },
    body : {}
  }).then(function(result){
    // console.log(colors.red('#####################################'));
    var data = JSON.parse(result.data);
    console.log('처리한 resouceId : ' + data.ri);
    console.log('처리한 결과 execStatus : ' + data.exs);
    console.log(colors.red('#####################################'));
  }).catch(function(err){
    console.log(err);
  });
}
