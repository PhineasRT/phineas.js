var gulp = require('gulp')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var babel = require('gulp-babel')
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var envify = require('gulp-envify');

const mainFilePath = "./dist/index.js"
const sourceDir = "./src/**/*.js"
const buildDir = "./dist/**/*.js"

gulp.task('babel', function () {
  var environment = {
    BUILD_ENV: process.env.BUILD_ENV
  };

  return gulp.src(sourceDir)
    .pipe(envify(environment))
    .pipe(sourcemaps.init())
    .pipe(babel({optional: ['runtime']}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist'))
})


gulp.task('browserify', ['babel'], function () {
  return browserify({
    entries: mainFilePath,
    transform: [['envify', {'global': true, '_': 'purge', BUILD_ENV: process.env.BUILD_ENV}]] 
  })
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist'))
})

gulp.task('watch', function () {
	gulp.watch(sourceDir, {verbose: true}, ['default'])
});


gulp.task('default', ['babel'])