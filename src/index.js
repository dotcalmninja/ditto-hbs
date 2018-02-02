/*
 * Ditto Handlebars Middleware
 */
const  
  async = require('async'),
  DittoHbsOpt = require('./dittoHbsOpt'),
  fs = require('fs'),
  glob = require('glob'),
  hbs = require('handlebars'),
  path = require('path'),
  util = require('util');

module.exports = DittoHbs;

function DittoHbs(opt) {
  this.opt = new DittoHbsOpt(opt);

  this.files = {};
  this.metadata = {};
  this.templates = {};  
};

/* Run */
DittoHbs.prototype.run = function(files, Ditto, done) {
  this.files = files;
  this.metadata = Ditto._metadata;

  console.info("*************\n*** ditt0-hbs ***\n*************");

  async.waterfall([
    this.discoverPartials,
    this.registerPartials
  ], function (err, results) {
    console.log(results);
  });

  // //register listeners
  // this.registerListeners(done);

  // //kickoff build
  // this.discoverPartials();
};

/* 
 * Compile Pages
 *	@param array filpaths 
 */
DittoHbs.prototype.compileTemplates = function(filepaths) {
  let
    self = this,
    templatesDir = path.resolve(self.opt.templates),
    promises = [];

  filepaths.map(function(filepath) {
    promises.push(self.compileTemplate(path.resolve(templatesDir, filepath)));
  });

  Promise.all(promises)
    .then(function() {
      self.emit("compiledTemplates");
    })
    .catch(function(reason) {
      console.error(reason);
      throw new Error(reason);
    });
};

/* Compile Template Async */
DittoHbs.prototype.compileTemplate = function(filepath) {
  let self = this;

  return new Promise(function(resolve, reject) {
    fs.readFile(filepath, 'utf8', function(err, data) {
      if (err) reject(err);
      else {
        self.templates[path.parse(filepath).name] = hbs.compile(data);
        resolve();
      }
    });
  });
};

/**
 * Discover files in partials directory
 * @param {Function.<Error, Array.<string>>} callback
 */
DittoHbs.prototype.discoverPartials = function(callback) {
  glob(path.join(this.opt.partials, '/*.hbs'), function(err, filepaths) {
    if(err) callback(err);    
    callback(null, filepaths);
  });
};

/* Discover Partials */
DittoHbs.prototype.discoverTemplates = function() {
  let
    self = this,
    templatesDir = path.resolve(self.opt.templates);

  self.findHandlebars(path.join(templatesDir, '/*.hbs'), function(err, filepaths) {
    self.emit("foundTemplates", filepaths);
  });
};

/**
 * Read hbs partial files
 * @param {Array.<String>} filepaths 
 * @param {Function.<Error>} callback
 */
DittoHbs.prototype.registerPartials = function(filepaths, callback) {
  async.map(filepaths, this.registerPartial, function (err) {
    if (err) callback(err);
    callback();
  });
};

/**
 * Read file into buffer and register as hbs partials
 * @param {String} filepath 
 * @param {Function.<Error>} callback
 */
DittoHbs.prototype.registerPartial = function(filepath, callback) {
  fs.readFile(filepath, 'utf8', function(err, data) {
    if (err) callback(err);
    
    hbs.registerPartial(path.parse(filepath).name, data);
    callback();
  });
};

/* Render HTML */
DittoHbs.prototype.renderHtml = function() {
  let self = this;

  Object.keys(self.files).forEach(function(filepath) {
    let
      file = self.files[filepath],
      parsedPath = path.parse(filepath),
      tmpl = file.template || self.opt.defaultTemplate,
      newFileDotPath = (parsedPath.name !== "index") ?
      path.join(parsedPath.dir, parsedPath.name, "index.html") :
      path.join(parsedPath.dir, parsedPath.name + ".html");

    //strip extension if its there
    tmpl = path.parse(tmpl).name;

    if (self.metadata) file.content.metadata = self.metadata;

    file.content = self.templates[tmpl](file.content);
    file.path = newFileDotPath;
  });

  self.emit("renderHtmlComplete");
};