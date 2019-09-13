var fs = require("fs");
var path = require("path");
var AWS = require('aws-sdk');

const s3 = new AWS.S3();

exports.downloadFile = function(bucket, key, dir) {
  return new Promise((resolve, reject) => {
		const filename = dir + key;
		mkdirp(path.dirname(filename));  	
		const params = { Bucket: bucket, Key: key }
    const s3Stream = s3.getObject(params).createReadStream();
    const fileStream = fs.createWriteStream(filename);
    s3Stream.on('error', reject);
    fileStream.on('error', reject);
    fileStream.on('close', () => { resolve(filename);});
    s3Stream.pipe(fileStream);
  });
}

exports.deleteFile = function(bucket, key) {
	const params = { Bucket: bucket, Key: key };
	return s3.deleteObject(params).promise();
}

exports.parseEmail = async function(file) {
	const simpleParser = require('mailparser').simpleParser;
	let mail_object = await simpleParser(fs.createReadStream(file));
	var replyParser = require("node-email-reply-parser");
	var mail = {};
	mail.subject = mail_object.subject;
	mail.text = mail_object.text;
	mail.from = mail_object.from.value[0].address.toLowerCase();
	mail.to = mail_object.to.value[0].address.toLowerCase();
	mail.attachments = mail_object.attachments || [];
	mail.visibleText = replyParser(mail.text, true);
	return mail;		
}

function mkdirp(directory) {
	var dirs = directory.split(path.sep);
	var dir = '';
	dirs.forEach(function(d) {
		if (d) {
			dir += path.sep + d;
			if (!fs.existsSync(dir))
				fs.mkdirSync(dir);
		}
	})
}