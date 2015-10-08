/**
Application에서 data에 접근하기 위해서는 uKey만을 사용합니다.
실행에 앞서 thingplug 사이트에서  사용자와 계정에 디바이스 등록을 진행해야합니다.
*/

'use strict';

var colors = require('colors');
var parseString = require('xml2js').parseString;
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
      Accept: 'application/xml',
      locale: 'ko',
      uKey : optionData.uKey,
      'X-M2M-RI': randomInt(100000, 999999),
      'X-M2M-Origin': optionData.app_ID
    }
  }
}).then(function(result){
  console.log(colors.green('1. latest contentInstance 조회'));
  if(result.data){
    parseString(result.data,function(err, xmlObj){
      console.log('content : ' + xmlObj['m2m:cin']['con'][0]);
      console.log('resouceId : ' + xmlObj['m2m:cin']['ri'][0]);
      console.log('생성일 : '+ xmlObj['m2m:cin']['ct'][0]);
    });
  }

  return httpReq({ // 2. mgmCmd 요청
    options: {
      host : 'sandbox.sktiot.com',
      port: '9000',
      path : '/ThingPlug/mgmtCmd-'+optionData.mgmtCmd_name,
      method: 'PUT',
      headers : {
        Accept: 'application/xml',
        uKey : optionData.uKey,
        'X-M2M-Origin': optionData.app_ID,
        'X-M2M-RI': randomInt(100000, 999999),
        'Content-Type': 'application/vnd.onem2m-res+xml;ty=8',
      }
    },
    body : '<?xml version="1.0" encoding="UTF-8"?>'
      +'<m2m:mgc '
      +'    xmlns:m2m="http://www.onem2m.org/xml/protocols" '
      +'    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
      +'    <exra>request</exra>'
			+'    <exe>test</exe>'
      +'</m2m:mgc>'
  });
}).then(function(result){
  console.log(colors.green('2. mgmtCmd 제어 요청'));
  if(result.data){
    parseString(result.data,function(err, xmlObj){
			console.log(xmlObj['m2m:mgc']['m2m:exin'][0]['ri'][0]);
			console.log(xmlObj['m2m:mgc']['m2m:exin'][0]['exs'][0]);
      // console.log('resouceId : ' + xmlObj['m2m:mgc']['m2m:exin'][0]['ri'][0]);
      // console.log('execStatus : ' + xmlObj['m2m:mgc']['m2m:exin'][0]['exs'][0]);
      return checkMgmtResults(xmlObj['m2m:mgc']['m2m:exin'][0]['ri'][0]);
    });
  }
  
  
}).catch(function(err){
  console.log(colors.red('2. mgmtCmd 제어 요청 에러'));
  console.log(err);
  
});

function checkMgmtResults(resourceID){
  return httpReq({ //  execInstance 리소스 조회
     options: {
       host : 'sandbox.sktiot.com',
       port: '9000',
       path : '/ThingPlug/mgmtCmd-'+optionData.mgmtCmd_name+'/execInstance-'+ resourceID,
       method: 'GET',
       headers : {
         Accept: 'application/xml',
         locale: 'ko',
         uKey : optionData.uKey,
         'X-M2M-RI': '12345',
         'X-M2M-Origin': 'ThingPlug',
         'Content-Type': 'application/xml'
       }
     }
   }).then(function(result){
     console.log(colors.green('#. execInstance 리소스 조회'));
     if(result.data){
       parseString(result.data,function(err, xmlObj){
         console.log('resouceId : ' + xmlObj['m2m:exin']['ri'][0]);
         console.log('execStatus : ' + xmlObj['m2m:exin']['exs'][0]);
				 
				 if(xmlObj['m2m:exin']['exs'][0] == '2'){
					 setTimeout(function(){
						 checkMgmtResults(resourceID);
					 },1000);
				 }
       });
     }
   }).catch(function(err){
     console.log(err); 	
  }); 
}
