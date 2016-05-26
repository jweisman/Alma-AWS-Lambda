var fs = require("fs");
var path = require("path");
var archiver = require('archiver');
var async = require("async");
var nodemailer = require("nodemailer");
var AWS = require('aws-sdk');

exports.downloadFile = function(bucket, key, dir, callback) {
	var s3 = new AWS.S3();
	var filename = dir + key;
	mkdirp(path.dirname(filename));
	console.log("Writing file to " + filename);
	var file = fs.createWriteStream(filename);
	file.on('error', function(err) {
		callback(err);
	});
	file.on('close', function(err) {
		callback(err, filename);
	});
	s3.getObject({
		Bucket: bucket,
		Key: key
	}).createReadStream().pipe(file);
}

exports.deleteFile = function(bucket, key, callback) {
	var s3 = new AWS.S3();
	s3.deleteObject({
			Bucket: bucket,
			Key: key
		},
		callback
	);
}

exports.zip = function(files, zip, callback) {
	var output = fs.createWriteStream(zip);
	var archive = archiver('zip')
		.on("error", function(err) {
			callback(err);
		});

	output.on('close', function(err) {
		console.log("finish zip");
		callback(err, zip);
	});

	console.log("starting zip");
	archive.pipe(output);

	files.forEach(function(file) {
		archive.append(file.content, {
			name: file.fileName
		});
		console.log("added file", file.fileName);
	});
	archive.finalize();
}

exports.parseEmail = function(file, callback) {
	var MailParser = require("mailparser").MailParser;
	var mailparser = new MailParser();
	mailparser.on("end", function(mail_object) {
		var mail = {};
		mail.subject = mail_object.subject;
		mail.text = mail_object.text;
		mail.from = mail_object.from[0].address.toLowerCase();
		mail.attachments = mail_object.attachments || [];
		callback(null, mail);
	});

	fs.createReadStream(file).pipe(mailparser);
}

exports.sendEmail = function(opts, to, subject, body, callback) {
	var options = {
		secure: true,
		host: opts.host,
		auth: {
			user: opts.user,
			pass: opts.pass
		}
	}
	var transporter = nodemailer.createTransport(options);
	var mailOptions = {
		from: opts.from,
		to: to,
		subject: subject,
		text: body
			//html: '<b>Hello world 🐴</b>' // html body
	};
	// send mail with defined transport object
	transporter.sendMail(mailOptions, callback);
}

exports.base64_encode = function(file) {
	var bitmap = fs.readFileSync(file);
	return addNewlines(new Buffer(bitmap).toString('base64'), 60);
}

exports.hash = function(s) {
	var crypto = require('crypto');
	return crypto.createHash('md5').update(s).digest('hex');
}

function addNewlines(str, len) {
	var result = '';
	while (str.length > 0) {
		result += str.substring(0, len) + '\n';
		str = str.substring(len);
	}
	return result;
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