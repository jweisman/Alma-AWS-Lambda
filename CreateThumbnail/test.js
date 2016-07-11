var AWS = require('aws-sdk');
var CreateThumbnail = require('./index.js');

var context = {
  done: function (err, result) {
  	if (err) { console.log(err) }
  	else { 
  		require("fs").writeFileSync("out." + result.fileType, result.buffer, 'base64');
		};
	}
}

var event = {
	bucket: 			'almadtest',
	key: 					'01TEST/storage/Getting Started.pdf'
};

// Call the Lambda function
CreateThumbnail.handler(event, context);

// '01TEST/storage/Alma UX 2.0-Overview.pptx'
// '01TEST/storage/Ingesting Digital Content at Scale.docx'
// '01TEST/storage/Getting Started.pdf'
// '01TEST/storage/bunny.mp4'
// '01TEST/storage/Pittsburgh-Black-and-White.jpg'
// '01TEST/storage/Small-mario.png'
