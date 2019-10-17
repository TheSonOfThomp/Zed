/*
 * run `node install-zed.js` to update the Zed source files
 */

const fs = require('fs');

const src_dir = '../../src/zed/'

fs.copyFile(src_dir + 'zed.js', './zed/zed.js', (err) => {
  if (err) throw err;
  console.log('JS file copied');
});

fs.copyFile(src_dir + 'zed.css', './zed/zed.css', (err) => {
  if (err) throw err;
  console.log('CSS file copied');
});
