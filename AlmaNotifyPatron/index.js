// dependencies
var async = require('async');
var AWS = require('aws-sdk');
var util = require('util');
var fs  = require('fs');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var xml2js = require('xml2js');
var alma = require('./alma.js');
var twilio = require('twilio');
var nconf = require('nconf');
require('./include.js');

nconf.env()
   .file({ file: './config.json' });

// XML setup

var parser = new xml2js.Parser({
	'explicitArray': false,
	'explicitRoot': false,
	'tagNameProcessors': [
    	function (name) {
    		return nodeMap[name] ? nodeMap[name] : name;
    	}]
});

var namespaces = {
	"rowset": "urn:schemas-microsoft-com:xml-analysis:rowset"
};

var nodeMap = {
	"Row": "item",
	"Column1": "firstName",
	"Column2": "lastName",
	"Column3": "primaryId",
	"Column4": "dueDate",
	"Column5": "barcode",
	"Column6": "email",
	"Column7": "phoneNumber",
	"Column8": "sms",
	"Column9": "title"
};

// Twilio setup

var twilio_account = nconf.get('twilio_account');
var twilio_token = nconf.get('twilio_token');
var twilio_number = nconf.get('twilio_number');
var client = new twilio.RestClient(twilio_account, twilio_token);

// Helper functions

function formatMsg(name, items) {
	var msg = "Hi " + name + ". Just a friendly reminder " +
		"that you have " + (items.length > 1 ? items.length + ' books' : 
			'a book') + " due back tomorrow. ";
	msg +=  "(" + items.map(function(item) {return item.title;}).join(', ')	+ ")";
	return msg;
}

function sendSms(to, msg, callback) {
	console.log("Sending to " + to + ": " + msg);
	client.sms.messages.create({
		to: to,
		from: twilio_number,
		body: msg	
	}, callback);
}

// Lambda function

exports.handler = function(event, context) {
	async.waterfall([
		function (next) {
			alma.getXml('/analytics/reports?path=%2Fshared%2FCommunity%2FReports%2FShared%20Reports%2FReports%2FFulfillment%20-%20Misc.%20reports%2FEx%20Libris%20-%20Loans%20due%20tomorrow%20with%20patron%20and%20item%20information',
				next);
			//fs.readFile('./report.xml', "utf-8", next);
		},
		function (data, next) {
			var doc = new dom().parseFromString(data);
	   	var select = xpath.useNamespaces(namespaces);
	    var nodes = select('/report/QueryResult/ResultXml/rowset:rowset/rowset:Row', doc);
	    parser.parseString("<items>" + nodes.join("") + "</items>", next);
		},
		function (data, next) {
			if (data.item.length) {
				data.item = data.item.groupBy(function(o) {return JSON.stringify({a: o.primaryId});});
				async.each(data.item, function(item, callback) {
					var msg = formatMsg(item.key.firstName, item.group);
					sendSms(item.key.sms, msg, callback);					
				}, next);		
			} else {
				var msg = formatMsg(data.item.firstName, new Array(data.item));
				sendSms(data.item.sms, msg, next);
			}
		}
		], function (err, result) {
				if (err) { console.error(err) }
				context.done(err,'Done');
			}
		);
};