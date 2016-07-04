// dependencies
var async = require('async');
var nconf = require('nconf');
var crypto = require('crypto');

// Load configuration
nconf.env()
   .file({ file: './config.json' });

// *** 
// Lambda function
// ***

var secret = nconf.get('secret');

exports.handler = function(event, context) {
	console.log("Message received: " + JSON.stringify(event.body));
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
			try {
				var processor = require("./" + data.action.toLowerCase() + ".js");
				processor.process(data, next);
			} catch(err) {
				if (err.code == 'MODULE_NOT_FOUND') 
					next("Invalid action.");
				else next(err);
			}
		},
		], function (err, result) {
				if (err) { console.error(err) }
				context.done(err,"Done");
			}
		);
};