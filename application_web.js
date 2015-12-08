/**
Application에서 data에 접근하기 위해서는 uKey만을 사용합니다.
실행에 앞서 thingplug 사이트에서  사용자와 계정에 디바이스 등록을 진행해야합니다.
*/

'use strict';

var colors = require('colors');
var parseString = require('xml2js').parseString;
var httpReq = require('./promise-http').request;
var optionData = require('./config');

var express = require('express');
var app = express();

app.get('/', function (req, res) {
	console.log('/');
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
				res.send(`
				<html>
					<head>
						<title>하우스 온도 현황</title>
					</head>
					<body>
						<div style="text-align:center">
							<h2> 현재 온도 : ${xmlObj['m2m:cin']['con'][0]} </h2>
							<h5> 측정 시간 : ${xmlObj['m2m:cin']['ct'][0]}</h5>
							<form action="/mgmtcmd_open" method="post">
								<button type="submit">환풍구 열기</button>
							</form>
						</div>
					</body>
				</html>`)
	    });
	  }else{
			res.send('oneM2M 서버에서 contentInstance를 조회하는데 실패했습니다.');
		}
	});
});

app.post('/mgmtcmd_open', function(req,res){
	httpReq({ // 2. mgmCmd 요청
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
        'Content-Type': 'application/json;rty=8'
      }
    },
		body : {
			exra : 'testArgument',			//제어 요청(일반적으로 원격 장치를 RPC호출)을 위한 Argument 정의 (exra == execReqArgs)
			exe : true						//제어 요청 Trigger 속성으로 해당 속성은 (True/False로 표현) (exe == execEnabler)
		}
  }).then(function(result){
			if(result.data){
				var data = JSON.parse(result.data);
				res.send(`
				<html>
					<head>
						<title>하우스 온도 현황</title>
					</head>
					<body>
						<div style="text-align:center">
							<h3>정상적으로 환풍구 열기 명령을 전송했습니다.</h3>
						</div>
					</body>
				</html>`)
			}
	});
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

// Request ID를 생성하기 위한 RandomInt Function
function randomInt (low, high) {
	return Math.floor(Math.random() * (high - low + 1) + low);
}
