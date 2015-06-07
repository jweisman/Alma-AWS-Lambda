// Code based on:
// http://docs.aws.amazon.com/lambda/latest/dg/walkthrough-s3-events-adminuser-create-test-function-create-function.html

// dependencies
var async = require('async');
var AWS = require('aws-sdk');
var gm = require('gm')
            .subClass({ imageMagick: true }); // Enable ImageMagick integration.
var util = require('util');

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
	var region    = "us-east-1"; // default

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

	// Infer the image type.
	var typeMatch = srcKey.match(/\.([^.]*)$/);
	if (!typeMatch) {
		console.error('unable to infer image type for key ' + srcKey);
		return;
	}
	var imageType = typeMatch[1];
	if (imageType != "jpg" && imageType != "png") {
		console.log('skipping non-image ' + srcKey);
		return;
	}

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
		function download(next) {
			// Download the image from S3 into a buffer.
			s3.getObject({
					Bucket: srcBucket,
					Key: srcKey
				},
				next);
			},
		function tranform(response, next) {
			gm(response.Body).size(function(err, size) {
				// Infer the scaling factor to avoid stretching the image unnaturally.
				var scalingFactor = Math.min(
					MAX_WIDTH / size.width,
					MAX_HEIGHT / size.height
				);
				var width  = scalingFactor * size.width;
				var height = scalingFactor * size.height;

				// Transform the image buffer in memory.
				this.resize(width, height)
					.toBuffer(imageType, function(err, buffer) {
						if (err) {
							next(err);
						} else {
							next(null, response.ContentType, buffer);
						}
					});
			});
		},
		function upload(contentType, data, next) {
			// Stream the transformed image to a different S3 bucket.
			console.log('uploading image');
			s3.putObject({
					Bucket: dstBucket,
					Key: dstKey,
					Body: data,
					ContentType: contentType
				}, // why can't we just pass next into putObject?
				function(err, data) {
					if (err) next(err);
					else next();
				}
			);
		},
		function getTopicArn(next) {
			console.log('getting topic arn');
			var sns = new AWS.SNS();
			sns.listTopics( null, 
				function(err, data) {
				  if (err) next(err);
				  else {
					  console.log(data);
					  for (var i = 0; i < data.Topics.length; i++) {
						  console.log(data.Topics[i].TopicArn.indexOf(TOPIC_NAME) );
						  if (data.Topics[i].TopicArn.indexOf(TOPIC_NAME) >=0)
						  	{ topicArn = data.Topics[i].TopicArn; break;}
					  }
					  //topicArn = data.Topics[TOPIC].TopicArn;
					  console.log(topicArn);
					  next();
				  }
				});			
		},
		function sendMessage(next) {
			console.log('sending message');
			var sns = new AWS.SNS();
			var params = {
			  Message: JSON.stringify(
				  {
					  action: 'receiveThumbnail',
					  bucket: dstBucket,
					  key: dstKey
				  }
			  ),
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