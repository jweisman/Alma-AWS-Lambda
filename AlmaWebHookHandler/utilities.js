var nconf = require('nconf');

// Load configuration
nconf.env()
   .file({ file: './config.json' });

// *** 
// Helper functions 
//***

exports.sendSms = function(to, msg, callback) {
	console.log("Sending to " + to + ": " + msg);

	// Twilio setup
	var twilio_account = nconf.get('twilio_account');
	var twilio_token = nconf.get('twilio_token');
	var twilio_number = nconf.get('twilio_number');

	var twilio = require('twilio');
	var client = new twilio.RestClient(twilio_account, twilio_token);	

	client.sms.messages.create({
		to: to.replace(/\+?^/, '\+'),
		from: twilio_number,
		body: msg	
	}, callback);
}