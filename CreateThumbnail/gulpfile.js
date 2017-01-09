var gulp = require('gulp');
var zip = require('gulp-zip');
var p = require('./package.json');
var argv = require('yargs').argv;

gulp.task('package', function() {

	var os = (argv.os || 'mac').toLowerCase();
	gulp.src('binaries/' + os + '/*')
		.pipe(gulp.dest('./binaries'));

	var src = ['*.js', 'node_modules/**/*', 'binaries/*', '!*.zip'];
	var i;
	for (i in p.devDependencies) {
		src.push("!node_modules/" + i + "{,/**}");
	}
	gulp.src(src, {base: '.'})
		.pipe(zip('CreateThumbnail.zip'))
		.pipe(gulp.dest('.')); 
});
