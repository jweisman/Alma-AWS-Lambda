
var fs = require("fs");
var path = require("path");

var MailParser = require("mailparser").MailParser;

exports.parseEmail = function(file, callback){
	console.log('parsing email');

	var mailparser = new MailParser();
	mailparser.on("end", function(mail_object){
		console.log('end parse email');
		var mail = {};
		mail.subject = mail_object.subject;
		mail.text = mail_object.text;
		mail.from = mail_object.from[0].address.toLowerCase();
		mail.attachments = mail_object.attachments;
	  callback(null, mail);
	});

	fs.createReadStream(file).pipe(mailparser);
}
