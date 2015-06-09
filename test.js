// Our Lambda function fle is required 
var CreateThumbnail = require('./CreateThumbnail/index.js');

// The Lambda context "done" function is called when complete with/without error
var context = {
    done: function (err, result) {
        console.log('------------');
        console.log('Context done');
        console.log('   error:', err);
        console.log('   result:', result);
    }
};

// Simulated S3 bucket event
var event = {
    Records: [
        {
            s3: {
                bucket: {
                    name: 'almadtest'
                },
                object: {
                    key: '01TEST/storage/PGH1920a.JPG'
                }
            }
        }
    ]
};

// Call the Lambda function
CreateThumbnail.handler(event, context);