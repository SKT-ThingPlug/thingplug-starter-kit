var http = require('http');

/** http request를 promise로 사용하기 위한 함수 */
exports.request = function(args){
  args = args || {};
  return new Promise(function(resolve, reject){
    var req = http.request(args.options,function(res){
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        resolve({
          statusCode : res.statusCode,
          headers : res.headers,
          data: chunk,
          requestArgs : args
        });
      });
      if(res.statusCode!==200 && res.statusCode!==201 && res.statusCode!==409){
        reject({ 
          statusCode : res.statusCode,
          error: 'statusCode is '+res.statusCode,
          options: args.options,
          responseHeader : res.headers
        });
      }
    });
    req.on('error',function(e){
      reject({
        error: e, 
        options: args.options
      });
    });
    if(args.body){
      if(typeof args.body == 'string'){
        req.write(args.body);
      }else{
        req.write(JSON.stringify(args.body));
      }
    }
    req.end();
  });
}
