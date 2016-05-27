# Alma Email Deposit

This proof of concept allows deposits to be made to Alma via email. This Lambda function is called when an email is received by Amazon SES. The function parses the mail, validates the user, and submits a deposit via the [SWORD](https://github.com/jweisman/AlmaSwordServer) create deposit request. 

The process flow is illustrated below:

![Email Deposit Process Flow]
(https://www.lucidchart.com/publicSegments/view/151babe3-71a2-4f04-ae94-4bec260cd74c/image.png)
