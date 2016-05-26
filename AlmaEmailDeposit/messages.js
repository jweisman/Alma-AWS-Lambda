var CRLF = '\r\n';

var messages = {
	confirmation: "Hi {0}. " +
	  "Just wanted to let you know that your " +
	  "deposit has been processed. You can access it at " +
	  "the URL below. Thanks." + CRLF + CRLF +
	  "{1}",
	verification: "Hi {0}. " +
		"We received your requested deposit. " +
		"Just need you to verify the request by "+
		"clicking on the link below. Thanks. " + CRLF + CRLF +
		"{1}",
	user_not_found: "Hi. Just wanted to let you know that your " +
		"email address was not recognized so we could not " +
		"process your deposit."
}

if (!String.format) {
  String.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
  };
}

exports.getMessage=function(msg) {
	var str = messages[msg];
	arguments[0] = str;
	return String.format.apply(null, arguments);
}