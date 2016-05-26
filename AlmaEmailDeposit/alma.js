var request = require('request');
var nconf = require('nconf');

nconf.env()
  .file({
    file: './config.json'
  });

var host = nconf.get('alma_host');
var path = nconf.get('alma_path');
var apikey = nconf.get('api_key');

function performRequest(endpoint, method, data, callback, format) {
  format = typeof format !== 'undefined' ? format : 'json';
  var dataString = JSON.stringify(data);
  var headers = {
    'Authorization': 'apikey ' + apikey,
    'Accept': 'application/' + format
  };

  if (method != 'GET') {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = dataString.length;
  }

  var options = {
    uri: (endpoint.substring(0, 4) ==
      'http' ? '' : host + path) + endpoint,
    method: method,
    headers: headers
  };

  request(
    options,
    function(err, response, body) {
      if (!err && ('' + response.statusCode).match(/^[4-5]\d\d$/)) {
        console.log('Error from Alma: ' + body);
        var message;
        try {
          var obj = JSON.parse(body);
          message = obj.errorList.error[0].errorMessage + " (" + obj.errorList.error[0].errorCode + ")";
        } catch (e) {
          message = "Unknown error from Alma.";
        }
        err = new Error(message);
      }
      if (err) callback(err);
      else callback(null, body);
    });
}

exports.getXml = function(url, callback) {
  performRequest(url, 'GET', null,
    function(err, data) {
      if (err) callback(err);
      else callback(null, data.toString());
    }, 'xml');
};

exports.get = function(url, callback) {
  performRequest(url, 'GET', null,
    function(err, data) {
      if (err) callback(err);
      else callback(null, JSON.parse(data));
    });
};

exports.post = function(url, data, callback) {
  performRequest(url, 'POST', data,
    function(err, data) {
      if (err) callback(err);
      else callback(null, JSON.parse(data));
    });
};