var gulp = require('gulp');
var zip = require('gulp-zip');
var p = require('./package.json');

gulp.task('package', function() {

	var src = ['**', '!*.zip'];
	var i;
	for (i in p.devDependencies) {
		src.push("!node_modules/" + i + "{,/**}");
	}
	gulp.src(src)
		.pipe(zip('lambda.zip'))
		.pipe(gulp.dest('.')) 
	});
