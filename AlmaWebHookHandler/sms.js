var nconf = require('nconf');
var twilio = require('twilio');

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

// Expects:
// {"sms":{"msg":"XX","to":"+14125551212"}}

exports.process = function(data, callback) {
	var sms = data.sms;
	sendSms(sms.to, sms.msg, callback);
}