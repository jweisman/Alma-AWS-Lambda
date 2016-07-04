var utils = require('./utilities.js');
var alma  = require('./alma.js');

exports.process = function(data, callback) {
	var job = data.job_instance;
	
	// Get user phone & send SMS
	alma.get("/users/" + job.submitted_by.value, 
		function(err, user) {
			var phone;
			if ( user.contact_info.phone && 
				(phone = user.contact_info.phone.find(p => p.preferred_sms)) ) {
				utils.sendSms(phone.phone_number, 
					"The job " + job.name + " has completed.", 
					callback);
			}	else {
				console.log("No preferred SMS number found.")
				callback(err);
			}
		});
}