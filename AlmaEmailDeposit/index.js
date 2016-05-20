// dependencies
var async = require('async');
var nconf = require('nconf');
var crypto = require('crypto');
var fs = require("fs");
var alma = require('./alma.js');
var utils = require('./utils.js');
var path = require('path');
var request = require('request');

var CRLF = '\r\n';

// Load configuration
nconf.env()
   .file({ file: './config.json' });

var mailParser = require("./parse_email.js");

var apikey = nconf.get('api_key');
var sworduri = nconf.get('sworduri');

var bucketName = "exl-dev-scratch";
var prefix = "email/deposit/"
var tmpDir 		= "/tmp/"; 

var emailOptions = {
	host:	nconf.get('smtp_host'), 
  user:	nconf.get('smtp_user'), 
  pass:	nconf.get('smtp_pass'), 
  from:	nconf.get('smtp_from')
}

exports.handler = function(event, context) {
	var _userId;
	var _email;

  console.log('Processing email');
  var sesNotification = event.Records[0].ses;
  var messageId = sesNotification.mail.messageId;

	async.waterfall([  
    // Retrieve the email from your bucket
    function getFile(next) {
    	utils.downloadFile(bucketName, prefix + messageId, 
    		tmpDir, next);
  	},
  	function parseMail(filename, next) {
  		console.log('parsing email', filename);
  		mailParser.parseEmail(filename, next);
  	},
  	function getUser(mail, next) {
  		_email = mail;
  		console.log("Searching for user with email ", _email.from, _email.subject);
  		alma.get("/users?q=email~" + _email.from.toLowerCase(), next);
  	},
  	function validateUser(resp, next) {
  		if (resp.total_record_count == 0) {
	  		utils.sendEmail(
	  			emailOptions,
	  			_email.from, 
	  			"Re: " + _email.subject,
	  			"Hi. Just wanted to let you know that your " +
	  			  "email address was not recognized so " +
	  			  "we could not process your deposit.", 
	  			function(err) { context.done(err || "USER_NOT_FOUND"); }
	  		);							
			} else {
  			console.log("User found:", resp.user[0].primary_id);
  			_userId = resp.user[0].primary_id;
  			next();
  		}
  	},
  	function zipFiles(next) {
  		if (_email.attachments.length == 0) 
  			next("No attachment found");
  		else	
  			utils.zip(_email.attachments, path.join(tmpDir, messageId + ".zip"), next);
  	},
  	function sendRequest(zip, next) {
			var md = getEntry(
				_email.from, _email.subject, _email.text
			);

			console.log("md", md);
  		headers = {
  			"In-Progress": false,
  			"On-behalf-of": _userId
  		}
  		console.log("Headers: ", JSON.stringify(headers, null, 2));

  		var options = {
  			url: sworduri,
  			method: 'POST',
				auth: {
					user: 'sword',
					pass: apikey
				},
  			headers: headers,
  			multipart: [
		      {
		        'content-type': 'application/atom+xml; charset="utf-8"',
	        	'content-disposition': 'attachment; name=atom',
		        body: md
		      },
		      {
		      	'content-type': 'application/zip',
		      	'content-disposition': 'attachment; name=payload; filename=' + path.basename(path.join(tmpDir, messageId + ".zip")),
		      	'Content-Transfer-Encoding': 'base64',
		      	'Packaging': 'http://purl.org/net/sword/package/SimpleZip',
		      	body: utils.base64_encode(zip)
		      }
  			]
  		};
  		console.log('sending request')
  		request(options, next);
		},
  	function processResponse(response, body, next) {
  		console.log("processing response");
  		console.log(body);
			var dom = require('xmldom').DOMParser
			var doc = new dom().parseFromString(body)
			var mms_id = doc.getElementsByTagName('verboseDescription')[0]
				.childNodes[0].nodeValue;
 			console.log("mms_id", mms_id);
 			next(null, mms_id);
		},
		function sendEmail(mms_id, next) {
			console.log("in sendEmail");
  		utils.sendEmail(
  			emailOptions,
  			_email.from, 
  			"Re: " + _email.subject,
  			"Hi. Just wanted to let you know that your " +
  			  "deposit has been processed. You can access it at " +
  			  "the URL below. Thanks." + CRLF + CRLF +
  			  nconf.get('deposit_url') + mms_id, 
  			next
  		);
  	}
		], function (err, result) {
				if (err) { console.error(err); }
				else context.done(err,"Done");
			}
		);
};

function getEntry(creator, title, abstract) {
	var builder = require('xmlbuilder');
	var xml = builder.create("entry")
	.att('xmlns', 'http://www.w3.org/2005/Atom')
	.att('xmlns:dcterms', 'http://purl.org/dc/terms/');
	xml.ele('title', title);
	xml.ele('author')
		.ele('name', creator);
	xml.ele('summary', abstract);
	xml.ele('dcterms:abstract', abstract);
	xml.ele('dcterms:title', title);
	xml.ele('dcterms:creator', creator);
  
  return xml.end({ pretty: true});
}