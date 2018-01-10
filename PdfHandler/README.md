# PdfHandler

Exposes a Java Lambda function to convert some Office file formats to PDF. Currently supports:
* doc
* docx
* ppt
* pptx

## Attribution
This project uses the helpful [Docs to PDF Converter](https://github.com/yeokm1/docs-to-pdf-converter) wrapper by @yeokm1. 

# Build
Since there are quite a few dependent jars in this project, we need to build it as a [.zip deployment package](http://docs.aws.amazon.com/lambda/latest/dg/create-deployment-pkg-zip-java.html). This increases the AWS Lamdba size limitations to accomodate larger dependencies. We use [Gradle](http://gradle.org) to manage dependencies and build the zip.

To set up the project for development in Eclipse, run `gradle eclipse`.

To build the project, run `gradle build`.

# Usage
This Lambda function expects an object with three parameters:
* `bucket`: Name of the bucket for the source and destination files.
* `key`: Key of the source file
* `destination`: Destination folder for the resulting file

An example of how to call the Lambda function from Node is below:

    var lambda = new AWS.Lambda();
    var params = {
      FunctionName: 'PdfHandler', 
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ 
        bucket: bucket, 
        key: srcKey,
        destination: scratch + "pdf/" + random + "/"
      })
    };

    lambda.invoke(params, function(err, data) {
      console.log(data);
      var resp = JSON.parse(data.Payload);
      console.log("PDF conversion complete: " + resp.key);
    });

# Testing
Testing can be done with the JUnit test classes included in the project. The test classes are based on the stubs created with the [AWS Toolkit for Eclipse](http://docs.aws.amazon.com/AWSToolkitEclipse/latest/ug/lambda.html).
