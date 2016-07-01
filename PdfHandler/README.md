# PdfHandler

Exposes a Java Lambda function to convert some Office file formats to PDF. Currently supports:
* doc
* docx
* ppt
* pptx

## Attribution
This project uses the helpful [Docs to PDF Converter](https://github.com/yeokm1/docs-to-pdf-converter) wrapper by @yeokm1. 

# Build
Since there are quite a few dependent jars in this project, we need to build it as a [.zip deployment package](http://docs.aws.amazon.com/lambda/latest/dg/create-deployment-pkg-zip-java.html). This increases the AWS Lamdba size limitations to accomodate larger dependencies. We se [Gradle](http://gradle.org) to manage dependencies and build the zip.

To set up the project for development in Eclipse, run `gradle eclipse`.

To build the project, run `gradle build`.

# Testing
Testing can be done with the JUnit test classes included in the project. The test classes are based on the stubs created with the [AWS Toolkit for Eclipse](http://docs.aws.amazon.com/AWSToolkitEclipse/latest/ug/lambda.html).