# Alma API Acq Proxy

This Lambda function is meant to be called from an [AWS API Gateway Proxy integration](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy.html).

For more information see this [blog post](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy.html).

## Build the deployment zip
To deploy this to AWS Lambda, you need to prepare a zip file with the script files and the dependencies. 

On a machine with [git](https://git-scm.com/), [node](https://nodejs.org/), [npm](https://www.npmjs.com/), and [gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) installed:
1. Download the contents of this directory, or git clone `git clone https://github.com/jweisman/AWS-Lambda-POC.git`
2. `cd` to the AlmaApiAcqProxy directory
3. Run `npm run package`
4. Upload the `lambda.zip` file to your AWS Lambda function
