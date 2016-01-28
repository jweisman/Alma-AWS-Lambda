# AlmaWebHookHandler

This example is intended to be called from the AWS API Gateway via POST. The Integration Request Mapping Template is as follows:
```javascript
{ 
    "signature": "$input.params().header.get('X-Exl-Signature')",
    "body": $input.json('$')
}
```

Once the Lambda function receives the request from the API Gateway, it does the following:

1. Validates the signature passed in
2. Looks for an `action` parameter and routes the message to an appropriate handler
3. Handles an action of type `sms` and sends an SMS message using Twilio

Testing the Function
------------------
You can test this Lambda function via the API Gateway by calling the following script as `ruby test.rb '+4125551111' 'Testing'`.

```ruby
require 'rest-client'
require 'base64'
require 'securerandom'

KEY = "{KEY}"
URL = "{URL}"

to = ARGV[0]
msg = ARGV[1]

abort "Invalid number of parameters" unless to && msg

puts "Challenging server at #{URL}"
challenge = SecureRandom.uuid
abort "Server didn't respond to challenge" unless
	RestClient.get("#{URL}?challenge=#{challenge}")
		.include? challenge

req = {
	"action": "sms",
	"sms": {
		"msg": msg,
		"to": to
		}
	}.to_json

digest = OpenSSL::Digest.new('sha256')
hmac = Base64.encode64(OpenSSL::HMAC.digest(digest, KEY, req))

puts "Posting to server"
RestClient.post URL,
	req,
	content_type: :json,
	"X-Exl-Signature": hmac

puts "Done"
```
