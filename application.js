/**
Application에서 data에 접근하기 위해서는 uKey만을 사용합니다.
실행에 앞서 thingplug 사이트에서  사용자와 계정에 디바이스 등록을 진행해야합니다.
*/

'use strict';

var colors = require('colors');
var httpReq = require('./promise-http').request;

var optionData = require('./config');

// Request ID를 생성하기 위한 RandomInt Function
function randomInt (low, high) {
	return Math.floor(Math.random() * (high - low + 1) + low);
}

// 1. ContentInstance를 활용한 서버에 저장된 센서 값 조회(Retrieve)
httpReq({
  options: {
    host : 'sandbox.sktiot.com',
    port: '9000',
    path : '/ThingPlug/remoteCSE-'+ optionData.node_ID+ '/container-'+optionData.container_name+'/latest',
    method: 'GET',
    headers : {
      Accept: 'application/json',
      locale: 'ko',
      uKey : optionData.uKey,
      'X-M2M-RI': randomInt(100000, 999999),
      'X-M2M-Origin': optionData.app_ID
    }
  }
}).then(function(result){
  console.log(colors.green('1. latest contentInstance 조회'));
  if(result.data){
		var data = JSON.parse(result.data);
		console.log('content : ' + data.con);
		console.log('resouceId : ' + data.ri);
		console.log('생성일 : '+ data.ct);
  }

  return httpReq({ // 2. mgmtCmd 요청
    options: {
      host : 'sandbox.sktiot.com',
      port: '9000',
      path : '/ThingPlug/mgmtCmd-' + optionData.mgmtCmd_prefix + optionData.node_ID,
      method: 'PUT',
      headers : {
        Accept: 'application/json',
        uKey : optionData.uKey,
        'X-M2M-Origin': optionData.app_ID,
        'X-M2M-RI': randomInt(100000, 999999),
				'Content-Type': 'application/json',
      }
    },
		body : {
			exra : 'testArgument',			//제어 요청(일반적으로 원격 장치를 RPC호출)을 위한 Argument 정의 (exra == execReqArgs)
			exe : true						//제어 요청 Trigger 속성으로 해당 속성은 (True/False로 표현) (exe == execEnabler)
											//해당 속성을 True로 지정하고 PUT 요청을 ThingPlug에 전송하면 제어 동작을 진행함
		}
  });
}).then(function(result){
  console.log(colors.green('2. mgmtCmd 제어 요청'));
	//console.log(result);
  if(result.data){
		var data = JSON.parse(result.data);
		console.log('resourceID : '+data.exin[0].ri);
		console.log('execStatus : '+data.exin[0].exs);

		checkMgmtResults(data.exin[0].ri);
  }

}).catch(function(err){
  // console.log(colors.red('2. mgmtCmd 제어 요청 에러'));
  console.log(err);

});

function checkMgmtResults(resourceID){
  return httpReq({ //  execInstance 리소스 조회
     options: {
       host : 'sandbox.sktiot.com',
       port: '9000',
       path : '/ThingPlug/mgmtCmd-'+ optionData.mgmtCmd_prefix + optionData.node_ID +'/execInstance-'+ resourceID,
       method: 'GET',
       headers : {
         Accept: 'application/json',
         locale: 'ko',
         uKey : optionData.uKey,
         'X-M2M-RI': '12345',
         'X-M2M-Origin': 'ThingPlug'
       }
     }
   }).then(function(result){
     console.log(colors.green('#. execInstance 리소스 조회'));
     if(result.data){
			 var data = JSON.parse(result.data);
			 console.log('resourceID : ' + data.ri);
			 console.log('execStatus : ' + data.exs);

			 if(data.exs === 2){
		 		 setTimeout(function(){
					 checkMgmtResults(resourceID);
				 },1000);
			 }
     }
   }).catch(function(err){
     console.log(err);
  });
}
