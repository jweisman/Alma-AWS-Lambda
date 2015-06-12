// Code based on:
// http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-s3-events-adminuser-create-test-function-create-function.html

// dependencies
var async = require('async');
var AWS = require('aws-sdk');
var gm = require('gm')
            .subClass({ imageMagick: true }); // Enable ImageMagick integration.
var util = require('util');
var fs  = require('fs');
var child_process = require('child_process');

process.env['PATH'] += ':' + process.env['LAMBDA_TASK_ROOT'];

// constants
var MAX_WIDTH  = 100;
var MAX_HEIGHT = 100;
var DST_BUCKET = 'exl-dev-scratch';
var TOPIC_NAME = 'aws-alma';

// get reference to S3 client 
var s3 = new AWS.S3();

// global variables
var topicArn;
 
exports.handler = function(event, context) {
	// Read options from the event.
	console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
	var srcBucket = event.Records[0].s3.bucket.name;
	// Object key may have spaces or unicode non-ASCII characters.
    var srcKey    =
    decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));  
	var dstBucket = DST_BUCKET;
	var dstKey    = "thumbnails/" + srcKey;
	var downloadPath = "/tmp/" + srcKey.replace(/\//g,'-');
	var region    = "us-east-1"; // default
	var inst 	  = srcKey.substring(0,srcKey.indexOf('/'));

	// Sanity check: validate that source and destination are different buckets.
	if (srcBucket == dstBucket) {
		console.error("Destination bucket must not match source bucket.");
		return;
	}
	
	// Confirm file is in storage directory
	var dirMatch = srcKey.match(/^([A-Z0-9\_])+\/storage\/\S/);
	if (!dirMatch) {
		console.log('skipping non-storage file ' + srcKey);
		return;		
	}

	// Infer the file type.
	var typeMatch = srcKey.match(/\.([^.]*)$/);
	if (!typeMatch) {
		console.error('unable to infer file type for key ' + srcKey);
		return;
	}
	var fileExt = typeMatch[1].toLowerCase();
	var fileType;
	
	switch (fileExt) {
		case "jpg":
		case "png":
			fileType = 'image';
			break;
		case "mp4":
		case "wav":
		case "m4v":
			fileType = "video";
			break;
		default:
			console.log('skipping unknown file type ' + srcKey);
			return;
	}
	
	// If thumbnail already provided by user, skip?
	
	// Download the image from S3, transform, and upload to a different S3 bucket.
	async.waterfall([
		function getRegion(next) {
			console.log('Getting region.');
			var params = {
  				Bucket: srcBucket
			};
			s3.getBucketLocation(params, function(err, data) {
			  if (err) next(err); // an error occurred
			  else  {  
				  if (data.LocationConstraint) region = data.LocationConstraint; 
				  AWS.config.region = region;
				  next(); 
				}
			});
		},		
		// Download the file into a file stream
		function download(next) {
			console.log('downloading file and writing to ' + downloadPath);
			var file = fs.createWriteStream(downloadPath);
			file.on('error', function(err) { next(err); });
			file.on('close', function() { next();});
			s3.getObject({
				Bucket: srcBucket,
				Key: srcKey
			}).createReadStream().pipe(file);	
			},
		// do any file pre-processing here (videos, Office files, etc.)			
		function preProcess(next) {
			if (fileType == 'video') {

				console.log('starting ffmpeg on ' + downloadPath +
					' filesize ' +  fs.statSync(downloadPath)["size"]);
				child_process.execFile(
					'./ffmpeg',
					[
						'-i', downloadPath,
						'-ss', '00:00:01',
						'-vframes', '1',
						'-n',
						downloadPath + ".png"
					],
					null,
					function (err, stdout, stderr) {
						if (err) {
							console.log('ffmpeg Error: ' + err);
							next(err);
						} else {
							console.log('ffmpeg finished');
							var fileToDelete = downloadPath;
							downloadPath += ".png";
							console.log('deleting ' + fileToDelete);
							fs.unlink(fileToDelete, next);							
						}
					});			
				
			} else next();
		},
		// Create thumbnail		
		function transform(next) {
			console.log('starting to create thumbnail for ' + downloadPath);
			gm(downloadPath).size(function(err, size) {
				// Infer the scaling factor to avoid stretching the image unnaturally.
				var scalingFactor = Math.min(
					MAX_WIDTH / size.width,
					MAX_HEIGHT / size.height
				);
				var width  = scalingFactor * size.width;
				var height = scalingFactor * size.height;
				
				// Transform the image buffer in memory.
				this.resize(width, height)
					.toBuffer(downloadPath.substr(downloadPath.lastIndexOf('.')+1), 
					function(err, buffer) {
						if (err) next(err);
						else next(null, "application/jpg", buffer);
					});
			});
		},
		// Stream the transformed image to a different S3 bucket.		
		function upload(contentType, data, next) {
			console.log('uploading image');
			s3.putObject({
					Bucket: dstBucket,
					Key: dstKey,
					Body: data,
					ContentType: contentType
				},
				function (err, data) {
					if (err) next(err);
					else fs.unlink(downloadPath, next)		
				}			
			);
		},
		// Get topic queue name
		function getTopicArn(next) {
			console.log('getting topic arn');
			var sns = new AWS.SNS();
			sns.listTopics( null, 
				function(err, data) {
				  if (err) next(err);
				  else {
					  for (var i = 0; i < data.Topics.length; i++) {
						  if (data.Topics[i].TopicArn.indexOf(TOPIC_NAME) >=0)
						  	{ topicArn = data.Topics[i].TopicArn; break;}
					  }
					  console.log('topic Arn ' + topicArn);
					  next(null);
				  }
				});			
		},
		// Send message to topic queue
		function sendMessage(next) {
			console.log('sending message');
			var sns = new AWS.SNS();
			// Set message propterties
			var params = {
			  Message: JSON.stringify(
				  {
					  action: 'receiveThumbnail',
					  bucket: dstBucket,
					  key: dstKey
				  }
			  ),
			  MessageAttributes: {
			    inst: {
			      DataType: 'String', 
			      StringValue: inst
			  	},
			  },			  
			  TopicArn: topicArn
			};
			sns.publish(params, next);
		}
		], function (err) {
			if (err) {
				console.error(
					'Unable to resize ' + srcBucket + '/' + srcKey +
					' and upload to ' + dstBucket + '/' + dstKey +
					' due to an error: ' + err
				);
			} else {
				console.log(
					'Successfully resized ' + srcBucket + '/' + srcKey +
					' and uploaded to ' + dstBucket + '/' + dstKey
				);
			}
			context.done();
		}
	);
};