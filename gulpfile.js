const {src, dest, watch} = require('gulp');
const concat = require('gulp-concat');

function pack_js() {
  return src(['./src/*.js'])
    .pipe(concat('zed.js'))
    .pipe(dest('lib/'));
};

function pack_css() {
  return src(['./src/*.css'])
    .pipe(concat('zed.css'))
    .pipe(dest('lib/'));
}


exports.default = function () {
  // You can use a single task
  watch('src/*.css', pack_css);
  // Or a composed task
  watch('src/*.js', pack_js);
};