const {src, dest, watch} = require('gulp');
const concat = require('gulp-concat');
const minify = require('gulp-minify');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

function compile_ts(){
  return src('src/*.ts')
    .pipe(tsProject())
    .pipe(concat('zed.js'))
    .pipe(minify())
    .pipe(dest('lib/'))
}

function pack_js() {
  return src(['lib/*.js'])
    .pipe(concat('zed.js'))
    .pipe(dest('lib/'));
};

function pack_css() {
  return src(['lib/*.css'])
    .pipe(concat('zed.css'))
    .pipe(dest('lib/'));
}


exports.default = function () {
  watch('src/*.ts', compile_ts)
  // You can use a single task
  watch('src/*.css', pack_css);
  // Or a composed task
  watch('src/*.js', pack_js);
};