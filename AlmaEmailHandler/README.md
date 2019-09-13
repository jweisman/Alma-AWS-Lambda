# Alma Email Handler

This proof of concept handles emails sent to Alma. This Lambda function is called when an email is received by Amazon SES.  

## Configuration
Copy the `config-sample.json` file to `config.json`. Enter the parameters according to your environment. Add an environment variable for the `ALMA_APIKEY`.

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

