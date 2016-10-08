var Twit = require('twit');
var config = require('./config');
var api = require('./lib/api');
var natural = require('natural');

api.createNode(config.nodeID, function(err,nodeRI){
  if(err) return console.log(err); 
  config.nodeRI = nodeRI;
});

/* Change the config regard to your twitter accounts */
var conf = {
  consumer_key : '...',
  consumer_secret : '...',
  access_token : '...-...',
  access_token_secret : '...'
};

var T = new Twit(conf);
var classifier = buildBayesClassifier();
console.log('The bot is running...');

var stream = T.stream('user');
stream.on('tweet', function(tweet) {
  if (tweet && tweet.text) {
    var words = tweet.text.toLowerCase();
    if (words.indexOf('thingplug') < 0) {
      return console.log('Not thingplug command, ignore it: '+tweet.text);
    }
    else {
      var cmdType = classifier.classify(words);
      console.log('cmdType :'+cmdType+' from msg:'+tweet.text);
      if (cmdType == 'get_temp') {
        postTweetTemperature();
      }
      if (cmdType == 'turn_on') {
        var cmd = JSON.stringify({'cmd':'on'});
        controlVirtualDevice(cmd);
      }
      if (cmdType == 'turn_off') {
        var cmd = JSON.stringify({'cmd':'off'});
        controlVirtualDevice(cmd);
      }
    }
  }
});

function postTweetTemperature() {
  api.getLatestContainer(config.nodeID, config.containerName, function(err,data){
    if(err) {
      console.log(err);
    }
    else{
      T.post('statuses/update', { status :  new Date().getTime()+'Room Temperature:'+data.con }, function (err, data, response) {
      });
    }
  });
}

function controlVirtualDevice(cmd) {
  api.reqMgmtCmd(config.nodeRI, config.command, cmd, function(err,data){
    var reply = {};
    if(err) {
      reply = { status : 'ThingPlug Error :'+err };
    }
    else {
      reply = { status : 'Send Control Message to Device:'+config.nodeID };
    }
    T.post('statuses/update', reply, function (err, data, response) {
    });
  });
}

function buildBasicClassifier() {
  var classifier = new natural.BayesClassifier();
  classifier.addDocument(['get', 'temp', 'temperature'], 'get_temp');
  classifier.addDocument(['turn', 'on'], 'turn_on');
  classifier.addDocument(['turn', 'off'], 'turn_off');
  classifier.train();
  return classifier;
}

function buildBayesClassifier() {
  var classifier = new natural.BayesClassifier();
  classifier.addDocument('on', 'turn_on');
  classifier.addDocument('turn on the light', 'turn_on');
  classifier.addDocument('off', 'turn_off');
  classifier.addDocument('turn off the light', 'turn_off');
  classifier.addDocument('get temp', 'get_temp');
  classifier.addDocument('please let me know the temp', 'get_temp');
  classifier.addDocument('get the temperature', 'get_temp');
  classifier.addDocument('show me the temperature', 'get_temp');
  classifier.train();
  return classifier;
}
