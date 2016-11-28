'use strict';

var request = require('request');
var dom = require('xmldom').DOMParser;
var xpath = require('xpath');

var forbidden = {statusCode: 403, body: '403: Forbidden'};

exports.handler = function(event, context) {
	var format = event.headers['Accept'] || 'application/xml';
	var path = event.path.substring(event.path.indexOf('/', 1));

	var apikey = process.env['APIKEY'];
	var vendor;
	try {
 		vendor = (event.queryStringParameters && event.queryStringParameters.apikey) || event.headers['Authorization'].split(" ")[1];	
		vendor = require('jsonwebtoken').verify(vendor, process.env['JWT_SECRET']).vendor;
		console.log('vendor', vendor);
	} catch (e) {
		console.log('Error while validating vendor code:', e.message);
		return context.succeed(forbidden);
	}

	if (path.startsWith('/acq/po-lines/PO')) {
		if (event.httpMethod == 'GET') {
			almaRequest(path, event.httpMethod, event.body, format, apikey,
				function(err, response) {
					if (err) return context.succeed(response);
					if (!validateVendor(response.body, vendor))
						return context.succeed(forbidden);
					else context.succeed(response);
				});
		} else if (event.httpMethod == 'POST') {
			if (!validateVendor(response.body, vendor))
				return context.succeed(forbidden);
			almaRequest(path, event.httpMethod, event.body, format, apikey, 
				(err, response) => { return context.succeed(response); }
			);
		} else if (event.httpMethod == 'PUT') {
			almaRequest(path, 'GET', null, format, apikey,
				function(err, response) {
					if (err) return context.succeed(response);
					if (!validateVendor(response.body, vendor))
						return context.succeed(forbidden);
					else {
						almaRequest(path, event.httpMethod, event.body, format, apikey,
							(err, response) => { context.succeed(response); }
						);						
					}
				});
		} else {
			return context.succeed(forbidden);
		}
	} else if (path.startsWith('/acq/funds') ||
						 path.startsWith('/conf/libraries')) {
		almaRequest(path, event.httpMethod, event.body, format, apikey,
			(err, response) => { return context.succeed(response); }
		);
	} else {
		return context.succeed(forbidden);
	}
};

function validateVendor(po, v) {
	var vendor; 
	try {
		var isXml = po.charAt(0) == '<';
		if (isXml) {
			var doc = new dom().parseFromString(po);
	 		var select = xpath.useNamespaces();
	  	var nodes = select('/po_line/vendor/text()', doc);
	  	vendor = nodes[0].toString();
	  } else {
			vendor = JSON.parse(response.body).vendor.value;
		}
		return vendor.toLowerCase() == v.toLowerCase();
	} catch (e) {
		console.log("Could not parse PO:", e.message)
		return false;
	}
}

function almaRequest(path, method, data, format, apikey, callback) {
  var headers = {
  	'Authorization': 'apikey ' + apikey,
  	'Accept': format
  };
  
  if (method != 'GET') {
    headers['Content-Type'] = format;
    headers['Content-Length'] = data.length;
  }

  var options = {
    uri: 'https://api-na.hosted.exlibrisgroup.com/almaws/v1' + path,
    method: method,
    headers: headers,
    body: data
  };

  console.log('options', options);

  request(
  	options,
  	function(err, response, body) {
  		if (err) { console.log(err); return callback(err); }
  		if (response.statusCode.toString().match(/^[4-5]\d\d$/))
  			err = new Error('Error from Alma', body);
  		callback(err, { statusCode: response.statusCode, 
  			headers: {
  				"Content-type": response.headers['content-type']
  			},
  			body: body });
  	});
}