![ThingPlug logo](https://github.com/SKT-ThingPlug/thingplug-starter-kit/raw/master/images/thingplug--onem2m-logo.png)
# SKT ThingPlug oneM2M Starter Kit
본 Starter Kit은 SKT의 ThingPlug oneM2M API를 이용하여 IoT 서비스를 제작하는 가장 기초적인 방법을 구현해둔 프로젝트 입니다. SKT의 ThingPlug oneM2M을 이용한 서비스 개발을 Starter Kit에서부터 시작해보세요.

## oneM2M의 구성과 Starter Kit의 목적
oneM2M에서는 역할에 따라 구성원을 다음 세 가지로 구분할 수 있습니다.

![oneM2M 구성과 주요 요청](https://github.com/SKT-ThingPlug/thingplug-starter-kit/raw/master/images/oneM2M.png)

- 애플리케이션 클라이언트
- 디바이스 클라이언트
- oneM2M

애플리케이션과 디바이스는 직접적으로 통신하지 않고 각 구성원들은 기본적으로 REST API를 통해 oneM2M과 통신을 하게 됩니다. oneM2M은 SKT의 ThingPlug가 제공을 해주니 여러분은 디바이스와 애플리케이션만 구현하면 되므로 제품 개발 시 제품자체에 더욱 집중 할 수 있습니다. 본 Starer Kit은 바로 이 두 가지, 애플리케이션과 디바이스의 기본적인 역할을 구현해 놓은 것입니다. 따라서 이 Starter Kit은 ThingPlug의 oneM2M을 직접 경험해 봄으로써 oneM2M을 이해하고 바로 제품개발을 시작할 수 있는 시작점을 제공하는데 그 목적이 있습니다.

## Starter Kit 실행절차 요약
다음 절차를 따르면 간편하게 Starter Kit을 실행할 수 있습니다.

1. 사전 준비 : 필요한 필수 도구 설치 및 코드 복사
2. Code를 복사
3. 프로젝트 dependency를 설치
4. 나의 ThingPlug 계정정보에 맞게 일부 파일을 수정
5. Device를 실행
6. ThingPlug에 내 계정에 Device를 등록
7. Application을 실행

### 사전 준비
#### Node 설치
Starter Kit을 실행하기 위해서는 다음과 같은 도구가 설치되어 있어야 합니다.

- [Node.js](https://nodejs.org) : 공식 사이트에서 설치 패키지를 다운받을 수 있습니다.

> 주의!
ThingPlug oneM2M을 이용하기 위해서는 ThingPlug 계정이 필요합니다. ThingPlug 회원가입시 사용할 디바이스 연동 프로토콜을 반드시 HTTP로 선택해야합니다. HTTP로 선택하지 않고 이미 계정을 만드셨다면 다른 계정을 하나 더 만들어서 진행하세요.

#### 코드 복사

코드는 Release된 [Zip파일](https://github.com/SKT-ThingPlug/thingplug-starter-kit/archive/master.zip)을 다운 받아서 임의에 폴더에 압축을 해제하세요. 또는 아래 명령어를 이용하여 github의 master 버전을 clone해도 됩니다.

```
git clone git@github.com:SKT-ThingPlug/thingplug-starter-kit.git
```

복사된 폴더 안을 살펴보면 다음과 같은 주요파일이 있습니다.

- `device.js` : 실제 IoT Device에서 구동되는 코드 입니다. Node.js로 구현되어 있어 Node.js가 실행 가능한 컴퓨터에서 실행가능하며 [BeegleBone Black](http://beagleboard.org/black) 같이 Node.js를 구동할 수 있는 하드웨어 플랫폼에서도 직접 실행이 가능합니다.
- `application.js` : `device.js`에서 ThingPlug로 전송한 데이터를 이용하는 주체로써 일반적으로 웹이나 앱에 해당합니다. 사용자와의 접점으로 데이터를 사용자에게 보여주거나 사용자로부터 어떠한 명령을 받아 oneM2M서버를 통해 실제 device를 제어하기도 합니다.
- `config.js` : 개발자 인증키와 디바이스 ID등 스타터킷 실행에 앞서 필요한 환경 값을 가지고 있습니다. 각자의 상황에 맞게 수정이 필요합니다. [config.js 수정참고 섹션](https://github.com/SKT-ThingPlug/thingplug-starter-kit#configjs-수정)


#### 프로젝트 dependency 설치
Starter Kit을 통해서 실행하는 device와 application은 Node.js로 구현되어 있으며 실행에 필요한 dependency 정보는 package.json에 기입되어 있습니다. 따라서 위에서 복사한 starter kit 폴더(package.json이 존재하는 폴더)로 이동 후 `npm install` 명령어를 통해 dependency 설치하세요.

```
cd thingplug-starter-kit
npm install
```

### config.js 수정
Starter Kit이 실질적으로 동작하기 위해서는 개발자 계정정보 및 디바이스 정보를 개발자 상황에 맞게 수정해야합니다. `config.js_sample`파일을 `config.js`파일로 복사한 후 `config.js`를 에디터에서 열고 각 항목 오른쪽에 달린 주석 설명과 아래 설명을 참고하여 수정하세요.

#### CSE_ID란?

> TODO: cse_id prefix에 대한 내용이 공유되면 해당 내용을 변경 

cse_ID는 디바이스를 oneM2M에서 구분하기 위해 주민번호처럼 디바이스마다 부여되는 고유의 아이디입니다. 스타터킷을 위한 CSE_ID는 `000.000.000.000.xxxx`이며 마지막 xxx가 시리얼번호에 해당합니다. 다른 디바이스와 겹치지 않기 위해 스타터킷에서는  핸드폰 번호를 입력해주세요.

```
000.0000.00000.0000.00000
(제조사.모델명.OOO.OOO.시리얼번호)
```

```javascript
module.exports = {
  uKey : 'USER_KEY_FROM_SANDBOX.SKIOT.COM', // 사용자 인증키 : https://sandbox.sktiot.com/IoTPortal/mypage/myiot
  cse_ID : '1.2.481.1.900.90.01000000000', // Device ID (본 예제에서는 맨 뒷자리를 핸드폰 번호 사용 권장)
  passCode : '000101', // ThingPlug에 Device등록 시 사용할 Device의 비밀번호 (본 예제에서는 생년월일 사용 권장)
  app_ID : 'myApplication', //Application의 구분을 위한 ID
  container_name:'plugtest01', // starter kit에서 생성하고 사용할 container 이름 (임의지정)
  mgmtCmd_name : 'mgmtCmd_1', // starter kit에서 생성하고 사용할 제어 명령 이름 (임의지정)
  cmdType : 'senser_1' // starter kit에서 사용할 제어 타입 (임의지정)
};
```

### Device 실행
`node device` 명령어로 Device를 실행하면 다음과 같은 결과 화면이 나오면 정상입니다.

```
$ node device
### ThingPlug Device ###
1. remoteCES 생성 결과
다비이스 키 : THIS=IS=A=SAMPLE=KEY=BVNUFtQTVYbkU2WVkxUkQ0R0ZLNCs5eTNFcUEyY0Voa29CTGZvR0tFcFlxWk1UnJJZQ==
content-location: http://sandbox.sktiot.com:9000/ThingPlug/remoteCSE-000.0000.00000.0000.00000
### mqtt connected ###
2. container 생성 결과
content-location: http://sandbox.sktiot.com:9000/ThingPlug/remoteCSE-000.0000.00000.0000.00000/container-plugtest01
3. mgmtCmd 생성 결과
content-location: http://sandbox.sktiot.com:9000/ThingPlug/remoteCSE-000.0000.00000.0000.00000/mgmtCmd-mgmtCmd_1
4. content Instance 주기적 생성 시작
센서 content : 33
센서 content : 10
...
```

#### Device가 하는 일
 
 구분  | 설명 | HTTP Method
-------|----|---
1. remoteCSE 생성 | remoteCSE ID와 passCode를 oneM2M서버에 등록합니다. | POST
2. 컨테이너 생성 | 데이터를 저장해둘 container를 생성합니다. 파일시스템의 폴더와 같은 역할을 합니다. | POST
3. mgmtCmd 생성 | 디바이스에서 받아들일 수 있는 제어 명령어를 생성 합니다. 이 생성된 명령어 이름은 Application이 제어 명령을 내릴 때 사용합니다. | POST
4. Content Instance 생성 | 일반적으로 센서의 측정값을 지정한 컨테이너에 기록합니다. | POST
5. MQTT 연결 | 현재 ThingPlug는 Application에서 oneM2M에게 전달된 제어명령(mgmtCmd) execInstance를 전달받는 방법으로 MQTT를 사용할 수 있습니다.(oneM2M표준사항은 아님) ThingPlug MQTT와 연결합니다. | -
6. execInstance 갱신 | MQTT등을 통해 전달받은 execInstance의 결과를 갱신합니다. | PUT
  
### ThingPlug에 내 계정에 Device를 등록
애플리케이션에서 ThingPlug oneM2M REST API를 통해 데이터를 필요에 따라 제어명령을 보내기 위해서는 먼저 ThingPlug 사이트에 위 device(생성된 remoteCSE)를 등록해야합니다.

- [ThingPlug](https://sandbox.sktiot.com) 로그인 후 "마이페이지 > 나의 디바이스 > 디바이스 등록" 페이지로 이동합니다.
- 위에서 device 실행 시 사용한 `config.js`의 디바이스 아이디(cse_ID)와 passCode를 개별등록에 입력하고 `디바이스 정보확인` 버튼을 누릅니다.
- 필수정보 입력화면에 내용을 해당 내용을 넣어준 후 하단 '저장'버튼을 누르면 ThingPlug에 Device 등록이 완료됩니다. 

## Application 실행
`node application.js` 명령어로 application을 실행합니다. (Application 실행하기 전에 `device.js`가 동작하는 상태로 유지합니다. 따라서 `device.js` 실행을 종료하지 않고 새로운 terminal(커맨드창)을 열어 실행하세요. 계속 실행이 유지되는 `device.js`와 달리 본 스타트업킷에서는 편의상 `application.js`는 한번 실행 후 종료하도록 되어있습니다.)

```
≫ node application.js 
1. latest contentInstance 조회
content : 13
resouceId : CI00000000000000034932
생성일 : 2015-08-16T13:01:10+09:00
2. mgmtCmd 제어 요청
content-location: http://61.250.21.212:9000/ThingPlug/remoteCSE-000.0000.00000.0000.00000/mgmtCmd-mgmtCmd_1/execInstance-EI00000000000000000517
resouceId : EI00000000000000000517
execStatus : 2
#. execInstance 리소스 조회
resouceId : EI00000000000000000517
execStatus : 3

```

실행 후 `device.js`가 실행중인 터미널을 살펴보면 application이 보낸 mgmtCmd에 대한 아래와 같은 MQTT 로그가 보일 것입니다.

```
#####################################
MQTT 수신 mgmtCmd Name : mgmtCmd_1
extra : request
#####################################
#####################################
처리한 resouceId : EI00000000000000000517
처리한 결과 execStatus : 3
#####################################
```

#### Application 하는 일

 구분  | 설명 | HTTP Method
-------|----|---
1. Content Instance 조회 | 기록된 Content Instance를 조회합니다. | GET
2. mgmtCmd execInstance 생성 | Device로 보낼 제어 명령을 oneM2M에게 보냅니다. | POST
3. mgmtCmd execInstance 조회 | Device로 보낸 제어 명령의 상태를 조회 합니다. | GET

## 환영합니다. 당신은 이제 oneM2M IoT입니다.
어떠세요? 벌써 Starter Kit을 이용하여 SK ThingPlug oneM2M기반의 IoT에 필요한 구성요소를 준비 완료했습니다. 이제 Application과 Device의 코드를 시작점으로 원하는 서비스를 만들어보세요. 서비스를 개발해 나가는 과정에서 생겨나는 궁금증은 [ThingPlug 개발자 커뮤니티](https://sandbox.sktiot.com/IoTPortal/cmmnty/cmmntyList)를 이용해주세요.


## FAQ
#### `node application` 실행 시  mgmtCmd부분에서 `statusCode:400`에러가 발생합니다.
ThingPlug사이트에서 디바이스의 CSE_ID와 passCode를 입력하여 자신의 계정에 등록을 해야 합니다. 이 등록과정 이후에 `사용자 인증키`를 통해서 디바이스에 접근이 가능합니다.

#### `node application` 실행 시  mgmtCmd부분에서 `statusCode:404`에러가 발생합니다.
device먼저 실행한 후 application.js를 실행해야합니다. [config.js 수정](https://github.com/SKT-ThingPlug/thingplug-starter-kit#configjs-수정)부분 부터 다시 따라 해보세요.

#### device 실행 시 마다 매번 CSE_ID를 등록해야하는 건가요?
아닙니다. 디바이스마다 최초 1회만 CSE_ID를 등록하면 됩니다. 본 스타터킷에서는 디바이스 실행 시 매번 CSE_ID를 등록하도록 되어 있습니다. 이 경우에도 문제가 되는 것은 아닙니다. 단 이 경우 403 Fobidden Status와 함께 device key가 바뀝니다.

#### 마이페이지에 사용자 인증키가 없는데요?
ThingPlug 회원가입 입력양식에 있는 디바이스 연동 프로토콜 선택을 반드시 HTTP로 선택해야 합니다. 그렇지 않을 경우 oneM2M API를 이용할 수 없습니다. 가입시에만 선택이 가능하기 때문에 새로운 아이디로 새 계정을 만들고 가입 입력양식에서 꼭 HTTP로 선택해주세요. 
