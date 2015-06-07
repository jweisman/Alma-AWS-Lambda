/*
Listener logic:
* Check if queue exists
* If not, create and subscribe to topic
* Long polling receive
* For each message:
** Validate institution in header
** Read message and process according to type
** For thumbnails:
*** Download file
*** Find file record according to path in key
*** Update thumbnail in DB
*/

var AWS = require('aws-sdk');
var fs  = require('fs');
var async = require('async');

var region = "us-east-1"; // default, set based on instance
var topic  = 'aws-alma';

AWS.config.region = region;
var s3 = new AWS.S3();
var sqs = new AWS.SQS();

// queue name based on instance
var q_name = topic + '-default'; // hard-coded for demo
var q_url;
	
function listen() {
	log('listening...');
	sqs.receiveMessage({
			"WaitTimeSeconds": 20,
			"MaxNumberOfMessages": 10,
			"VisibilityTimeout": 30,				
			"QueueUrl": q_url,
			"AttributeNames": ["inst"]
		}, receiveMessages);	
}	

function receiveMessages(err, data) {
		if (err) log("handleSqsResponse error:" + err);
		if (data && data.Messages) {
			log('received');
			data.Messages.forEach(processMessage)		
			listen();
		} else {log('no messages...'); listen(); }
}

function processMessage(message) {
	var msgObj = JSON.parse(message.Body);
	// Process
	log(msgObj.Message);
	var msg = JSON.parse(msgObj.Message);
	switch (msg.action) {
		case 'receiveThumbnail':
			receiveThumbnail(msg.bucket, msg.key, deleteMessage(message.ReceiptHandle));
			break;
		default:
			log('unknown action:' + msg.action);
	}
}

function deleteMessage(handle) {
	// Delete message from queue after processing
	sqs.deleteMessage({
   		"QueueUrl" : q_url,
   		"ReceiptHandle" : handle
   	}, function(err, data){	if(err) log(err);}); 	
}

function receiveThumbnail(bucket, key, callback) {
	log('receiving thumbnail ' + bucket + ", " + key);
	async.waterfall([
		function download(next) {
			// Download the image from S3 into a buffer.
			s3.getObject({
				Bucket: bucket,
				Key: key
			},
			next);
		},
		function writeFile(response, next) {
			var fileName = key.substring(key.lastIndexOf('/')+1);
			var homeDir = 
				(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE);
			var localFile = homeDir + "/Downloads/thumbnails/" + fileName;
			log('writing file ' + localFile);
			fs.writeFile(localFile,
				response.Body,
				next);
		},
		function deleteThumbnail(next) {
			log('deleting ' + key);
			s3.deleteObject({
				Bucket: bucket,
				Key: key
			},
			next);
		}
		], function (err) {
		if (err) {
			console.error(err);
		} else {
			callback;
		}
	});
}


function log(msg) {
	var dt = new Date();
	console.log(dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" +
		("0" + dt.getDate()).slice(-2) + 
		" " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() +
		":" + dt.getMilliseconds() + " " + msg);
	
}

// Main

// get queue url
sqs.getQueueUrl( { QueueName : q_name }, function(err, data) {
	if (err) {
		// if queue does not exist, create it and subscribe to 
		log(err);
	} else {  
		q_url = data.QueueUrl;
		log("starting listening on " + q_url); 
		listen();
	}
}); 
