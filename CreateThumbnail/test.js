// Our Lambda function fle is required 
var CreateThumbnail = require('./index.js');

// The Lambda context "done" function is called when complete with/without error
var context = {
    done: function (err, result) {
        console.log('------------');
        console.log('Context done');
        console.log('   error:', err);
        console.log('   result:', result);
    }
};

var event = {
	bucket: 'almadtest',
	key:    '01TEST/storage/pgh1890.jpg'
};

// Call the Lambda function
CreateThumbnail.handler(event, context);