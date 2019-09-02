# Alma Email Deposit

This proof of concept allows deposits to be made to Alma via email. This Lambda function is called when an email is received by Amazon SES. The function parses the mail, validates the user, and submits a deposit via the [SWORD](https://github.com/jweisman/AlmaSwordServer) create deposit request. 

The process flow is illustrated below:

![Email Deposit Process Flow](https://www.lucidchart.com/publicSegments/view/151babe3-71a2-4f04-ae94-4bec260cd74c/image.png)

## Configuration
Copy the `config-sample.json` file to `config.json`. Enter the parameters according to your environment.

## AWS Setup

### Simple Email Service
We assume that this Lambda service is called when an email is received by SES and saved on S3. See this [blog entry](https://developers.exlibrisgroup.com/blog/Accepting-Digital-Deposits-via-Email) for more information on the SES setup.

### Lambda
Create a Lambda function and upload the code in this folder as a zip file. The Lambda must execute as a role with permissions to S3, Cloudwatch logs, and the ability to execute a Lambda (if you plan to use AWS services to verify email deposits). Here is a sample role policy:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```

### API Gateway
To support the verification functionality, this proof of concept uses the AWS API Gateway to support an HTTP endpoint. An email is sent to the user which includes an API Gateway URL. The URL includes a token parameter which is used to verify the user. 

In the API Gateway console, create a new API and a resource for the verification service (i.e. /verify-deposit). In the GET method, the Integration Request should be configured to call this Lambda function. The body mapping template should forward the token parameter to the Lambda function:
```
{ "token": "$input.params('token')" } 
```
