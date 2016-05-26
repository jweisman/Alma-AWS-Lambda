var async = require("async");
var AWS = require('aws-sdk');
var nconf = require('nconf');
var jwt = require('jsonwebtoken');

var utils = require('./utils.js');

// Load configuration
nconf.env()
	.file({
		file: './config.json'
	});

var bucket = nconf.get("bucket");
var prefix = nconf.get("prefix") + "verified/";
var verification = nconf.get("verification");

exports.tokenLink = function(email, messageId) {
	return verification.link + "?token=" +
		jwt.sign({
			email: email,
			messageId: messageId
		}, verification.secret, {
			expiresIn: '1h'
		});
}

exports.verify = function(token, callback) {
	console.log('verifying user');
	// Verify token
	var payload = jwt.verify(token, verification.secret);

	// Save email address
	var s3 = new AWS.S3();
	s3.upload({
			Bucket: bucket,
			Key: prefix + utils.hash(payload.email),
			Body: ' '
		},
		// Run function again		 
		function(err, data) {
			// derive region name
			var lambda = new AWS.Lambda({
				region: 'us-east-1'
			});

			// Set up message for Lambda call
			var event = {
				Records: [{
					ses: {
						mail: {
							messageId: payload.messageId
						}
					}
				}]
			};

			lambda.invoke({
					FunctionName: verification.lambdaName,
					InvocationType: 'Event',
					Payload: JSON.stringify(event)
				},
				callback
			);
		}
	);
}

exports.isUserVerified = function(email, callback) {
	var s3 = new AWS.S3();
	s3.headObject({
		Bucket: bucket,
		Key: prefix + utils.hash(email)
	}, function(err, data) {
		if (err && err.code === 'NotFound') {
			callback(false);
		} else callback(true);
	});
}