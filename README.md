![ThingPlug logo](https://github.com/SKT-ThingPlug/thingplug-starter-kit/raw/master/images/thingplug--onem2m-logo.png)
# SKT ThingPlug oneM2M Starter Kit
본 Starter Kit은 SKT의 ThingPlug에서 제공하는 IoT 국제 표준인 oneM2M API를 이용하여 IoT 서비스를 제작하는 가장 기초적인 방법을 구현해둔 프로젝트 입니다.
본 프로젝트를 통하여 SKT의 ThingPlug oneM2M API를 활용하는 방법을 쉽게 이해하고, 다양한 IoT 서비스 개발을 Starter Kit에서부터 시작해보세요.

## oneM2M의 구성과 Starter Kit의 목적
oneM2M에서는 역할에 따라 구성원을 다음 세 가지로 구분할 수 있습니다.

![oneM2M 구성과 주요 요청](https://github.com/SKT-ThingPlug/thingplug-starter-kit/raw/master/images/sequence_flow.png)

- 애플리케이션 클라이언트 (Application)
- 디바이스 클라이언트 (Device)
- oneM2M API를 제공하는 ThingPlug 서버 (ThingPlug)

애플리케이션과 디바이스는 직접적으로 통신하지 않고 각 구성원들은 기본적으로 ThingPlug가 제공하는 oneM2M 표준 기반의 REST API를 통해 oneM2M 서버와 통신을 하게 됩니다. 해당 API를 통해 제공되는 IoT의 공통적인 기능(예, 데이터 저장, 장치 관리, 장치 등록 등)은 디바이스와 애플리케이션의 개발자들이 좀 더 쉽게 IoT 서비스를 개발할 수 있는 환경을 제공합니다.

본 Starer Kit이 제공되는 목적은 첫째로는 애플리케이션과 디바이스가 최소한의 IoT 서비스 기능을 할 수 있도록 ThingPlug 서버가 제공하는 API를 활용하는 방법을 익히고, 두번째로는 ThingPlug에서 제공하는 oneM2M을 직접 경험해 봄으로써 oneM2M 표준을 이해하는 것입니다.

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
ThingPlug oneM2M을 이용하기 위해서는 ThingPlug 계정이 필요합니다. ThingPlug 회원가입 시 사용할 디바이스 연동 프로토콜을 반드시 HTTP로 선택해야 합니다. HTTP로 선택하지 않고 이미 계정을 만드셨다면 다른 계정을 하나 더 만들어서 진행하세요.

#### 코드 복사

코드는 Release된 [Zip파일](https://github.com/SKT-ThingPlug/thingplug-starter-kit/archive/master.zip)을 다운 받아서 임의에 폴더에 압축을 해제하세요. 또는 아래 명령어를 이용하여 github의 master 버전을 clone해도 됩니다.

```
git clone https://github.com/SKT-ThingPlug/thingplug-starter-kit.git
```

복사된 폴더 안을 살펴보면 다음과 같은 주요파일이 있습니다.

- `device.js` : 실제 IoT Device에서 구동이 가능한 코드 입니다. Node.js로 구현되어 있어 Node.js가 실행 가능한 컴퓨터에서 실행가능하며 [BeegleBone Black](http://beagleboard.org/black) 같이 Node.js를 구동할 수 있는 IoT Device에서 직접 실행이 가능합니다.
- `application.js` : `device.js`에서 ThingPlug로 전송한 데이터를 이용하는 주체로써 사용자와의 접점으로 데이터를 사용자에게 보여주거나 사용자로부터 어떠한 명령을 받아 ThingPlug 서버를 통해 실제 device를 제어하기도 합니다.
- `application_web.js` : Express.js를 사용한 Web API 서버로 Sample Web Application에서 호출하는 backend 서버의 역할을 합니다. `device.js`에서 ThingPlug로 전송한 데이터를 사용자에게 보여주거나 웹페이지로부터 명령을 받아 ThingPlug 서버를 통해 실제 device를 제어하기도 합니다.
- `lib/` : ThingPlug Open API와 MQTT 채널 관리에 필요한 공통 라이브러리로서 실제 디바이스 및 애플리케이션 개발 시 참조하는 목록입니다.
- `public/` : Sample Web Application의 html, css, javascript 등 정적 파일 목록입니다.
- `config.js` : 개발자 인증키와 디바이스 ID등 스타터킷 실행에 앞서 필요한 환경 값을 가지고 있습니다. 각자의 상황에 맞게 수정이 필요합니다. [config.js 수정참고 섹션](https://github.com/SKT-ThingPlug/thingplug-starter-kit#configjs-수정)


#### 프로젝트 dependency 설치
Starter Kit을 통해서 실행하는 device와 application은 Node.js로 구현되어 있으며 실행에 필요한 dependency 정보는 package.json에 기입되어 있습니다. 따라서 위에서 복사한 starter kit 폴더(package.json이 존재하는 폴더)로 이동 후 `npm install` 명령어를 통해 dependency 설치하세요.

```
cd thingplug-starter-kit
npm install
```

### config.js 수정
Starter Kit이 실질적으로 동작하기 위해서는 개발자 계정정보 및 디바이스 정보를 개발자 상황에 맞게 수정해야합니다. `config.js_sample`파일을 `config.js`파일로 복사한 후 `config.js`를 에디터에서 열고 각 항목 오른쪽에 달린 주석 설명과 아래 설명을 참고하여 수정하세요.

#### CSE_ID 란?

CSE_ID는 디바이스를 oneM2M에서 구분하기 위해 주민번호처럼 디바이스마다 부여되는 고유의 식별자입니다. 스타터킷을 위한 CSE_ID는 `0.2.481.1.101.[Personal Phone Number]`이며 마지막 '[Personal Phone Number]'가 시리얼번호에 해당합니다. 다른 디바이스와 겹치지 않기 위해 Starter Kit을 실행하시고자 하는 개발자의 핸드폰 번호를 입력해주세요.

```javascript
module.exports = {
  uKey : 'USER_KEY_FROM_SANDBOX.SKIOT.COM', // Thingplug(https://sandbox.sktiot.com) 로그인 후, `마이페이지`에 있는 사용자 인증키
  nodeID : '0.2.481.1.101.01000000000', // Device 구분을 위한 ID  (본 예제에서는 맨 뒷자리를 핸드폰 번호 사용 권장)
  passCode : '000101', // ThingPlug에 Device등록 시 사용할 Device의 비밀번호 (본 예제에서는 생년월일 사용 권장)
  appID : 'myApplication', //Application의 구분을 위한 ID
  containerName:'myContainer', // starter kit에서 생성하고 사용할 container 이름 (임의지정)
  mgmtCmdPrefix : 'myMGMT', // starter kit에서 생성하고 사용할 제어 명령 이름 접두사 (임의지정)
  cmdType : 'senser_1' // starter kit에서 사용할 제어 타입 (임의지정)
};
```

### Device 실행
`node device` 명령어로 Device를 실행하면 다음과 같은 결과 화면이 나오면 정상입니다.

```
$ node device
### ThingPlug Device ###
1. node 생성 요청
node 생성 결과
생성 node Resource ID : ND00000000000000000270
2. remoceCSE 생성 요청
remoteCSE 생성 결과
다비이스 키 : VGJVMDdzVFl2YTBOZFBIMGlwUDdlZksvbVF5dWExRGNHK2cyaW9zOEY4R215QTU0bW9MSmt3QlZYejJ2VGJCbg==
content-location: /ThingPlug/remoteCSE-0.2.481.1.101.01012341234
3. container 생성 요청
container 생성 결과
content-location: /ThingPlug/remoteCSE-0.2.481.1.101.01012341234/container-myContainer
4. mgmtCmd 생성 요청
mgmtCmd 생성 결과
content-location: /ThingPlug/mgmtCmd-myMGMT0.2.481.1.101.01012341234
5. content Instance 주기적 생성 시작
6. 제어 명령 수신 MQTT 연결
### mqtt connected ###
content : 35, resourceID : CI00000000000000710830
content : 25, resourceID : CI00000000000000710831
content : 18, resourceID : CI00000000000000710832
...
```

#### Device가 하는 일

 구분  | 설명 | HTTP Method
-------|----|---
1. node 생성 | 물리적 Device를 등록합니다. | POST
2. remoteCSE 생성 | 서비스 등록 및 서비스에서 발생되는 데이터를 저장하기 Resource를 생성하고, remoteCSE ID와 passCode를 oneM2M 서버에 등록합니다. | POST
3. 컨테이너 생성 | 데이터를 저장해둘 container를 생성합니다. 파일시스템의 폴더와 같은 역할을 합니다. | POST
4. mgmtCmd 생성 | 디바이스에서 받아들일 수 있는 제어 명령어를 포함하는 자원을 생성 합니다. 이 생성된 명령어 이름은 Application이 제어 명령을 내릴 때 사용합니다. | POST
5. Content Instance 생성 | 일반적으로 센서의 측정값을 지정한 컨테이너에 기록합니다. | POST
6. MQTT 연결 | 현재 ThingPlug는 Application에서 oneM2M에게 전달된 제어명령(mgmtCmd) execInstance를 전달받는 방법으로 MQTT를 사용할 수 있습니다.(oneM2M표준사항은 아님) ThingPlug MQTT와 연결합니다. | -
7. execInstance 갱신 | MQTT등을 통해 전달받은 execInstance의 결과를 갱신합니다. | PUT

### ThingPlug에 내 계정에 Device를 등록
애플리케이션에서 ThingPlug oneM2M REST API를 통해 데이터를 필요에 따라 제어명령을 보내기 위해서는 먼저 ThingPlug 사이트에 위 device(생성된 remoteCSE)를 등록해야합니다.

- [ThingPlug](https://thingplug.sktiot.com) 로그인 후 "마이페이지 > 나의 디바이스 > 디바이스 등록" 페이지로 이동합니다.
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
content-location: https://sandbox.sktiot.com:9000/ThingPlug/remoteCSE-000.0000.00000.0000.00000/mgmtCmd-mgmtCmd_1/execInstance-EI00000000000000000517
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

## Web Application 실행
`node application_web.js` 명령어로 Express.js 서버를 실행합니다. 
이제 웹 브라우저를 열어서 실행 중인 서버의 IP로 접속하여 Dashboard를 실행합니다.
가상 센서를 위한 Dashboard는 http://SERVER_IP:3000/dashboard 이며, 
가상 센서값을 Dashboard에 표시하기 위해서는 `node device.js` 를 실행하며, 가상으로 에어컨을 제어하여 온도값의 변화를 나타내는 예시입니다. 
### Intel Edison 보드 지원
Intel Edison 보드 + Grove Kit 에 대한 샘플 코드를 지원합니다. example 폴더에 관련 파일이 존재합니다.
Edison 보드 예제를 실행하기 위해서는 필요한 모듈을 추가 설치해야 합니다.
```
npm install johnny-five edison-io
```
Intel Edison 보드의 센서값을 확인하기 위한 Dashboard는 http://SERVER_IP:3000/dashboard/edison.html 입니다. Intel Edison 보드의 센서값을 Dashboard에 표시하기 위해서는 `node example/edison/device.js` 를 실행해야 합니다.  Intel Edison 보드는 Grove Kit에 버튼, LED, 조도 센서를 부착한 경우에 대한 예제이며, PIN 매핑을 `example/edison/device.js` 파일을 열어 실제 부착한 센서의 PIN 번호로 변경해야 합니다.
Default PIN 매핑은 하기와 같습니다.
```
module.exports = {
  'board' : 'edison',
  'sensor' : [
    {
      'name' : 'light_1',
      'category' : 'light',
      'pin' : 'A0'
    },
    {
      'name' : 'button_1',
      'category' : 'button',
      'pin' : 5
    },
    {
      'name' : 'led_1',
      'category' : 'led',
      'pin' : 3
    }
  ]
}
```


## 환영합니다. 당신은 이제 oneM2M IoT입니다.
어떠세요? 벌써 Starter Kit을 이용하여 SK ThingPlug oneM2M 기반의 IoT에 필요한 구성요소를 준비 완료했습니다. 이제 Application과 Device의 코드를 시작점으로 원하는 서비스를 만들어보세요. 서비스를 개발해 나가는 과정에서 생겨나는 궁금증은 [ThingPlug 개발자 커뮤니티](https://thingplug.sktiot.com)를 이용해주세요.

##Starter Kit에 대한 상세한 내용은 ThingPlug 가이드북을 참고하세요.
[ThingPlug로 시작하는 IoT 서비스 개발](http://book.naver.com/bookdb/book_detail.nhn?bid=9766474)를 참고하세요.

## FAQ
#### `node application` 실행 시  mgmtCmd부분에서 `statusCode:400`에러가 발생합니다.
ThingPlug사이트에서 디바이스의 CSE_ID와 passCode를 입력하여 자신의 계정에 등록을 해야 합니다. 이 등록과정 이후에 `사용자 인증키`를 통해서 디바이스에 접근이 가능합니다.

#### `node application` 실행 시  mgmtCmd부분에서 `statusCode:404`에러가 발생합니다.
device먼저 실행한 후 application.js를 실행해야합니다. [config.js 수정](https://github.com/SKT-ThingPlug/thingplug-starter-kit#configjs-수정)부분 부터 다시 따라 해보세요.

#### device 실행 시 마다 매번 CSE_ID를 등록해야하는 건가요?
아닙니다. 디바이스마다 최초 1회만 CSE_ID를 등록하면 됩니다. 본 스타터킷에서는 디바이스 실행 시 매번 CSE_ID를 등록하도록 되어 있습니다. 이 경우에도 문제가 되는 것은 아닙니다. 단 이 경우 403 Fobidden Status와 함께 device key가 바뀝니다.

#### 마이페이지에 사용자 인증키가 없는데요?
ThingPlug 회원가입 입력양식에 있는 디바이스 연동 프로토콜 선택을 반드시 HTTP로 선택해야 합니다. 그렇지 않을 경우 oneM2M API를 이용할 수 없습니다. 가입시에만 선택이 가능하기 때문에 새로운 아이디로 새 계정을 만들고 가입 입력양식에서 꼭 HTTP로 선택해주세요.

