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

var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var config = [];
var config_h = [];
var configIndex = 0;
var numOfDevice = 1;

var nodemailer = require('./notification/mail').request;

var colors = require('colors');

var Promise = require('es6-promise').Promise;

app.set('port', process.env.PORT || 3000);
app.use('/dashboard', express.static(path.join(__dirname,'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//------------------------------------------------------config 정보 load-------------------------------------------------------//

for (var j =0; j < numOfDevice; j++) {
	config.push(require('./config_'+(j+1).toString()));
	config_h.push('/config_'+(j+1).toString());
}

//지도에서 클릭 후 node 관련 config return
app.get(config_h, function(req,res) {
  configIndex = parseInt(req.originalUrl[8])-1;
  res.send(config[configIndex]);
});

//=============================================================================================================================//





//--------------------------------------------Request ID를 생성하기 위한 RandomInt Function------------------------------------//
function randomInt (low, high) {
	return Math.floor(Math.random() * (high - low + 1) + low);
}
//=============================================================================================================================//



//----------------------------------------- 1. Container에 저장된 최신 값 조회(Retrieve)---------------------------------------//

app.get('/data/:container', function(req,res) {
  var container = req.params.container;
 
  getLatestContainer(function(err, data){
	 
    if(err) return res.send(err);
    else return res.send(data.cin);
  });
});
//=============================================================================================================================//

//---------------------------------------------------- 2. mgmCmd 요청----------------------------------------------------------//

app.post('/control', function(req,res) {
  var cmd = JSON.stringify(req.body);
  console.log("{\"cmd\":\""+req.body.cmd+"\"}");
  console.log("{\"cmt\":\""+req.body.cmt+"\"}");
  reqMgmtCmd(req.body.cmt, "{\"cmd\":\""+req.body.cmd+"\"}", config[configIndex].nodeRI, function(err, data){

    if(err) return res.send({'error':err});
    return res.send({'result':'ok'});
  });
});
//=============================================================================================================================//

//-----------------------------------------------------Event 발생시 알림-------------------------------------------------------//

app.post('/email', function(req,res) {
	var cmd =req.body;
	nodemailer(cmd);
  return res.send('result : ok');
});


app.post('/sms', function(req,res) {
	
  return res.send('no service');
});
//=============================================================================================================================//


var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server for sample dashboard listening on port:'+ app.get('port'));
});

var httpReq = require('./promise-http').request;

//-------------------------------- 1. Container에 저장된 최신 값 조회(Retrieve)----------------------------------------//
function getLatestContainer(cb){
httpReq({ 
  options: {
    host : config[configIndex].TPhost,
    port : config[configIndex].TPport,
    path : '/'+config[configIndex].AppEUI+'/'+config[configIndex].version+'/remoteCSE-'+ config[configIndex].nodeID+ '/container-'+config[configIndex].containerName+'/latest',
    method: 'GET',
    headers : {
      Accept: 'application/json',
      locale: 'ko',
      uKey : config[configIndex].uKey,
      'X-M2M-RI': config[configIndex].nodeID+'_'+randomInt(100000, 999999),
      'X-M2M-Origin': config[configIndex].nodeID
    }
  }
}).then(function(result){
  if(result.data){
		var data = JSON.parse(result.data);
		

		return cb(null, data);
  }
});
}

//=============================================================================================================================//

//---------------------------------------------------- 2. mgmCmd 요청----------------------------------------------------------//


function reqMgmtCmd(mgmtCmdPrefix, cmd, nodeRI, cb){
// 2. mgmCmd 요청
	httpReq({ 
    options: {
      host : config[configIndex].TPhost,
      port : config[configIndex].TPport,
      path : '/'+config[configIndex].AppEUI+'/'+config[configIndex].version+'/mgmtCmd-'+config[configIndex].nodeID + '_' + mgmtCmdPrefix,
      method: 'PUT',
      headers : {
        Accept: 'application/json',
        uKey : config[configIndex].uKey,
        'X-M2M-Origin': config[configIndex].nodeID,
        'X-M2M-RI': config[configIndex].nodeID+'_'+randomInt(100000, 999999),
		'Content-Type': 'application/json;ty=8'
	  }
      },
		body : {mgc:{
    exra : cmd,			//제어 요청(일반적으로 원격 장치를 RPC호출)을 위한 Argument 정의 (exra == execReqArgs)
    exe : true,						//제어 요청 Trigger 속성으로 해당 속성은 (True/False로 표현) (exe == execEnabler)
	cmt : mgmtCmdPrefix,
	ext : nodeRI
  }}
}).then(function(result){
  console.log(colors.green('mgmtCmd 제어 요청'));
  if(result.data){
		var data = JSON.parse(result.data);
		return cb(null, data);
  }
  
});
}
//=============================================================================================================================//
