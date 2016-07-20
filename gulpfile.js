var gulp = require('gulp')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var babel = require('gulp-babel')
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');

const mainFilePath = "./index.js"
const sourceDir = "./src/**/*.js"

gulp.task('babel', function () {
  return gulp.src(sourceDir)
    .pipe(sourcemaps.init())
    .pipe(babel({optional: ['runtime']}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist'))
})

gulp.task('browserify', ['babel'], function () {
  return browserify(mainFilePath)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist'))
})

gulp.task('watch', function () {
	gulp.watch(sourceDir, {verbose: true}, ['default'])
});


gulp.task('default', ['babel'])