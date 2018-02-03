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

  this.metadata = {};
};

/**
 * Ditto Handlebars middleware
 * @param {Array.<Object.<DittoFile>>} files 
 * @param {Object.<Ditto>} Ditto 
 * @param {Function} done 
 */
DittoHbs.prototype.run = function(files, Ditto, done) {
  console.info("*************\n*** ditt0-hbs ***\n*************");

  async.waterfall([
    this.discoverPartials,
    this.registerPartials,
    this.discoverTemplates,
    this.registerTemplates,
    function(templates, callback){
      console.log(templates);
      // this.renderHtml(files, Ditto, templates, callback)
    }
  ], function(err) {
    done();
  });
};

/**
 * Discover files for given file pattern
 * @param {String} pattern glob pattern
 * @param {Function.<Error, Array.<string>>} callback
 */
DittoHbs.prototype.discover = function(pattern, callback) {
  glob(pattern, function(err, filepaths) {
    if (err) callback(err);
    callback(null, filepaths);
  });
};

/**
 * Discover files in partials directory
 * @param {Function.<Error, Array.<string>>} callback
 */
DittoHbs.prototype.discoverPartials = function(callback) {
  this.discover(path.join(this.opt.partials, '/*.hbs'), callback)
};

/**
 * Discover files in templates directory
 * @param {Function.<Error, Array.<string>>} callback
 */
DittoHbs.prototype.discoverTemplates = function(callback) {
  this.discover(path.join(this.opt.templates, '/*.hbs'), callback);
};

/**
 * Read hbs partial files
 * @param {Array.<String>} filepaths 
 * @param {Function.<Error>} callback
 */
DittoHbs.prototype.registerPartials = function(filepaths, callback) {
  async.map(filepaths, this.registerPartial, function(err) {
    if (err) callback(err);
    callback(null);
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
    callback(null);
  });
};

/**
 * Read hbs template files
 * @param {Array.<String>} filepaths 
 * @param {Function.<Error>} callback
 */
DittoHbs.prototype.registerTemplates = function(filepaths, callback) {
  async.map(filepaths, this.registerTemplate, function(err, templates) {
    if (err) callback(err);
    callback(null, templates);
  });
};

/**
 * Read file into buffer and register as hbs template
 * @param {String} filepath 
 * @param {Function.<Error, Object>} callback
 */
DittoHbs.prototype.registerTemplate = function(filepath, callback) {   
  fs.readFile(filepath, 'utf8', function(err, data) { 
    if (err) callback(err); 
    callback(null, hbs.compile(data));
  });
};

/**
 * @param {Array.<Object.<DittoFile>>} files 
 * @param {Object.<Ditto>} Ditto 
 * @param {Array.<Object>} templates
 * @param {Function.<Error>} callback
 */
DittoHbs.prototype.renderHtml = function(files, Ditto, templates, callback) {
  files.forEach(function(file){
    let
      parsedPath = path.parse(file.path),
      newFileDotPath = (parsedPath.name !== "index") ?
        path.join(parsedPath.dir, parsedPath.name, "index.html") :
        path.join(parsedPath.dir, parsedPath.name + ".html");
  });
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