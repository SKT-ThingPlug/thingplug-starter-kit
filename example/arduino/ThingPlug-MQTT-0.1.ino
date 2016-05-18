

/*
  ThingPlug Arduino starter kit
  v0.1
  2016-05-17
*/

#include <avr/pgmspace.h>//for flash Storage
#include <SPI.h>
#include <Ethernet.h>
#include <PubSubClient.h>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////Ethernet Configuration///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Enter a MAC address for your controller below.
// Newer Ethernet shields have a MAC address printed on a sticker on the shield
#if defined(WIZ550io_WITH_MACADDRESS) // Use assigned MAC address of WIZ550io
;
#else
byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};
#endif

IPAddress myIP(192, 168, 0, 177);
EthernetClient ethClient;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////MQTT Configuration///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

char mqttBroker[] = "onem2m.sktiot.com";
int mqttBrokerPORT = 1883;
char mqttConnectID[] = "mqttYourID";

char mqttPubTopic[] = "oneM2M/req/0.2.481.1.101.010phonenum/ThingPlug";
char mqttSubTopic[] = "oneM2M/resp/0.2.481.1.101.010phonenum/+";

void mqttCallBack(char* topic, byte* payload, unsigned int length);
void reconnect();
void CreateLoop();

PubSubClient mqttClient(mqttBroker, mqttBrokerPORT, mqttCallBack, ethClient);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////MQTT PAYLOAD for ThingPlug Connect////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const unsigned char mqttPubCreateNode[] PROGMEM = "<m2m:req xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.onem2m.org/xml/protocols CDT-requestPrimitive-v1_0_0.xsd\"><op>1</op><to>/ThingPlug</to><fr>0.2.481.1.101.010phonenum</fr><ty>14</ty><ri>1234</ri><nm>0.2.481.1.101.010phonenum</nm><cty>application/vnd.onem2m-prsp+xml</cty><pc><nod><ni>0.2.481.1.101.010phonenum</ni></nod></pc></m2m:req>";
//*<ri>ND00000000000000001032</ri> 값 parsing 필요 -> remoteCSE Create할 때, <nl>값으로 설정필요
//* <fr><ni>의 0.2.481.1.101.010phonenum 값 사용자 정의 필요(ThingPlug OID)

const unsigned char mqttPubCreateRemoteCSE[] PROGMEM = "<m2m:req xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.onem2m.org/xml/protocols CDT-requestPrimitive-v1_0_0.xsd\"><op>1</op><to>/ThingPlug</to><fr>0.2.481.1.101.010phonenum</fr><ty>16</ty><ri>1234</ri><passCode>12345</passCode><cty>application/vnd.onem2m-prsp+xml</cty><pc><csr><cst>3</cst><csi>0.2.481.1.101.010phonenum</csi><poa>MQTT|0.2.481.1.101.010phonenum</poa><rr>true</rr><nl>ND00000000000000001032</nl></csr></pc></m2m:req>";
//* <passCode>12345</passCode> 값 사용자 정의 필요
//* <fr><csi><poa>의 0.2.481.1.101.010phonenum 값 사용자 정의 필요(ThingPlug OID)
//* Node Create후 response의 <ri>ND00000000000000001032</ri> 값을 <nl>값으로 설정필요
//* <dKey>64bit based decoding value</dKey> 값 parsing 필요 -> 하위 Create들 실행시 필요

const unsigned char mqttPubCreateContainer[] PROGMEM = "<m2m:req xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.onem2m.org/xml/protocols CDT-requestPrimitive-v1_0_0.xsd\"><op>1</op><to>/ThingPlug/remoteCSE-0.2.481.1.101.010phonenum</to><fr>0.2.481.1.101.010phonenum</fr><ty>3</ty><ri>1234</ri><nm>myContainer</nm><dKey>SU1VRWc4SjRkT1NNRmhwdEdTR3h6OERQdmlCdGdiV05oczZiblZKQ285NDJybmd4clVKVkNSQ3lLRkpnUmtGbQ==</dKey><cty>application/vnd.onem2m-prsp+xml</cty><pc><cnt><lbl>con</lbl></cnt></pc></m2m:req>";
//* <nm>myContainer</nm> 값 사용자 정의 필요
//* <fr><ni>의 0.2.481.1.101.010phonenum 값 사용자 정의 필요(ThingPlug OID)
//* RemoteCSE Create후 response의 <dKey>64bit based decoding value</dKey> 값 설정필요

const unsigned char mqttPubCreateMgmtCmd[] PROGMEM = "<m2m:req xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.onem2m.org/xml/protocols CDT-requestPrimitive-v1_0_0.xsd\"><op>1</op><to>/ThingPlug</to><fr>0.2.481.1.101.010phonenum</fr><ty>12</ty><ri>1234</ri><nm>myMGMT0.2.481.1.101.010phonenum</nm> <dKey>SU1VRWc4SjRkT1NNRmhwdEdTR3h6OERQdmlCdGdiV05oczZiblZKQ285NDJybmd4clVKVkNSQ3lLRkpnUmtGbQ==</dKey><cty>application/vnd.onem2m-prsp+xml</cty><pc><mgc><cmt>sensor_1</cmt><exe>false</exe><ext>ND00000000000000001032</ext></mgc></pc></m2m:req>";
//* <nm>myMGMT0.2.481.1.101.010phonenum</nm> 값 사용자 정의 필요
//* <cmt>sensor_1</cmt>  값 사용자 정의 필요
//* Node Create후 response의 <ri>ND00000000000000001032</ri> 값을 <ext>값으로 설정필요
//* RemoteCSE Create후 response의 <dKey>64bit based decoding value</dKey> 값 설정필요

const unsigned char mqttPubCreateContentInstance[] PROGMEM = "<m2m:req xmlns:m2m=\"http://www.onem2m.org/xml/protocols\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.onem2m.org/xml/protocols CDT-requestPrimitive-v1_0_0.xsd\"><op>1</op><to>/ThingPlug/remoteCSE-0.2.481.1.101.010phonenum/container-myContainer</to><fr>0.2.481.1.101.010phonenum</fr><ty>4</ty><ri>1234</ri><cty>application/vnd.onem2m-prsp+xml</cty> <dKey>SU1VRWc4SjRkT1NNRmhwdEdTR3h6OERQdmlCdGdiV05oczZiblZKQ285NDJybmd4clVKVkNSQ3lLRkpnUmtGbQ==</dKey><pc><cin><cnf>text</cnf><con>45</con></cin></pc></m2m:req>";
//* <to>/ThingPlug/remoteCSE-0.2.481.1.101.010phonenum/container-myContainer</to> 의 container 이름 값 설정필요
//* <cnf>text</cnf>, <con>45</con> 값들 사용자 정의 필요
//* RemoteCSE Create후 response의 <dKey>64bit based decoding value</dKey> 값 설정필요

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////connection Setup ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void setupSerial();
void setupEthernet();
void setupmqttClient();
void setupEthclient();

enum createProcess {
  NODE,
  remoteCSE,
  container,
  MgmtCmd,
  ContentInstance
};
int isWorking = NODE;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////Core Actions/////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void setup() {
  setupSerial();
  setupEthernet();
  setupmqttClient();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void loop()
{
  mqttClient.loop();
  CreateLoop();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////connection SETUP/////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void setupSerial() {
  // Open serial communications and wait for port to open:
  Serial.begin(9600);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void setupEthernet() {
  // start the Ethernet connection:
#if defined(WIZ550io_WITH_MACADDRESS)
  if (Ethernet.begin() == 0) {
#else
  if (Ethernet.begin(mac) == 0) {
#endif
    Serial.println("Failed to configure Ethernet using DHCP");

#if defined(WIZ550io_WITH_MACADDRESS)
    Ethernet.begin(myIP);
#else
    Ethernet.begin(mac, myIP);
#endif
    delay(1000);
  }
  // give the Ethernet shield a second to initialize:
  Serial.print("Ethernet Connected, My IP : ");
  Serial.println(Ethernet.localIP());
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void setupmqttClient() {
  Serial.println("connecting MQTT...");

  if (mqttClient.connect(mqttConnectID)) {
    Serial.println("mqttclient connected");

    if (mqttClient.subscribe(mqttSubTopic)) {
      Serial.println("subscribed");
    }
    else
      Serial.println("Not subscribed");
  }
  else
    Serial.println("Try connecting MQTT...");
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////MQTT Function/////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void mqttCallBack(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
  Serial.println();
  
  switch (isWorking) {
    case  NODE : isWorking = remoteCSE; break;
    case  remoteCSE : isWorking = container; break;
    case  container : isWorking = MgmtCmd; break;
    case  MgmtCmd : isWorking = ContentInstance; break;
    default : break;
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void reconnect() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (mqttClient.connect(mqttConnectID)) {
      Serial.println("MQTT connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
void CreateLoop(){
    if (NODE == isWorking) {
    mqttClient.publish_P(mqttPubTopic, mqttPubCreateNode, strlen_P((char*)mqttPubCreateNode), true);
    Serial.println("Create Node published");
  }
  else if (remoteCSE == isWorking) {
    mqttClient.publish_P(mqttPubTopic, mqttPubCreateRemoteCSE, strlen_P((char*)mqttPubCreateRemoteCSE), true);
    Serial.println("Create remoteCSE published");
  }
  else if (container == isWorking) {
    mqttClient.publish_P(mqttPubTopic, mqttPubCreateContainer, strlen_P((char*)mqttPubCreateContainer), true);
    Serial.println("Create Container published");
  }
  else if (MgmtCmd == isWorking) {
    mqttClient.publish_P(mqttPubTopic, mqttPubCreateMgmtCmd, strlen_P((char*)mqttPubCreateMgmtCmd), true);
    Serial.println("Create MgmtCmd published");
  }
  else if (ContentInstance == isWorking) {

    mqttClient.publish_P(mqttPubTopic, mqttPubCreateContentInstance, strlen_P((char*)mqttPubCreateContentInstance), true);
    Serial.println("Create ContentInstance published");
  }
  delay(1000);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
