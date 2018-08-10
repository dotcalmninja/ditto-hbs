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
  async.waterfall([
    this.discoverPartials.bind(this),
    this.registerPartials.bind(this),
    this.discoverTemplates.bind(this),
    this.registerTemplates.bind(this),
    this.renderHtml.bind(this, files, Ditto)
  ], function(err, files) {
    done(err, files);
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
    callback(null, {
      name: path.parse(filepath).name,
      template: hbs.compile(data)
    });
  });
};

/**
 * @param {Array.<Object.<DittoFile>>} files 
 * @param {Object.<Ditto>} Ditto 
 * @param {Array.<Object>} templates
 * @param {Function.<Error>} callback
 */
DittoHbs.prototype.renderHtml = function(files, Ditto, templates, callback) {
  let self = this;

  files.forEach(function(file) {
    //update the file extension as we're writing rendering html now
    file.path.ext = '.html';

    //build up array of potential templates
    let potentialTemplateNames = [file.path.name, parsedPath.dir.replace('/', '-'), self.opt.defaultTemplate];
    
    //resolve template
    potentialTemplateNames.some(function(potentialTemplateName){
      var tmpl = templates.find(function(template){ return template.name == potentialTemplateName });
      
      if(tmpl){
        //render
        file.content.metadata = Ditto._metadata;
        file.content = tmpl.template(file.content);        
        return true;
      }
    });
  });

  callback(null, files);
};