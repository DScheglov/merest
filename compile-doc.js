'use strict';
const path = require('path');
const fs = require('fs');
const twig = require('twig');
const colors = require('colors');
const pckg = require('./package.json');

const DOC_SOURCE = './doc-source';
const DOC_DEST = './docs';
const EXCLUDE_PATHS = ['includes'];
const RENDER = /^.+?\.twig$/;
const REPLACE= /\.twig$/;

let cwd = process.cwd();
let source_dir = path.join(cwd, DOC_SOURCE);
let dest_dir = path.join(cwd, DOC_DEST);

processFolder(source_dir, dest_dir, pckg);


function processFolder(source, dest, locals) {
  ensureDir(dest);
  let files = fs.readdirSync(source);
  let spec, fileName, destName;
  for (let file of files) {
    if (EXCLUDE_PATHS.indexOf(file)>=0) continue;
    fileName = path.join(source, file);
    destName = path.join(dest, file);
    spec = fs.lstatSync(fileName);
    if (spec.isDirectory()) {
      processFolder(fileName, destName);
      continue;
    };
    if (RENDER.test(file)) {
      destName = destName.replace(REPLACE, '.html');
      renderFile(fileName, destName, locals);
    } else {
      fs.createReadStream(fileName).pipe(
        fs.createWriteStream(destName)
      );
    }
  };
}

function ensureDir(folder) {
  if (fs.existsSync(folder)) {
     if (!fs.lstatSync(folder).isDirectory()) {
       fs.unlinkSync(folder);
     }
     return;
  }
  fs.mkdirSync(folder);
}

function renderFile(src, dst, locals) {
  twig.renderFile(src, locals,
    (err, html) => {
      fs.writeFile(dst, html, 'utf8', function(err) {
          if (err) {
              console.log("Unable to compile " + file + ", error " + err);
          } else {
              console.log("Rendered " + src.green + "\t-> " + dst.green);
          }
      });
    }
  );
}
