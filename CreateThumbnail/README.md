# CreateThumbnail

Creates a thumbnail of several types of files, including images, videos, PDFs, and Office files.

This project uses several tools in order to create the thumbnails:
* Videos: [ffmpeg](https://www.ffmpeg.org/), ffprobe
* Office: [PdfHandler](../PdfHandler) Lambda function
* PDFs: [ImageMagick](http://www.imagemagick.org/) 

In order to run this sample, self-contained, statically compiled binaries appropriate for the target OS must be available in the `binaries` folder.

The following test script can be used to execute the script locally and then download the resulting thumbnail.

```javascript
var AWS = require('aws-sdk');
var CreateThumbnail = require('./index.js');

var context = {
  done: function (err, result) {
  	if (err) { console.log(err) }
  	else { 
  		downloadThumbnail(result, 
  			function() { process.exit(1);	});		
  	}
	}
}

function downloadThumbnail(request, callback) {
	var s3 = new AWS.S3();
	s3.getObject(request, function(err, data) {
		if (err) console.log(err.message);
		else {
			var fileName = request.Key.substring(request.Key.lastIndexOf('/')+1);
			console.log('Writing thumbnail to ' + fileName);
			var homeDir = 
				(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE);
			var localFile = homeDir + "/Downloads/" + fileName;
			require('fs').writeFile(localFile, data.Body,
				function(err) {
					if (err) console.log(err.message)
					else s3.deleteObject(request, callback);
				}
			);
		}
	});	
}

var event = {
	bucket: 'BUCKET',
	key:    'KEY'
};

// Call the Lambda function
CreateThumbnail.handler(event, context);
```

## Packaging
To package this Lambda, you can use the following

    $ npm run package -- --os=linux

The `os` parameter determines which `ffmpeg` binaries to include. 

Running this script will create a zip file which can be deployed to Lambda.