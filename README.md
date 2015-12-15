# AWS Lambda Samples for Alma

Introduction
------------
This repository provides small examples of using [Amazon Web Service's Lambda](https://aws.amazon.com/lambda/) service with Alma use cases. Each example is self-contained and sits in its own directory in this repository.

Installation and Testing Instructions
-------------------------
On any machine with [Node.js](https://nodejs.org) and [Git](http://git-scm.com/) installed, do the following:

1. Clone this repository: `git clone https://github.com/jweisman/AWS-Lambda-POC.git`
2. *In the relevant directory*, install dependencies: `npm install`
3. If available, copy the `config-example.json` file to `config.json` and replace the placeholder values.
  * `alma_host` and `alma_path` from the [Alma API Getting Started Guide](https://developers.exlibrisgroup.com/alma/apis)
  * `api_key` from the [Ex Libris Developer Network](https://developers.exlibrisgroup.com/) dashboard
4. Test the application locally with a test script (see below)
5. Package the application with the `node_modules` into a zip file
6. Upload the zip to a Lambda function previously-defined in AWS using the console or the [CLI](https://aws.amazon.com/cli/):
```
aws lambda update-function-code --function-name MyFunctionName --zip-file fileb://MyFunctionZip.zip 
```
Testing the Script
------------------
You can test the Lambda function locally using a script such as the one below:

```javascript
// Our Lambda function fle is required
var myLambda = require('./index.js');

// The Lambda context "done" function is called when complete with/without error var context = {
    done: function (err, result) {
        console.log('------------');
        console.log('Context done');
        console.log('   error:', err);
        console.log('   result:', result);
    }
};

// Create an event if required for your function
var event = {

};

// Call the Lambda function
myLambda.handler(event, context);
```

License
-------
The code for these samples is made available under the [MIT license](http://opensource.org/licenses/MIT).
