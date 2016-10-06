/*
 ThingPlug StarterKit version 0.1
 
 Copyright © 2016 IoT Tech. Lab of SK Telecom All rights reserved.

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	http://www.apache.org/licenses/LICENSE-2.0
	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.

*/

'use strict';

var colors = require('colors');
var xml2js = require('xml2js');
var async = require('async');

var util = require('util');
var mqtt = require('mqtt');

//---------------------------------------------------------Connection 설정-----------------------------------------------------//
var config = require('./config_2');
console.log(colors.green('### ThingPlug virtual Device###'));
if(typeof config === 'undefined') {
  return console.log(colors.red('먼저 config.js를 열어 optionData를 설정하세요. README.md에 Starterkit 실행 방법이 설명되어 있습니다.'));
}

console.log(colors.green('0. 제어 명령 수신 MQTT 연결'));

//=============================================================================================================================//


//-----------------------------------------------------Virtual Sensor Data-----------------------------------------------------//
var IntervalFunction;
//=============================================================================================================================//

//--------------------------------------------Request ID를 생성하기 위한 RandomInt Function------------------------------------//
function randomInt (low, high) {
	return Math.floor(Math.random() * (high - low + 1) + low);
}
//=============================================================================================================================//

MQTTClient();
function MQTTClient(){

  
  var self = this;
  
  var isRunning = 1;
  var reqHeader = "<m2m:req xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.onem2m.org/xml/protocols CDT-requestPrimitive-v1_0_0.xsd\">";
  
  var client = mqtt.connect('mqtt://'+config.TPhost, {
	username:config.userID,			//MQTT broker로 접속을 위한 ID
	password:config.uKey,			//MQTT broker로 접속을 위한 password
	clientId:config.mqttClientId,	//MQTT Client ID
	clean:true						//clean session
  });
	client.on('connect', function () {
		console.log('### mqtt connected ###');
//----------------------------------------------------------Subscribe 설정-----------------------------------------------------//
		client.subscribe("/oneM2M/req/+/"+ config.nodeID);		
		client.subscribe("/oneM2M/resp/"+ config.nodeID +"/+");
//=============================================================================================================================//


//----------------------------------------------------------1. node 생성 요청--------------------------------------------------//
		var op = "<op>1</op>";
		var to = "<to>"+"/"+config.AppEUI+"/"+config.version+"</to>";
		var fr = "<fr>"+config.nodeID+"</fr>";
		var ty = "<ty>14</ty>";
		var ri = "<ri>"+config.nodeID+'_'+randomInt(100000, 999999)+"</ri>";
		var cty = "<cty>application/vnd.onem2m-prsp+xml</cty>";
		var nm = "<nm>"+config.nodeID+"</nm>";
		var reqBody = "<pc><nod><ni>"+config.nodeID+"</ni><mga>MQTT|"+config.nodeID+"</mga></nod></pc></m2m:req>";
		
		var createNode = reqHeader+op+to+fr+ty+ri+cty+nm+reqBody;
		client.publish("/oneM2M/req/"+ config.nodeID +"/"+config.AppEUI, createNode, {qos : 1}, function(){
			console.log(colors.yellow('1. node 생성 요청'));
			isRunning = "node";
			//console.log(colors.yellow(createNode));
					
		});
//=============================================================================================================================//		
	});
	
  client.on('close', function(){
		console.log('### mqtt disconnected ###');
  });
  
	client.on('error', function(error){
	console.log(error);
    self.emit('error', error);
  });
	
	client.on('message', function(topic, message){			//mqtt subscribe message 수신
		if("ContentInstance"!=isRunning){
		console.log(' ');
		}
		var msgs = message.toString().split(',');
	  
		  xml2js.parseString( msgs, function(err, xmlObj){
			if(!err){
//-------------------------------------------------------1. node 생성 subscribe------------------------------------------------//
				if("node"==isRunning){
					//console.log(colors.green(msgs));
					console.log(colors.green('1. node 생성 결과'));
					if(xmlObj['m2m:rsp']['rsc'][0] == 4105){
						console.log(colors.white('이미 생성된 node 입니다.'));
					}
					console.log("생성 node Resource ID : "+xmlObj['m2m:rsp']['pc'][0]['nod'][0]['ri'][0]);//
					config.nodeRI = xmlObj['m2m:rsp']['pc'][0]['nod'][0]['ri'][0];

					console.log('content-location: '+ "/"+config.AppEUI+ "/"+config.version + '/' + isRunning + '-' + config.nodeID);
//=============================================================================================================================//

//-------------------------------------------------2. remoteCSE생성 요청(기기등록)---------------------------------------------//
					var op = "<op>1</op>";
					var to = "<to>"+"/"+config.AppEUI+"/"+config.version+"</to>";
					var fr = "<fr>"+config.nodeID+"</fr>";
					var ty = "<ty>16</ty>";
					var ri = "<ri>"+config.nodeID+'_'+randomInt(100000, 999999)+"</ri>";
					var passCode = "<passCode>"+config.passCode+"</passCode>";
					var cty = "<cty>application/vnd.onem2m-prsp+xml</cty>";
					var nm = "<nm>"+config.nodeID+"</nm>";
					var reqBody = "<pc><csr><cst>3</cst><csi>"+config.nodeID+"</csi><rr>true</rr><nl>"+config.nodeRI+"</nl></csr></pc></m2m:req>";
					
					var createRemoteCSE = reqHeader+op+to+fr+ty+ri+passCode+cty+nm+reqBody;
					client.publish("/oneM2M/req/"+ config.nodeID + "/"+config.AppEUI, createRemoteCSE, {qos : 1}, function(){
						console.log(' ');
						console.log(colors.yellow('2. remoceCSE 생성 요청'));
						isRunning = "remoteCSE";
					});
				}
//=============================================================================================================================//

//----------------------------------------2. remoteCSE생성 요청(기기등록) subscribe--------------------------------------------//	
				else if("remoteCSE"==isRunning){
					console.log(colors.green('2. remoteCSE 생성 결과'));
					if(xmlObj['m2m:rsp']['rsc'][0] == 4105){
						console.log(colors.white('이미 생성된 remoteCSE 입니다.'));
					}
					console.log("디바이스 키 : "+xmlObj['m2m:rsp']['dKey'][0]);//
					config.dKey = xmlObj['m2m:rsp']['dKey'][0];
					
					
					console.log('content-location: '+ "/"+config.AppEUI+ "/"+config.version + '/' + isRunning + '-' + config.nodeID);
//=============================================================================================================================//

//---------------------------------------------------3. container 생성 요청----------------------------------------------------//	
					var op = "<op>1</op>";
					var to = "<to>"+"/"+config.AppEUI+"/"+config.version+"/remoteCSE-"+config.nodeID+"</to>";
					var fr = "<fr>"+config.nodeID+"</fr>";
					var ty = "<ty>3</ty>";
					var ri = "<ri>"+config.nodeID+'_'+randomInt(100000, 999999)+"</ri>";
					var nm = "<nm>"+config.containerName+"</nm>";
					var dKey = "<dKey>"+config.dKey+"</dKey>";
					var cty = "<cty>application/vnd.onem2m-prsp+xml</cty>";
					var reqBody = "<pc><cnt><lbl>con</lbl></cnt></pc></m2m:req>";
					
					var createContainer = reqHeader+op+to+fr+ty+ri+nm+dKey+cty+reqBody;
					client.publish("/oneM2M/req/"+ config.nodeID +"/"+config.AppEUI, createContainer, {qos : 1}, function(){
						console.log(' ');
						console.log(colors.yellow('3. container 생성 요청'));
						isRunning = "container";
					});
				}
//=============================================================================================================================//

//--------------------------------------------3. container 생성 요청 subscribe-------------------------------------------------//
				else if("container"==isRunning){
					console.log(colors.green('3. container 생성 결과'));
					if(xmlObj['m2m:rsp']['rsc'][0] == 4105){
						console.log(colors.white('이미 생성된 container 입니다.'));
					}
					console.log('content-location: '+ "/"+config.AppEUI+ "/"+config.version + '/remoteCSE-' + config.nodeID + '/' + isRunning + '-' + config.containerName);
//=============================================================================================================================//

//---------------------------4. 장치 제어를 위한 device mgmtCmd 리소스 생성 요청--------------------------------------//
					var op = "<op>1</op>";
					var to = "<to>"+"/"+config.AppEUI+"/"+config.version+"</to>";
					var fr = "<fr>"+config.nodeID+"</fr>";
					var ty = "<ty>12</ty>";
					var ri = "<ri>"+config.nodeID+'_'+randomInt(100000, 999999)+"</ri>";
					var nm = "<nm>"+config.nodeID+"_"+config.mgmtPrefix+"</nm>";
					var dKey = "<dKey>"+config.dKey+"</dKey>";
					var cty = "<cty>application/vnd.onem2m-prsp+xml</cty>";
					var reqBody = "<pc><mgc><cmt>"+config.mgmtPrefix+"</cmt><exe>false</exe><ext>"+config.nodeRI+"</ext></mgc></pc></m2m:req>";
					
					var createDevReset = reqHeader+op+to+fr+ty+ri+nm+dKey+cty+reqBody;
					client.publish("/oneM2M/req/"+ config.nodeID +"/"+config.AppEUI, createDevReset, {qos : 1}, function(){
						console.log(' ');
						console.log(colors.yellow('4. mgmtCmd 생성 요청'));
						isRunning = "mgmtCmd";
					});
				}
//=============================================================================================================================//

//---------------------4. 장치 제어를 위한 device mgmtCmd 리소스 생성 요청 subscribe----------------------------------//
				else if("mgmtCmd"==isRunning){
					console.log(colors.green('4. mgmtCmd 생성 결과'));	
					if(xmlObj['m2m:rsp']['rsc'][0] == 4105){
						console.log(colors.white('이미 생성된 mgmtCmd 입니다.'));
					}
					console.log('content-location: '+ "/"+config.AppEUI+ "/"+config.version + '/mgmtCmd-' + config.nodeID + '_' + isRunning);
//=============================================================================================================================//

//------------------------------5. 센서 데이터 전송을 위한 ContentInstance 리소스 생성 요청------------------------------------//					
					console.log(' ');
					console.log(colors.yellow('5. ContentInstance 생성 요청'));
					IntervalFunction = setInterval(IntervalProcess, config.UPDATE_CONTENT_INTERVAL); // 주기적인 contentInstance 생성
					isRunning = "ContentInstance";
				}
//=============================================================================================================================//
	
				else if("ContentInstance"==isRunning){
						try{
//----------------------------------------------------mgmtCmd요청 처리 부분----------------------------------------------------//
							if(xmlObj['m2m:req']){//mgmtCmd Request
								console.log(colors.red('#####################################'));
								console.log(colors.red('MQTT 수신'));
								console.log('RI : '+xmlObj['m2m:req']['pc'][0]['exin'][0]['ri'][0]);		//Resource ID 출력, (ex : EI000000000000000)
								console.log('CMT : '+xmlObj['m2m:req']['pc'][0]['exin'][0]['cmt'][0]);		//Type
								console.log('EXRA : '+xmlObj['m2m:req']['pc'][0]['exin'][0]['exra'][0]);	//CMD 출력
								
								var req = JSON.parse(xmlObj['m2m:req']['pc'][0]['exin'][0]['exra'][0]);
								var cmt = xmlObj['m2m:req']['pc'][0]['exin'][0]['cmt'][0];
								
								processCMD(req, cmt);
//=============================================================================================================================//

//----------------------------------------- 6. mgmtCmd 수행 결과 전달 updateExecInstance---------------------------------------//
								var exin_ri = xmlObj['m2m:req']['pc'][0]['exin'][0]['ri'][0];
								
								var op = "<op>3</op>";
								var to = "<to>"+"/"+config.AppEUI+"/"+config.version+"/mgmtCmd-"+config.nodeID+"_"+cmt+"/execInstance-"+exin_ri+"</to>";
								var fr = "<fr>"+config.nodeID+"</fr>";
								var ty = "<ty>12</ty>";
								var ri = "<ri>"+config.nodeID+'_'+randomInt(100000, 999999)+"</ri>";
								var dKey = "<dKey>"+config.dKey+"</dKey>";
								var cty = "<cty>application/vnd.onem2m-prsp+xml</cty>";
								var reqBody = "<pc><exin><exs>3</exs><exr>0</exr></exin></pc></m2m:req>";
					
								var updateExecInstance = reqHeader+op+to+fr+ri+dKey+cty+reqBody;
								client.publish("/oneM2M/req/"+ config.nodeID +"/"+config.AppEUI, updateExecInstance, {qos : 1}, function(){
									console.log(colors.red('#####################################'));
									isRunning = "updateExecInstance";
								});
//=============================================================================================================================//
							}
//-------------------------5. 센서 데이터 전송을 위한 ContentInstance 리소스 생성 요청 subscribe-------------------------------//	
							else if(xmlObj['m2m:rsp']['pc'][0]['cin'][0]['ty'][0] == 4){
								console.log(colors.white('content : ' + xmlObj['m2m:rsp']['pc'][0]['cin'][0]['con'][0] + ', resourceID : '+ xmlObj['m2m:rsp']['pc'][0]['cin'][0]['ri'][0]));		
							}
//=============================================================================================================================//
						}
						catch(e){
							console.error(colors.yellow(msgs));
							console.error(e);
						}
				}
//----------------------------------------- 6. mgmtCmd 수행 결과 전달 updateExecInstance---------------------------------------//
				else if("updateExecInstance"==isRunning){
					isRunning = "ContentInstance";
				}
//=============================================================================================================================//
			}
      });
		
  });     

//--------------------------------------------------ContentInstance publish----------------------------------------------------//  
 function IntervalProcess(){
	  var op = "<op>1</op>";
	  var to = "<to>"+"/"+config.AppEUI+"/"+config.version+"/remoteCSE-"+config.nodeID+"/container-"+config.containerName+"</to>";
	  var fr = "<fr>"+config.nodeID+"</fr>";
	  var ty = "<ty>4</ty>";
	  var ri = "<ri>"+config.nodeID+'_'+randomInt(100000, 999999)+"</ri>";
	  var dKey = "<dKey>"+config.dKey+"</dKey>";
	  var cty = "<cty>application/vnd.onem2m-prsp+xml</cty>";
	  var reqBody = "<pc><cin><cnf>text</cnf><con>"+config.contents()+"</con></cin></pc></m2m:req>";
	 
	  var createContentInstance = reqHeader+op+to+fr+ty+ri+cty+dKey+reqBody;
	  client.publish("/oneM2M/req/"+ config.nodeID +"/"+config.AppEUI, createContentInstance, {qos : 1}, function(){
					
	  });
    }
//=============================================================================================================================//


//----------------------------------------------------mgmtCmd요청 처리 부분----------------------------------------------------//
function processCMD(req, cmt){
	console.log("commamd Type : " + cmt);
	console.log("commamd : " + req.cmd);
}
//=============================================================================================================================//
 
  

}

