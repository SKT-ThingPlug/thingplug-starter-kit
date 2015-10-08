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


httpReq({ 
  options: {
    host : 'sandbox.sktiot.com',
    port: '9000',
    path : '/ThingPlug',													//rty는 생성하고자 하는 Resource Type의 식별자 (rty == 16은 remoteCSE를 의미함)
    method: 'POST',
    headers : {	
      'X-M2M-Origin': optionData.node_ID,										//해당 요청 메시지 송신자의 식별자
      'X-M2M-RI': randomInt(100000, 999999),									//해당 요청 메시지에 대한 고유 식별자 (RI == Request ID) / 해당 식별자는 CSE가 자동 생성
      'X-M2M-NM': optionData.node_ID,								//해당 요청으로 생성하게 되는 자원의 이름 (NM == Name)
      // passCode: optionData.passCode,
      // locale: 'ko',
      Accept: 'application/xml',
      'Content-Type': 'application/vnd.onem2m-res+xml;ty=14',
      // uKey: optionData.uKey
    }
  },
  body: '<?xml version="1.0" encoding="UTF-8"?>'
    +'<m2m:nod'																	//remoteCSE 자원에 대한 XML document (csr == remoteCSE)
    +'    xmlns:m2m="http://www.onem2m.org/xml/protocols" '				
    +'    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    +'    <ni>'+optionData.node_ID+'</ni>'														//등록하는 CSE가 접근하는 한 객체 여부 표기 (requestReachability == rr)
    +'</m2m:nod>'
}).then(function(result){
    // console.log(result);   
     
    if(result.statusCode == 409){
      console.log('이미 생성된 node resource ID 입니다.');
    }
    parseString(result.data,function(err, xmlObj){
      optionData.nodeRI = xmlObj['m2m:nod']['ri'][0];
      console.log(colors.yellow('생성 node Resource ID : ') + optionData.nodeRI);
      
    });
    
  // 1. remoteCSE생성 요청(기기등록)
  return httpReq({ 
    options: {
      host : 'sandbox.sktiot.com',
      port: '9000',
      path : '/ThingPlug',													//rty는 생성하고자 하는 Resource Type의 식별자 (rty == 16은 remoteCSE를 의미함)
      method: 'POST',
      headers : {	
        'X-M2M-Origin': optionData.node_ID,										//해당 요청 메시지 송신자의 식별자
        'X-M2M-RI': randomInt(100000, 999999),									//해당 요청 메시지에 대한 고유 식별자 (RI == Request ID) / 해당 식별자는 CSE가 자동 생성
        'X-M2M-NM': optionData.node_ID,								//해당 요청으로 생성하게 되는 자원의 이름 (NM == Name)
        passCode: optionData.passCode,
        // locale: 'ko',
        Accept: 'application/xml',
        'Content-Type': 'application/vnd.onem2m-res+xml;ty=16',
        // uKey: optionData.uKey
      }
    },
    body: '<?xml version="1.0" encoding="UTF-8"?>'
      +'<m2m:csr'																	//remoteCSE 자원에 대한 XML document (csr == remoteCSE)
      +'    xmlns:m2m="http://www.onem2m.org/xml/protocols" '				
      +'    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
      +'    <cst>3</cst>'															//등록하는 CSE의 타입 (IN-CSE = 1, MN-CSE = 2, ASN-CSE = 3) (cseType == cst)
      +'    <csi>' + optionData.node_ID + '</csi>'									//등록하는 CSE의 식별자 (CSE-ID == csi)
      +'    <poa>MQTT|'+optionData.node_ID+'</poa>'							//등록하는 CSE의 물리적 접근 식별자 또는 주소 (pointOfAccess == poa)
      +'    <rr>true</rr>'														//등록하는 CSE가 접근하는 한 객체 여부 표기 (requestReachability == rr)
      +'    <nl>'+ optionData.nodeRI +'</nl>'
      +'</m2m:csr>'
  })
}).then(function(result){
  console.log(colors.green('1. remoteCSE 생성 결과'));
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
    var mqtt = require('mqtt');
    var client  = mqtt.connect('mqtt://sandbox.sktiot.com');
   
    client.on('connect', function () {
      console.log('### mqtt connected ###');
      client.subscribe(optionData.node_ID);
      resolve();
      //client.publish('presence', 'Hello mqtt');
    });
    
    client.on('error', function(error){
      reject(error);
    });
     
    client.on('message', function (topic, message) {
      // message is Buffer 
      var msgs = message.toString().split(',');
      console.log(colors.red('#####################################'));
      console.log(colors.red('MQTT 수신 mgmtCmd Name : ') + msgs[0]);
      parseString( msgs[1], function(err, xmlObj){
        if(!err){
          console.log(colors.red('extra : ') + xmlObj['m2m:exin']['exra'][0]);
          updateExecInstance(xmlObj['m2m:exin']['ri'][0])
        }
      });
      console.log(colors.red('#####################################'));
      // console.log(message.toString());
      // client.end();
    });
  });
}).then(function(result){
  // 2. container 생성 요청
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
        dkey : optionData['dKey'],
        locale: 'ko',
        Accept: 'application/xml',
        'Content-Type': 'application/vnd.onem2m-res+xml;ty=3'
      }
    },
    body: '<?xml version="1.0" encoding="UTF-8"?>'
      +'<m2m:cnt '																//container 자원에 대한 XML document (cnt == container)
      +'    xmlns:m2m="http://www.onem2m.org/xml/protocols" '
      +'    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
      // +'    <uploadCondition>less than</uploadCondition>'					
      // +'    <uploadConditionValue>50</uploadConditionValue>'
      +'    <containerType>heartbeat</containerType>'
      +'    <heartbeatPeriod>300</heartbeatPeriod>'
      +'</m2m:cnt>'
  });
}).then(function(result){
  console.log(colors.green('2. container 생성 결과'));
  console.log('content-location: '+ result.headers['content-location']);		//생성된 자원의 URI
  
  
  // 3. 장치 제어를 위한 device mgmtCmd 리소스 생성
  return httpReq({
    options: {
      host : 'sandbox.sktiot.com',
      port: '9000',
      path : '/ThingPlug',				//rty == 12는 생성하고자 하는 mgmtCmd 자원을 의미함
      method: 'POST',
      headers : {
        Accept: 'application/xml',
        locale: 'ko',
        dkey : optionData['dKey'],
        'X-M2M-Origin': optionData.node_ID,										//해당 요청 메시지 송신자의 식별자
        'X-M2M-RI': randomInt(100000, 999999),									//해당 요청 메시지에 대한 고유 식별자 (RI == Request ID) / 해당 식별자는 CSE가 자동 생성
        'X-M2M-NM': optionData.mgmtCmd_name,									//해당 요청으로 생성하게 되는 자원의 이름 (NM == Name)
        // 'Content-Type': 'application/xml',
        'Content-Type': 'application/vnd.onem2m-res+xml;ty=12'
      }
    },
    body: '<?xml version="1.0" encoding="UTF-8"?>'
        +'<m2m:mgc '															//mgmtCmd 자원에 대한 XML document (mgc == mgmtCmd)
        +'    xmlns:m2m="http://www.onem2m.org/xml/protocols" '
        +'    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        +'    <cmt>'+optionData.cmdType+'</cmt>'								//장치 제어 형태 (예, Firmware Update, Memory Check) / (cmt == cmdType)
        // +'    <exe>true</exe>'													//장치 제어 가능 여부 (true/false) / (exe == execEnable))
        +'    <ext>'+optionData.nodeRI+'</ext>'									//제어되는 장치의 식별자, 일반적으로 자신의 식별자 명시 (ext == exeTarget)
        +'</m2m:mgc>'	
  });
}).then(function(result){
  console.log(colors.green('3. mgmtCmd 생성 결과'));	
  console.log('content-location: '+ result.headers['content-location']);		//생성된 자원의 URI
  if(result.headers){
    console.log(colors.green('4. content Instance 주기적 생성 시작'));
    setContentInterval();
  }
}).catch(function(err){
  console.log(err);
});


function setContentInterval(){
  setInterval(function(){
    // 3. content Instance 생성
    var value = Math.floor(Math.random() * 40);
    console.log('센서 content : ' + value);
    httpReq({ 
      options : {
        host : 'sandbox.sktiot.com',
        port: '9000',
        path : '/ThingPlug/remoteCSE-'+ optionData.node_ID+ '/container-'+optionData.container_name,		//rty == 4는 생성하고자 하는 contentInstance 자원을 의미함
        method: 'POST',
        headers : {
          Accept: 'application/xml',
          locale: 'ko',
          'X-M2M-Origin': optionData.node_ID,
          'X-M2M-RI': randomInt(100000, 999999),
          'Content-Type': 'application/vnd.onem2m-res+xml;ty=4',
		      dKey : optionData['dKey']
        }
      },
      body : '<?xml version="1.0" encoding="UTF-8"?>'
        +'<m2m:cin'																//contentInstance 자원에 대한 XML document (cin == contentInstance)
        +'    xmlns:m2m="http://www.onem2m.org/xml/protocols" '
        +'    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        +'    <cnf>text</cnf>'													//업로드 하는 데이터의 정보 (cnf = contentInfo)
        +'    <con>'+ value +'</con>'											//업로드 하는 데이터 (con == content)
        +'</m2m:cin>'	
    }).then(function(result){
      // console.log('content-location: '+ result.headers['content-location']);	//생성된 자원의 URI
      parseString(result.data,function(err, xmlObj){
        // console.log(colors.yellow('생성 resourceID : ') + xmlObj['m2m:cin']['ri'][0]);
      });
      
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
      path : '/ThingPlug/mgmtCmd-'+optionData.mgmtCmd_name+'/execInstance-'+ei,
      method: 'PUT',
      headers : {
        Accept: 'application/xml',
        dKey : optionData.dKey,
        'X-M2M-Origin': optionData.node_ID,
        'X-M2M-RI': randomInt(100000, 999999),
        'Content-Type': 'application/xml',
        locale: 'ko',
        // uKey: optionData.uKey
      }
    },
    body: '<?xml version="1.0" encoding="UTF-8"?>'
      +'<m2m:exin '
      +'    xmlns:m2m="http://www.onem2m.org/xml/protocols" '
      +'    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
      +'</m2m:exin>'
  }).then(function(result){
    console.log(colors.red('#####################################'));
    parseString(result.data,function(err, xmlObj){
      console.log('처리한 resouceId : ' + xmlObj['m2m:exin']['ri'][0]);
      console.log('처리한 결과 execStatus : ' + xmlObj['m2m:exin']['exs'][0]);
    });
    console.log(colors.red('#####################################'));
  }).catch(function(err){
    console.log(err);
  });
}
