// dependencies
var async = require('async');
var AWS = require('aws-sdk');
var util = require('util');
var alma = require('./alma.js');
var twilio = require('twilio');
var nconf = require('nconf');
var crypto = require('crypto');

// Load configuration
nconf.env()
   .file({ file: './config.json' });

// Twilio setup
var twilio_account = nconf.get('twilio_account');
var twilio_token = nconf.get('twilio_token');
var twilio_number = nconf.get('twilio_number');
var client = new twilio.RestClient(twilio_account, twilio_token);

// *** 
// Helper functions 
//***

function sendSms(to, msg, callback) {
	console.log("Sending to " + to + ": " + msg);
	client.sms.messages.create({
		to: to,
		from: twilio_number,
		body: msg	
	}, callback);
}

// *** 
// Lambda function
// ***

var resp = {};
var secret = nconf.get('secret');

exports.handler = function(event, context) {
	async.waterfall([
		function validateSignature(next) {
			var body = event.body;
			var hash = crypto.createHmac('SHA256', secret)
				.update(JSON.stringify(body))
				.digest('base64');
			if (hash != event.signature) next("Signature invalid");
			else next(null, body)
		},
		function routeMessage(data, next) {
		  switch(data.action) {
		    case 'challenge':
	        if (!data.challenge) context.fail("Invalid challenge")
	        resp["challenge"] = data.challenge;
	        break;
		    case 'sms':
					sendSms(data.sms.to, data.sms.msg, next);		    
	        break;
		    default:
		      next("Invalid action")
		  }
		},
		], function (err, result) {
				if (err) { console.error(err) }
				context.done(err,resp);
			}
		);
};