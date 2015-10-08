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
          data: chunk
        });
      });
      if(res.statusCode!==200 && res.statusCode!==201 && res.statusCode!==409){
        // console.log(res);
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
      req.write(args.body);
    }
    req.end();
  });
}
