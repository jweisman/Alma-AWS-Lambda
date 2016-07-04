var nconf = require('nconf');
var utils = require('./utilities.js');

// Load configuration
nconf.env()
   .file({ file: './config.json' });

// Expects:
// {"sms":{"msg":"XX","to":"+14125551212"}}

exports.process = function(data, callback) {
	var sms = data.sms;
	utils.sendSms(sms.to, sms.msg, callback);
}