// dependencies
var async = require('async');
var nconf = require('nconf');
var fs = require("fs");
var path = require('path');
var request = require('request');
var alma = require('./alma.js');
var utils = require('./utils.js');
var verifyUser = require('./verifyUser.js');
var messages = require('./messages.js');

// Load configuration
nconf.env()
  .file({
    file: './config.json'
  });

var apikey = nconf.get('api_key');
var sworduri = nconf.get('sworduri');
var sworduser = nconf.get('sworduser');
var swordpass = nconf.get('swordpass');
var verification = nconf.get('verification');
var bucket = nconf.get("bucket");
var prefix = nconf.get("prefix");
var emailOpts = nconf.get('emailOpts');

var tmpDir = "/tmp/";

exports.handler = function(event, context) {
  var user;
  var email;

  var finalCallback = function(err, result) {
    if (err) {
      console.error(err);
    }
    context.done(err, "Done");
  };

  // called from token verification?
  if (event.token) {
    return verifyUser.verify(event.token, finalCallback)
  }

  var sesNotification = event.Records[0].ses;
  var messageId = sesNotification.mail.messageId;

  async.waterfall(
    [
      // Retrieve the email from your bucket
      function getFile(next) {
        utils.downloadFile(bucket, prefix + messageId,
          tmpDir, next);
      },
      function parseMail(filename, next) {
        console.log('parsing email', filename);
        utils.parseEmail(filename, next);
      },
      function getUser(mail, next) {
        email = mail;
        console.log("Searching for user with email ", email.from);
        alma.get("/users?q=email~" + email.from, next);
      },
      function validateUser(resp, next) {
        if (resp.total_record_count == 0) {
          console.log("User not found:", email.from)
          utils.sendEmail(
            emailOpts,
            email.from,
            "Re: " + email.subject,
            messages.getMessage('user_not_found'),
            function(err) {
              finalCallback(err);
            }
          );
        } else {
          console.log("User found:", resp.user[0].primary_id);
          user = resp.user[0];
          next();
        }
      },
      function verify(next) {
        if (!verification) {
          console.log('no verification routine specified');
          next(null);
        } else {
          verifyUser.isUserVerified(email.from, function(res) {
            if (res) {
              console.log('user verified', email.from);
              next(null);
            } else {
              console.log('user not verified', email.from);
              utils.sendEmail(
                emailOpts,
                email.from,
                "Re: " + email.subject,
                messages.getMessage('verification',
                  user.first_name,
                  verifyUser.tokenLink(email.from, messageId)
                ),
                function(err) {
                  console.log('sent verification email');
                  finalCallback(err);
                }
              );
            }
          });
        }
      },
      function zipFiles(next) {
        if (email.attachments.length == 0)
          next("No attachment found");
        else
          utils.zip(email.attachments, path.join(tmpDir, messageId + ".zip"), next);
      },
      function sendRequest(zip, next) {
        var md = getEntry(
          user.first_name + " " + user.last_name,
          email.subject, email.text
        );

        headers = {
          "In-Progress": false,
          "On-behalf-of": user.primary_id
        }

        var options = {
          url: sworduri,
          method: 'POST',
          auth: {
            user: sworduser,
            pass: swordpass
          },
          headers: headers,
          multipart: [{
            'content-type': 'application/atom+xml; charset="utf-8"',
            'content-disposition': 'attachment; name=atom',
            body: md
          }, {
            'content-type': 'application/zip',
            'content-disposition': 'attachment; name=payload; filename=' + path.basename(path.join(tmpDir, messageId + ".zip")),
            'Content-Transfer-Encoding': 'base64',
            'Packaging': 'http://purl.org/net/sword/package/SimpleZip',
            'Content-MD5': utils.checksum(zip),
            body: utils.base64_encode(zip)
          }]
        };
        console.log('sending request')
        request(options, next);
      },
      function processResponse(response, body, next) {
        console.log("processing response", response.statusCode);
        if (('' + response.statusCode).match(/^2\d\d$/)) {
          var dom = require('xmldom').DOMParser
          var doc = new dom().parseFromString(body)
          var delivery_url = [].slice.call(doc.getElementsByTagName('link'))
            .find(n=>n.getAttribute("rel")=="alternate")
            .getAttribute("href");
          next(null, delivery_url);
        } else {
          console.log('SWORD error', body);
          next('SWORD Error-' + response.statusCode);
        }
      },
      function sendEmail(delivery_url, next) {
        console.log("sending email response");
        utils.sendEmail(
          emailOpts,
          email.from,
          "Re: " + email.subject,
          messages.getMessage('confirmation',
            user.first_name,
            delivery_url
          ),
          next
        );
      },
      function deleteEmail(info, next) {
        utils.deleteFile(bucket, prefix + messageId, next);
      }
    ],
    finalCallback
  );
};

function getEntry(creator, title, abstract) {
  var builder = require('xmlbuilder');
  var xml = builder.create("entry")
    .att('xmlns', 'http://www.w3.org/2005/Atom')
    .att('xmlns:dcterms', 'http://purl.org/dc/terms/');
  xml.ele('title', title);
  xml.ele('author')
    .ele('name', creator);
  xml.ele('summary', abstract);
  xml.ele('dcterms:abstract', abstract);
  xml.ele('dcterms:title', title);
  xml.ele('dcterms:creator', creator);

  return xml.end({
    pretty: true
  });
}