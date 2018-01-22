/*
 * Ditto Handlebars Middleware
 */
const
  events = require('events'),
  fs = require('fs'),
  glob = require('glob'),
  hbs = require('handlebars'),
  path = require('path'),
  util = require('util');

module.exports = DittoHbs;

function DittoHbs(opt) {
  this.opt = opt || this.getDefaultOpt();

  this.files = {};
  this.metadata = {};
  this.templates = {};

  if (typeof opt.helpers === 'function') {
    opt.helpers(hbs);
  }
};

/* Inherit Event Emitter prototype */
util.inherits(DittoHbs, events.EventEmitter);

/* Run */
DittoHbs.prototype.run = function(files, Ditto, done) {
  this.files = files;
  this.metadata = Ditto._metadata;

  //register listeners
  this.registerListeners(done);

  //kickoff build
  this.discoverPartials();
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

/* Discover Partials */
DittoHbs.prototype.discoverPartials = function() {
  let
    self = this,
    partialsDir = path.resolve(self.opt.partials);

  self.findHandlebars(path.join(partialsDir, '/*.hbs'), function(err, filepaths) {
    self.emit("foundPartials", filepaths);
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

/* Default opt {} */
DittoHbs.prototype.getDefaultOpt = function() {
  return {
    defaultTemplate: 'index',
    partials: './templates/partials',
    templates: './templates'
  };
};

DittoHbs.prototype.findHandlebars = function(pattern, callback) {
  glob(pattern, callback);
};

/* Register Listeners */
DittoHbs.prototype.registerListeners = function(done) {
  this.on("foundPartials", this.registerPartials);
  this.on("registeredPartials", this.discoverTemplates);
  this.on("foundTemplates", this.compileTemplates);
  this.on("compiledTemplates", this.renderHtml);
  this.on("renderHtmlComplete", done);
};

/* Register Partials */
DittoHbs.prototype.registerPartials = function(filepaths) {
  let
    self = this,
    partialsDir = path.resolve(self.opt.partials),
    promises = [];

  filepaths.map(function(filepath) {
    promises.push(self.registerPartial(path.resolve(partialsDir, filepath)));
  });

  Promise.all(promises)
    .then(function() {
      self.emit("registeredPartials");
    })
    .catch(function(reason) {
      console.error(reason);
      throw new Error(reason);
    });
};

/* Register Partial Async */
DittoHbs.prototype.registerPartial = function(filepath) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filepath, 'utf8', function(err, data) {
      if (err) reject(err);
      else {
        hbs.registerPartial(path.parse(filepath).name, data);
        resolve();
      }
    });
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