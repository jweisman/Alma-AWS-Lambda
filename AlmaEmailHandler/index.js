// dependencies
const async = require('async');
const nconf = require('nconf');
const utils = require('./utils.js');
const handlers = require('./handlers.js');

// Load configuration
nconf.env().file({ file: './config.json' });

const bucket = nconf.get("bucket");
const prefix = nconf.get("prefix");
const tmpDir = "/tmp/";

exports.handler = async (event) => {
  try {
    var messageId = event.Records[0].ses.mail.messageId;    
    var file = await utils.downloadFile(bucket, prefix + messageId, tmpDir);
    var email = await utils.parseEmail(file);
    var [inst, action, id] = email.to.substring(0, email.to.indexOf("@")).split('-');
    await handlers[action](inst, id, email);
    await utils.deleteFile(bucket, prefix + messageId);
  } catch (e) {
    console.log(e)
    return e;
  }
};
